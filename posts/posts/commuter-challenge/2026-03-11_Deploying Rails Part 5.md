---
title: Deploying Rails to AWS, Part 5
group: Billings Commuter Challenge
date: 2026-03-11
---
# {{ $frontmatter.title }}

This is Part 5 of the Deploying Rails to AWS series. Here is [Part 4](2026-03-07_Deploying%20Rails%20Part%204.md) or you can start at the beginning, here is [Part 1](2025-09-13_Deploying%20Rails%20Part%201.md).

Today I want to deploy the Commuter Challenge with [Kamal](https://kamal-deploy.org). Kamal is a deployment tool that simplifies deploying containerized applications. You just set up some config files and run a few commands, and Kamal does the rest. It feels like Capistrano, but for containerized deployments.

## Deploying with Kamal

### Production Dockerfile and EC2 Host

The first step is create a Dockerfile for production. This was straightforward. I used the previously created development Dockerfile and changed the environment variables for production. I also created an ubuntu instance in the default VPC to host the application, and a new key pair for SSH access. The EC2 instance also needed a role with the ability pull from the ECR registry and to read secrets from AWS Secrets Manager. I created one with the `AmazonEC2ContainerRegistryReadOnly` and `AWSSecretsManagerClientReadOnlyAccess` policies.

### Adding and Configuring Kamal

New Rails 8 apps come with Kamal by default, but this project was started back in Rails 4. So I added the gem and installed it. Then I ran `kamal init`. This created a few template file needed for configuring the deployment: `config/deploy.yml`, `.kamal/secrets`, and `.kamal/hooks`. The `deploy.yml` is where you configure the deployment settings, the `secrets` file is where you store any secrets needed for the deployment, and the `hooks` directory is used to add any custom scripts that need to be run in different stages of the deployment.

The next step is to add configurations for deploying to the EC2 instance. I added the service name, image name, the servers configuration, proxy and the registry settings.

I decided to use AWS ECR as the container registry. I created a new repository, and gave it a lifecycle policy to only keep the last 10 images. Next add the registry settings to the `deploy.yml` file and `AWS_ECR_PASSWORD` to the secrets file (shown below).

```yaml
# deploy.yml
# Name of your application. Used to uniquely configure containers.
service: billings-commuter-challenge

# Name of the container image.
image: billings-commuter-challenge/deploy

# Deploy to these servers.
servers:
  web:
    - <IP ADDRESS>

proxy:
  ssl: false
  host: <IP ADDRESS>
  # Proxy connects to your container on port 80 by default.
  app_port: 3000
  forward_headers: true

registry:
  server: <ECR URI>
  username: AWS
  password:
    - AWS_ECR_PASSWORD
```

```
# .kamal/secrets
AWS_ECR_PASSWORD=$(aws ecr get-login-password --region us-east-2)
```

You shouldn't put sensitive information into the secrets file, instead you should fetch them from a secrets manager or the rails credentials file. This way you can check in the secrets file without worry. I'll need the RAILS_MASTER_KEY as well, so I created a new secret in AWS Secrets Manager and added it to the file.

```
# .kamal/secrets
RMK=$(kamal secrets fetch --adapter aws_secrets_manager commuterchallenge/master-key)
RAILS_MASTER_KEY=$(kamal secrets extract rails_master_key $RMK)
```

Next I configured the env, ssh, builder, and volume settings. The env definition is used for passing environment variables to the container. They can be passed as clear or secret. Secrets are not passed directly but stored on a file on the host. Being a secret, `RAILS_MASTER_KEY` is included under the secrets. We will use the `clear` in a later step for database configuration. The ssh, builder and volumes are self-explanatory.

```yaml
# deploy.yml
env:
  # clear:
  secret:
    - RAILS_MASTER_KEY

# We are building to run onn an arm64 EC2
builder:
  arch: arm64

ssh:
  user: ubuntu
  keys: [ "~/.ssh/the-ec2-ssh-key.pem" ]

volumes:
  - "billings-commuter-challenge_storage:/rails/storage"
```

### Configuring the Postgres Database

Before we can test our initial deployment, Rails requires a database to run. I am not going to use RDS to save costs, but will instead run a Postgres container. Kamal has a handy configuration option called `accessories`. Accessories are run alongside your application to add additional capabilities... databases, caches, etc.

The Commuter Challenge uses postgres, here's how I configured it. I added an accessory called `db` that uses the postgres:15 image. Kamal knows to how handle this and will pull the image from Docker Hub. You specify the host where the container will run (currently on the same EC2 host), port config, environment variables, and a couple options for files and directories.

The `port: "127.0.0.1:5432:5432"` is important to only expose the database on the localhost of the EC2 instance. This way it won't be accessible from the outside world if you left it as `port: 5432`. You will also notice there's new secret for the database password. I added it to the AWS Secrets Manager and the secrets file. There are also a few more `clear` environment variables.

```yaml
# deploy.yml
env:
  clear:
    DB_HOST: billings-commuter-challenge-db
    COMMUTERCHALLENGE_DATABASE: commuterchallenge_production
    COMMUTERCHALLENGE_DATABASE_USERNAME: commuterchallenge
  secret:
    - RAILS_MASTER_KEY
    - POSTGRES_PASSWORD

accessories:
  db:
    image: postgres:15
    host: <IP ADDRESS>
    port: "127.0.0.1:5432:5432"
    env:
      clear:
        POSTGRES_USER: commuterchallenge
        POSTGRES_DB: commuterchallenge_production
        DB_HOST: 127.0.0.1
        DB_PORT: 5432
      secret:
        - POSTGRES_PASSWORD
    directories:
      - data:/var/lib/postgresql/data
    files:
      - db/production_setup.sql:/docker-entrypoint-initdb.d/setup.sql
```

```
# .kamal/secrets
DB_SECRETS=$(kamal secrets fetch --adapter aws_secrets_manager commuterchallenge/db/prod)
POSTGRES_PASSWORD=$(kamal secrets extract password $DB_SECRETS)
```

Then the `database.yml` config requires updates to use the environment variables configured in `deploy.yml`.

```yaml
# config/database.yml
production:
  <<: *default
  database: <%= ENV['COMMUTERCHALLENGE_DATABASE'] %>
  username: <%= ENV['COMMUTERCHALLENGE_DATABASE_USERNAME'] %>
  password: <%= ENV['POSTGRES_PASSWORD'] %>
  host: <%= ENV["DB_HOST"] %>
```

The last piece before testing was to add a simple script to create the database.

```sql
-- db/production_setup.sql
CREATE DATABASE commuterchallenge_production;
```

### Initial Deployment & Testing

The deployment process included a bit of trial and error, but most problems where small. In this section, I'll describe a few notable issues and how I fixed them.

#### Kamal Health Check

The first issue was that the deployment completed without errors but server was returning 404 responses. The fix was simple but the investigation took some time. I logged into the host and saw that the container for the rails app was continually rebooting. I eventually found the right logs, and it is running a health check and rebooting the container every minute because of a failing health check.

The fix was to simply map the health check controller to `/up` for the in `routes.rb`. This was a feature introduced in Rails 7 that I didn't enable when upgrading. When I configure SSL, I need to remember to exclude this endpoint, so it doesn't return a 301.

```ruby
# config/routes.rb
get "up" => "rails/health#show", as: :rails_health_check
```

#### DB Connection Issues

When I initially deployed the database, there were some invalid settings in the `deploy.yml` where it was created with invalid environment variables. So, there was no valid user to log into. It seemed like changes to `deploy.yml` weren't being applied and I needed to remove the database and start fresh.

```shell
kamal accessory remove db
kamal accessory boot db
```

After that I could connect with `pqsl`.

#### DB Not Initialized

I'm pretty sure I read that kamal would run database setup or migrations automatically, but for whatever reason the database and tables weren't created. Perhaps it had to do with the app being migrated from or the previous deployment failures when setting up the database. It was easy enough to run them manually though:

```shell
kamal app exec --primary -i 'bin/rails db:create'    
kamal app exec --primary -i 'bin/rails db:migrate'
```

### Other Cool Features

#### Kamal Has Great Logging

When running commands it's easy to see what kamal is doing. It's useful for debugging and I learned a bit on how Kamal was setting up and running the docker containers.

#### Kamal Aliases

The default config comes with some aliases out of the box to access your console or logs of your deployed application. I found the logs and console invaluable for debugging the initial deployment.

```yml
aliases:
  console: app exec --interactive --reuse "bin/rails console"
  shell: app exec --interactive --reuse "bash"
  logs: app logs -f
  dbc: app exec --interactive --reuse "bin/rails dbconsole --include-password"
```

#### Commands for Just about Anything

Kamal comes with a [plethora of commands](https://kamal-deploy.org/docs/commands/view-all-commands/) in addition to `kamal setup` and `kamal deploy` to help managed your deployment. The `accessory`, `secrets`, `config`, and `app exec` commands were particularly useful.

## Conclusions

In the end I'm pleased with Kamal and as a deployment tool. It was pretty easy to learn and I had a mostly functional Commuter Challenge app running on AWS in just one evening. This is how I'll migrate to AWS. It's simple, and more affordable than previous ideas. I can always expand later if needed.

I still have a lot of work to do. I need to finish a few more configurations and prep for the migration:

- DNS migration and SSL
- S3 and CloudFront
- Postmark
- DB migration
- Jobs for regular DB backups