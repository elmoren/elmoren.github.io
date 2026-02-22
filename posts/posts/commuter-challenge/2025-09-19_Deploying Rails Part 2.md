---
title: Deploying Rails to AWS, Part 2
group: Billings Commuter Challenge
date: 2025-09-19
---

# {{ $frontmatter.title }}

This is Part 2 of the Deploying Rails to AWS series. If you haven't yet, I recommend you start at [Part 1](2025-09-13_Deploying%20Rails%20Part%201.md). In Part 1, I set up nginx, passenger, and an ALB to serve the default nginx installation page. The goal of today's post is to configure our webserver to host a default Rails application. I'll deploy with Rails 7.1 and Ruby 3.x.

This took a bit longer and was a more frustrating than I hoped. I ran into issues that required various levels of digging at each step. I did this for the Commuter Challenge on Digital Ocean five years ago, and forgot quite a bit since then.

## Hello World App

The first step is create a simple Rails app. On my local machine, I created a new git repo `aws-rails-test` and initialized a new Rails project and a simple page. 

I am doing this rather than cloning the Commuter Challenge, so I can focus on the essentials and not worry about all the production config (DB config, secrets, SSL, content delivery and other custom config in that application.)

```shell
rails create aws-rails-tests
bin/rails generate controller HelloWorld index --skip-routes
```

I wrote simple view. Then I updated the `routes.rb` to use that `Hello World` as the root and verified it runs locally.

```ruby
Rails.application.routes.draw do

  root "hello_world#index"
  get "/hello_world", to: "helloworld#index"

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

end
```

You can find the code on my [github](https://github.com/elmoren/aws-rails-test) account, but there's really nothing interesting in it

### Ruby, Nginx and Passenger

Now on to configuring the EC2 instance. I'll do everything under the `ubuntu` user created by default. If I was doing this for production, I would create a new deployment user and set up the environment, and nginx deployment directory there. First thing is that the server needs to be able to run the same Ruby version as the `aws-rails-test` app. The server has 3.2 installed and we need `3.4.6`. There are a few ways to do this. I am using [rbenv](https://github.com/rbenv/rbenv). The Ubuntu rbenv package doesn't have any of the newer versions I installed the version from github.

```shell
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
~/.rbenv/bin/rbenv init
git clone https://github.com/rbenv/ruby-build.git "$(rbenv root)"/plugins/ruby-build

rbenv install 3.4.6
rbenv global 3.4.6
```

Note the path of the ruby installation. It will be in `/home/ubuntu/.rbenv/versions/3.4.6/bin/ruby` if you used rbenv.

Next, change directory to `/var/www` and clone the repo. Update the `/etc/nginx/sites-enabled/default` config file's `root` and `passenger_ruby` fields.

```shell
server {
        listen 80 default_server;
        listen [::]:80 default_server;
        
        root /var/www/aws-rails-test/public;
        
        index index.html index.htm index.nginx-debian.html;
        
        server_name _;

        passenger_enabled on;
        passenger_ruby /home/ubuntu/.rbenv/versions/3.4.6/bin/ruby;
}
```

### Run the Bundler

The bundler is already installed so lets see if it runs.

```shell
cd /var/www/aws-rails-test
bundle install
```

The SSM session froze when bundling and I couldn't reconnect. That's odd. I forced shutdown and restarted the instance and got the same result again. The logs showed some entries that made me suspect there's not enough memory and `htop` shows there's not much headroom there. So I upped the instance type to a `t4g.small` and tried again. 

It's progressing! ...and then it failed. At least there's an error this time. The build logs show that it's just missing a few packages. I installed those and the build completed.

```shell
sudo apt-get install pkg-config libffi-dev
bundle install
```

Next I set up the secrets. Remove the `config/credentials.yml.enc`, if it exists, and create a new one using the rails commands. Just close it once it opens the new file in your editor. For this demo, this is all that's needed.

```shell
export EDITOR=vi
bin/rails credentials:edit
```

Lastly we need to give ownership of the directory to nginx and restart it.

```shell
sudo chown -R www-data:www-data .
sudo service nginx restart
```

## Validating and Debugging

### 301 Redirects

Now on to testing. On the terminal, I'll run curl to see I can pull the hello world page locally.

```shell
curl http://localhost
```

It's giving a 301 response. Looking at the production config it is forcing ssl. Makes sense for production, but configuration SSL is outside what I'm trying to accomplish today.  Comment out the `config.force_ssl = true` line in `config/environments/production.rb`

Restart nginx and retry and curl returns the expected page. 

### 500 Server Errors

The browser returning the page very slowly. And when it does, it is returning a server error. 

![Error](/public/posts/bcc/error.png "Error page")

What do the logs say? The server is unable to find some files. Ah, for the default production configuration, you need to precompile the assets. Easy fix:

```shell
bin/rails assets:precompile
```

That's fixed, but it still loads slow or times out.

### Time Outs

It's odd that it would time out since it was working fine with the default nginx page. I spent some time looking at the AWS ALB settings, reading logs, etc. but what led me to the solution was running curl with verbose flags.

```shell
curl -v http://app-alb-982823882.us-east-2.elb.amazonaws.com/
* Host app-alb-982823882.us-east-2.elb.amazonaws.com:80 was resolved.
* IPv6: (none)
* IPv4: 18.224.143.140, 18.218.102.71
*   Trying 18.224.143.140:80...
* connect to 18.224.143.140 port 80 from 192.168.50.55 port 63875 failed: Operation timed out
*   Trying 18.218.102.71:80...
* Connected to app-alb-982823882.us-east-2.elb.amazonaws.com (18.218.102.71) port 80
> GET / HTTP/1.1
> Host: app-alb-982823882.us-east-2.elb.amazonaws.com
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 OK

### ... and so on.
```

I see! The request resolves to two IPs, tries the first IP, times out, then successfully tries the other. During setup, the AWS ALB requires at least two AZs, even when using a single instance in the target group. I used the `sn-web-A` and `sn-web-B` subnets previously created. Perhaps something is missing in the `sn-web-B` subnet. Sure enough, it wasn't associated to a route table and there's no route to the internet gateway. One quick update and it works!

![Hello World](/public/posts/bcc/success.png "Hello world page")

And if you request nonexistent resource, it should return the rails 404 page...

![Rails 404](/public/posts/bcc/404.png "404 page")

### Conclusions

With that, the EC2 is hosting the simple rails app, and it's accessible over the open internet with the ALB DNS host. This turned out to more work than expected. I wasn't expecting the EC2 to just crash and lock up when running the bundle install. And all the little issues eat up the time. I'm satisfied with the result and feel like I know a lot more about the work I'll need to do with the full Commuter Challenge app.

For the Part 3, I want to configure CodeDeploy to see how to deploy code changes.