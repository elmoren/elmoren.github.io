---
title: Refactoring - CloudFormation Template
---

# {{ $frontmatter.title }}

It's been too long since I worked on this project. My weekends have been focused on my other hobbies and when I'm up for
AWS, I have been working through the class. I am 90% through Adrian Cantrill's [SAA-C03](https://learn.cantrill.io/p/aws-certified-solutions-architect-associate-saa-c03)
course now (highly recommended btw) and am pushing to complete it.

## Cross-Stack References

I just finished the course section on CloudFormation, so I am organizing my stack template and writing a short post. I have 
everything in a single template it's getting rather large and unruly. I am going to group stack resources logically into 
their own stacks and use Cross-Stack References. By making the stacks modular, they should reusable, faster to deploy and 
easier to maintain.

I created 5 template files to :

* `vpc.yaml` - VPC, Subnets, IGW, and Route Tables
* `ssm.yaml` - Roles, Endpoints and Security Groups for SSM
* `app.yaml` - The EC2 and Instance Profile
* `db.yaml` - RDS Instance, DB Subnet Group and Ingress/Egress Security Groups
* `fck-nat.yaml` - Launch Template, Auto-Scaling Group, Interface, etc. needed for fck-nat

After some copying pasting resources into their new template files, I specified [Outputs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html) 
where needed, and referenced the outputs with`!ImportValue` in the other templates. With only minimal issues, it was
up and running.

I still need to set up an S3 Bucket and CloudFront before I switch to bootstrapping the Rails deployments. However, with the commuter challenge coming up in June it may be some time before I get to it.
