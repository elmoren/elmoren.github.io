---
title: VPC and Subnets
---

# {{ $frontmatter.title }}

This is the first post and first steps in the project of migrating the Billings Commuter Challenge from Digital Ocean to AWS. The reason for this migration is purely educational. Digital Ocean has served the Commuter Challenge well, but this project is the perfect size and complexity for learning AWS. It is complex enough to be interesting, but not so much that it is overwhelming.

## VPC

After creating a new AWS account and setting up and administrator IAM user, the first task is the networking configuration. I decided to create a VPC with a `10.16.0.0/16` CIDR. This is overkill for the Commuter Challenge but it won't hurt anything and has plenty of room to grow.

## Subnets

I decided to create 4 subnets over 3 AZs. One for reserved, database, app, and web. Each subnet is allocated 4096 IPv4 addresses. Initially, I plan to get the Commuter Challenge working on AZA, then in the future I can add resiliency with the other AZs. This also leaves room for another four subnets of the same size.

| Subnet | AZ | CIDR |
|-------|-----|-----|
| sn-reserved-A | AZA | 10.16.0.0/20 |
| sn-db-A | AZA | 10.16.16.0/20 |
| sn-app-A | AZA | 10.16.32.0/20 |
| sn-web-A | AZA | 10.16.48.0/20 |
| sn-reserved-B | AZB | 10.16.64.0/20 |
| sn-db-B | AZB | 10.16.80.0/20 |
| sn-app-B | AZB | 10.16.96.0/20 |
| sn-web-B | AZB | 10.16.112.0/20 |
| sn-reserved-C | AZC | 10.16.128.0/20 |
| sn-db-C | AZC | 10.16.144.0/20 |
| sn-app-C | AZC | 10.16.160.0/20 |
| sn-web-C | AZC | 10.16.172.0/20 |

If this looks familiar, you've probably also studied with Adrian Cantrill's [courses](https://learn.cantrill.io). This simple structure is based off his examples in the AWS CSA course.

## Cloud Formation Stack - 11/05/2024 Update

After manually creating the VPCs and subnets, I wanted to create them with CloudFormation. I don't know how often I'll be able to work on this, so being able to quickly allocate and deallocate infrastructure with a click will save a few bucks before we go live. Plus, it's just plain cool.

```yaml
Description:  Commuter Challenge Base VPC
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.16.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: bcc-vpc1
  SubnetReservedA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: 10.16.0.0/20
      Tags:
        - Key: Name
          Value: sn-reserved-A
  SubnetReservedB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: 10.16.64.0/20
      Tags:
        - Key: Name
          Value: sn-reserved-B
  SubnetReservedC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      CidrBlock: 10.16.128.0/20
      Tags:
        - Key: Name
          Value: sn-reserved-C
  SubnetDBA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: 10.16.16.0/20
      Tags:
        - Key: Name
          Value: sn-db-A
  SubnetDBB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: 10.16.80.0/20
      Tags:
        - Key: Name
          Value: sn-db-B
  SubnetDBC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      CidrBlock: 10.16.144.0/20
      Tags:
        - Key: Name
          Value: sn-db-C
  SubnetAPPA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: 10.16.32.0/20
      Tags:
        - Key: Name
          Value: sn-app-A
  SubnetAPPB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: 10.16.96.0/20
      Tags:
        - Key: Name
          Value: sn-app-B
  SubnetAPPC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      CidrBlock: 10.16.160.0/20
      Tags:
        - Key: Name
          Value: sn-app-C
  SubnetWEBA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: 10.16.48.0/20
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: sn-web-A
  SubnetWEBB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: 10.16.112.0/20
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: sn-web-B
  SubnetWEBC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      CidrBlock: 10.16.176.0/20
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: sn-web-C
Outputs:
  bccvpc1:
    Description: Billings Commuter Challenge VPC1_ID
    Value: !Ref VPC
    Export: 
      Name: bcc-vpc1
  bccvpc1subnetweba:
    Description: Billings Commuter Challenge VPC1 SubnetWEBA
    Value: !Ref SubnetWEBA
    Export:
      Name: bcc-vpc1-subnet-weba
  bccvpc1subnetwebb:
    Description: Billings Commuter Challenge VPC1 SubnetWEBB
    Value: !Ref SubnetWEBB
    Export:
      Name: bcc-vpc1-subnet-webb
  bccvpc1subnetwebc:
    Description: Billings Commuter Challenge VPC1 SubnetWEBC
    Value: !Ref SubnetWEBC
    Export:
      Name: bcc-vpc1-subnet-webc
  bccvpc1subnetappa:
    Description: Billings Commuter Challenge VPC1 SubnetAPPA
    Value: !Ref SubnetAPPA
    Export:
      Name: bcc-vpc1-subnet-appa
  bccvpc1subnetappb:
    Description: Billings Commuter Challenge VPC1 SubnetAPPB
    Value: !Ref SubnetAPPB
    Export:
      Name: bcc-vpc1-subnet-appb
  bccvpc1subnetappc:
    Description: Billings Commuter Challenge VPC1 SubnetAPPC
    Value: !Ref SubnetAPPC
    Export:
      Name: bcc-vpc1-subnet-appc
  bccvpc1subnetdba:
    Description: Billings Commuter Challenge VPC1 SubnetDBA
    Value: !Ref SubnetDBA
    Export:
      Name: bcc-vpc1-subnet-dba
  bccvpc1subnetdbb:
    Description: Billings Commuter Challenge VPC1 SubnetDBB
    Value: !Ref SubnetDBB
    Export:
      Name: bcc-vpc1-subnet-dbb
  bccvpc1subnetdbc:
    Description: Billings Commuter Challenge VPC1 SubnetDBC
    Value: !Ref SubnetDBC
    Export:
      Name: bcc-vpc1-subnet-dbc
  bccvpc1subnetreserveda:
    Description: Billings Commuter Challenge VPC1 SubnetReservedA
    Value: !Ref SubnetReservedA
    Export:
      Name: bcc-vpc1-subnet-reserveda
  bccvpc1subnetreservedb:
    Description: Billings Commuter Challenge VPC1 SubnetReservedB
    Value: !Ref SubnetReservedB
    Export:
      Name: bcc-vpc1-subnet-reservedb
  bccvpc1subnetreservedc:
    Description: Billings Commuter Challenge VPC1 SubnetReservedC
    Value: !Ref SubnetReservedC
    Export:
      Name: bcc-vpc1-subnet-reservedc
```

Next, I'll start working on diagramming the infrastructure. There's some questions to answer first though, like "How do I want to host rails and the database, and do I want to change it?". The Rails application is currently on a Digital Ocean droplet, so switching to EC2 is probably the easiest path forward. RDS is pretty expensive for a project of this size, so I'll want to run my own database. Getting the Commuter Challenge working on ECS would be fun, but I think the cost is more than I would like currently. Lambdas would be fun, but I would have to change the entire stack.
