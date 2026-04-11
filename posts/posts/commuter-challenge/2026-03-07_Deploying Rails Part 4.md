---
title: Deploying Rails to AWS, Part 4
group: Billings Commuter Challenge
date: 2026-03-07
---
# {{ $frontmatter.title }}

This is Part 4 of the Deploying Rails to AWS series. Here is [Part 3](2026-02-22_Deploying%20Rails%20Part%203.md) or if you need to start at the beginning, here is [Part 1](2025-09-13_Deploying%20Rails%20Part%201.md).

Next steps is to test ECS to learn it and see if it will work for the Commuter Challenge. I am going to start simple and run a simple NGINX container before I worry about all the configurations for the Commuter Challenge. I want to get a feel for how it works and what the deployment process looks like.

## ECS Clusters, Services and Tasks

The first step is create and cluster in ECS. For simplicity I used the default public VPC. Using the AWS Console, cluster with the EC2 launch type. This will allow me to run my containers on EC2 instances that are part of the cluster. I then created a task definition using an NGINX image on Docker Hub and finally created a service to run the task on the cluster. I set the desired number of tasks to 1 and left the rest of the settings as default.

I then had to adjust the default security group to allow inbound traffic on port 80 so I could access the NGINX server. After that, I was able to access the NGINX welcome page. I spent some time with the AWS cli learning how to query and control the cluster. The LLM was helpful here in that they were pretty good at knowing the command syntax to accomplish what I wanted to do.

## Running on a Private Subnet

For next test, I want to run it in the Commuter Challenge VPC on the private application subnets. I created a new cluster configured for the private subnets and then created a new task definition and service using the same NGINX image. I ran into a few issues here. First the EC2 instance couldn't register with the cluster. It looks like I need a NAT Gateway or a VPC endpoints to give the EC2 instance access to the ECS control plane.

Then to get public access, I need an Application Load Balancer to route traffic to the service on the private subnet. While this is fun to set up temporarily, I need to rethink the architecture for the Commuter Challenge. It's great to explore all the different services and how they work together but I need to keep the costs in mind. This is all overkill for this project.

## Conclusions

Today didn't go quite according to plan, but it was a fun experiment in ECS and I have better understanding of how it works.  I might need the capabilities of ECS or Fargate someday, but right now I need a simpler and more cost effective solution. I think I'll take a look at [Kamal](https://kamal-deploy.org) and see about a simple EC2 deployment or even keeping it on [Digital Ocean](https://www.digitalocean.com).
