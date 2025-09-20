---
title: Deploying Rails to EC2, Part 1
---

# {{ $frontmatter.title }}

Today I am finally getting back to deploying the Commuter Challenge Rails app in EC2.

## Goals

The ultimate goal of this series is to deploy a Rails app in AWS using the architecture previously created. This will be a multipart series because there's a lot of ground to cover. The steps will be to:

1. Configure the EC2 application instance to run [nginx](https://nginx.org/en/), [passenger](https://www.phusionpassenger.com/docs/advanced_guides/developing_with_passenger/ruby/rails_integration.html#passenger-ruby-on-rails-integration)
2. Set up and deploy a new [Rails](https://rubyonrails.org) app with production configuration set to use the AWS config needed. (RDS as the DB, etc.)
3. Setting up a deployment pipeline. The current configuration uses [capistrano](https://capistranorb.com) to deploy to Digital Ocean, but I would like to try out some of the AWS tools like CodeDeploy.

Afterwords, I have a decision to make: Do I want to fully migration this project to AWS? It'll be more expensive than Digital Ocean. If yes, do I want to go the simpler route of [Elastic BeanStalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/ruby-rails-tutorial.html)? Honestly this makes more sense for a project this size. I didn't use BeanStalk initially because I wanted to learn. Then I would need to:

1. Branch the Commuter Challenge code and deploy the full app. This will be mostly config updates, wiring in DB, S3 bucket, Cloud Front, etc.
2. Change the hosting, Route 53, Postmark recovery emails, SSL certificates, and other configuration tasks.
3. Bootstrap the EC2 instances and blue-green deployments?

## Running the Webserver

### Cloud Formation Adjustments

I decided to swap to Ubuntu instead of Amazon Linux for Rails. The reason being is that there's a plethora of documentation and community posts for this stack with Ubuntu. To do this I pulled the available Ubuntu 24 AMI SSM parameters with `aws ssm describe-parameters --parameter-filters Key=Name,Option=Contains,Values=/aws/service/canonical/ubuntu/server/` and chose the ARM64 and updated the CF template to pull the image id from this parameter: `/aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id`.

I connected to the instance VIA Session Manager and noticed I was unable to update the packages and I couldn't ping anything. It should be routing through the nat instance and the only thing I changed was the AMI. Oh wait, I can't ping per the instance security group. The `curl` command works for https but not http. I manually added an egress rule to allow http on port 80 and was able to run the `apt-get update`.

I updated the CFN template to create the rule by removing the `InstanceSecurityGroupSSMEgress` resource in the SSM template and added the following rules under the `InstanceSecurityGroup` resource in the VPC CFN template. Then I continued with the installation.

```yaml
      SecurityGroupEgress:
        - Description: 'Allow HTTP egress traffic'
          IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - Description: 'Allow HTTPS egress traffic'
          IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
```

### Nginx and Passenger

The next steps are mostly `apt` commands and following documentation to install Nginx and Passenger. I'll post the commands but won't spend much time on them as they are pretty much verbatim from documentation.

```shell
# Nginx install
sudo apt-get update
sudo apt-get install nginx
sudo service nginx restart

# Passenger install
sudo apt-get install -y dirmngr gnupg apt-transport-https ca-certificates curl
curl https://oss-binaries.phusionpassenger.com/auto-software-signing-gpg-key.txt | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/phusion.gpg >/dev/null
sudo sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger noble main > /etc/apt/sources.list.d/passenger.list'
sudo apt-get update
sudo apt-get install -y libnginx-mod-http-passenger
if [ ! -f /etc/nginx/modules-enabled/50-mod-http-passenger.conf ]; then sudo ln -s /usr/share/nginx/modules-available/mod-http-passenger.load /etc/nginx/modules-enabled/50-mod-http-passenger.conf ; fi
sudo ls /etc/nginx/conf.d/mod-http-passenger.conf
sudo service nginx restart

# Validate the install
sudo /usr/bin/passenger-config validate-install
sudo /usr/sbin/passenger-memory-stats

# Test it locally. 
sudo curl localhost
```

The nginx server is up and running and the `passenger-memory-stats` shows passenger is running.

### Application Load Balancer

Now I want to access the web server over the public internet. If you remember, we have public and a private subnets in multiple AZs. The purpose was for a highly available deployment. This is of course overkill for this project, but it's fun to demo. 

I won't show the AWS forms for setting up and ALB, but the steps to get this up and running are to:

1. Create a target group, add the EC2 to it, and use HTTP health checks
2. Create an ALB, associated with the subnets, and configure the listener to forward to the created target group.

 I copied the ALB public URL and... it timed out. The health checks are showing all green. It's probably a security issue. Sure enough, the security group attached to the ALB was not set up to allow inbound HTTP traffic.
 
With a new rule and a page refresh, it's done!

![Nginx](/public/posts/bcc/nginx.png "Nginx default index page")

### Conclusions

This concludes the part 1 in the series to host a Rails App on our EC2 instance. It covers some missing configurations in the cloudformation templates, setting up Nginx and setting up an ALB. 

I'll use the commands above to create a bootstrapping script and add to it as we go. I may update the cloud formation templates to create the ALB as well. The next post in the series will focus on running a Rails app on the webserver. 