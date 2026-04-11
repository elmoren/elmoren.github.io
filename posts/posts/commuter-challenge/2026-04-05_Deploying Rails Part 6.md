---
title: Deploying Rails to AWS, Part 6
group: Billings Commuter Challenge
date: 2026-04-05
---
# {{ $frontmatter.title }}

This is Part 6 of the Deploying Rails to AWS series. Here is [Part 5](2026-03-11_Deploying%20Rails%20Part%205.md) or you can start at the beginning, here is [Part 1](2025-09-13_Deploying%20Rails%20Part%201.md).

This will be last post of the **Deploying Rails to AWS** series to migrate the Billings Commuter Challenge to AWS. In this post, I'll briefly will cover the last few steps to fully migrate the Commuter Challenge to AWS.

## The Last Few Steps

### New Instance

I started with a fresh EC2 instance and attached an elastic IP and IAM role. I updated the IP in the configuration and ran `kamal setup`. This installed Docker, but it was missing some permissions to complete. I then added the user to the docker group, ran the setup again, created the DB and ran the migrations. 

```shell
kamal setup
kamal app exec --primary -i 'bin/rails db:create'
kamal app exec --primary -i 'bin/rails db:migrate'
```

This all took less than ten minutes for a new server and running application. Awesome!

### Data Migration

The data migration took the most time, mostly because I wasn't sure how to restore the dump to a containerized database. I used scp to copy the dump to the EC2 instance and ran a docker exec.

```bash
cat db_dump.dump | docker exec -i 8cfecabd6a25 pg_restore -d commuterchallenge_production
```

### S3

For user profile pictures, events and incentives, I use Rail's Active Storage tools. I created an S3 bucket with a previously generated CFN template and then updated the ActiveStorage configuration in rails for production. Then I gave the role attached to the EC2 instance access to it. Digital Ocean's [spaces](https://www.digitalocean.com/products/spaces) is S3 compatible so there was little to change.

### Postmark

All I needed to do was add the API key to the secrets manager and adjust the configuration to load it. This one tripped me up a little. The API key environment variable wasn't loading. I chased a red herring for a while, and it ended up being a typo in the ENV name. Whoops!

### SSL

Setting up SSL in Rails and Kamal was a breeze. I updated the DNS records, updated the config to hosts instead of IPs and added `ssl: true` to the Kamal proxy configuration. 

So easy! I _really_ appreciate this feature of Kamal.

## Conclusions

The Billings Commuter Challenge is now containerized and hosted on AWS!

Over this series, I explored building a full-fledged application in AWS with a three tiered VPC, EC2 instances, RDS, S3, auto-scaling, and an ALB. I made adjustments to save costs with our own NAT EC2 instance, and removing the high availability requirement. I tried ECS and containerized our application.

Yes, this took a long time and I thought about starting with Kamal. The size and usage of Billings Commuter Challenge just doesn't justify a HA architecture. I used it as opportunity to design and learn how do it. This was a fun way to dig into it and learn.

I have a few ideas where to go next. First, I should set up regular database backups. I want to continue improving coding with AI tools and I also have some ideas on for a small app with API Gateway, Dynamo DB, and Lambdas.