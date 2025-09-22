---
title: Architecture and EC2
group: Billings Commuter Challenge
date: 2025-01-12
---
---

# {{ $frontmatter.title }}

## Architecture

Continuing with the simple Web, App and DB subnet design in the VPC, created with the following simple architecture diagram.
We'll use an EC2 instance in the private app subnet, a Postgres RDS instance in the DB subnet, and a NAT Gateway in the
public subnet. I'll host user uploaded content like profile pictures and event flyers on S3 and deliver them with
CloudFront.

![A Simple Architecture](/public/BCCSimpleArch.png "Architecture Diagram")

The first thing I wanted to do was set up an EC2 instance in the private subnet and get it updating.

## Step 1 - EC2 Instance with CloudFormation

While specifying a new instance in the console, I noticed the "Console to Code" feature. And what do you know? It has a
generative AI that wrote the CFN YAML. I made a few adjustments, but it worked.

```yaml
EC2AppA:
  Type: AWS::EC2::Instance
  Properties:
    InstanceType: "t2.micro"
    ImageId: ami-0df8c184d5f6ae949
    SubnetId: !Ref SubnetAppA
    Tags:
      - Key: Name
        Value: cc-app-server-a
```

It created an instance with CloudFormation. But as you might suspect, I had no way to connect to it...

## Step 2 - Internet and NAT Gateway

Specifying the Internet Gateway and NAT was a breeze using the Cloud Formation docs.

```yaml
InternetGateway:
  Type: 'AWS::EC2::InternetGateway'
  Properties:
    Tags:
      - Key: Name
        Value: cc-vpc1-igw
InternetGatewayAttachment:
  Type: 'AWS::EC2::VPCGatewayAttachment'
  Properties:
    VpcId: !Ref VPC
    InternetGatewayId: !Ref InternetGateway
```

And

```yaml
NatGatewayA:
  Type: 'AWS::EC2::NatGateway'
  Properties:
    AllocationId: !GetAtt NatGatewayElasticIPA.AllocationId
    SubnetId: !GetAtt SubnetWebA.SubnetId
    Tags:
      - Key: Name
        Value: cc-vpc1-natgw-web-a
NatGatewayElasticIPA:
  Type: 'AWS::EC2::EIP'
  DependsOn: InternetGatewayAttachment
  Properties:
    Domain: VPC
```

## Step 3 - Routes

Now we need some routing tables to connect the Internet Gateway to the public subnet, and to connect the private subnets
to the NAT.

For the IGW...

```yaml
RouteTableWeb:
  Type: 'AWS::EC2::RouteTable'
  Properties:
    VpcId: !Ref VPC
    Tags:
      - Key: Name
        Value: cc-vpc1-rt-web
RouteTableWebDefaultIPv4:
  Type: 'AWS::EC2::Route'
  DependsOn: InternetGatewayAttachment
  Properties:
    RouteTableId:
      Ref: RouteTableWeb
    DestinationCidrBlock: '0.0.0.0/0'
    GatewayId:
      Ref: InternetGateway
RouteTableAssociationWebA:
  Type: 'AWS::EC2::SubnetRouteTableAssociation'
  Properties:
    SubnetId: !Ref SubnetWebA
    RouteTableId:
      Ref: RouteTableWeb
```

And the NAT GW...

```yaml
RouteTablePrivateA:
  Type: 'AWS::EC2::RouteTable'
  Properties:
    VpcId: !Ref VPC
    Tags:
      - Key: Name
        Value: cc-vpc1-rt-private-a
RouteTablePrivateADefaultIPv4:
  Type: 'AWS::EC2::Route'
  DependsOn: InternetGatewayAttachment
  Properties:
    RouteTableId:
      Ref: RouteTablePrivateA
    DestinationCidrBlock: '0.0.0.0/0'
    NatGatewayId:
      Ref: NatGatewayA
RouteTablePrivateAAssociationAppA:
  Type: 'AWS::EC2::SubnetRouteTableAssociation'
  Properties:
    SubnetId: !Ref SubnetAppA
    RouteTableId:
      Ref: RouteTablePrivateA
RouteTablePrivateAAssociationDBA:
  Type: 'AWS::EC2::SubnetRouteTableAssociation'
  Properties:
    SubnetId: !Ref SubnetDBA
    RouteTableId:
      Ref: RouteTablePrivateA
RouteTablePrivateAAssociationReservedA:
  Type: 'AWS::EC2::SubnetRouteTableAssociation'
  Properties:
    SubnetId: !Ref SubnetReservedA
    RouteTableId:
      Ref: RouteTablePrivateA
```

## Step 4 - SSM and Authorization

Great! But, I still can't connect. I need a way to connect and authorization to do so. I found a few articles suggesting
that SSM is the preferred method, so I went with that.

The first thing I need is to create a security group to allow ssh traffic to the instance.

```yaml
InstanceSecurityGroup:
  Type: 'AWS::EC2::SecurityGroup'
  Properties:
    VpcId: !Ref VPC
    GroupDescription: Enable SSH access via port 22 IPv4
    SecurityGroupIngress:
      - Description: 'Allow SSH IPv4'
        IpProtocol: tcp
        FromPort: '22'
        ToPort: '22'
        CidrIp: '0.0.0.0/0'
InstanceSecurityGroupSelfReferenceRule:
  Type: "AWS::EC2::SecurityGroupIngress"
  Properties:
    GroupId: !Ref InstanceSecurityGroup
    IpProtocol: '-1'
    SourceSecurityGroupId: !Ref InstanceSecurityGroup
```

I'll admit there's _much_ more I need to learn about IAM Roles and Security Groups. I created an IAM Role with the
AmazonSSMManagedInstanceCore managed policy. It needs to be able to assume roles with ec2 and access to some SSM
functions. From some reading, many people think this managed policy is too permissive, particularly the GetParameter(s).
All I need currently is a way to get to the terminal on the instance, so I suspect there's more permissions I don't need
in this policy.

That said, this is a first step and I can take a deeper look later and refine it later.

```yaml
SessionManagerRole:
  Type: 'AWS::IAM::Role'
  Properties:
    RoleName: cc-ssm-iam-role
    AssumeRolePolicyDocument:
      Version: 2012-10-17
      Statement:
        - Effect: Allow
          Principal:
            Service:
              - ec2.amazonaws.com
          Action:
            - 'sts:AssumeRole'
    Path: /
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
SessionManagerInstanceProfile:
  Type: 'AWS::IAM::InstanceProfile'
  Properties:
    Path: /
    Roles:
      - !Ref SessionManagerRole
```

The session manager docs says it needs access to these endpoints:

> ec2messages.**region**.amazonaws.com\
> ssm.**region**.amazonaws.com\
> ssmmessages.**region**.amazonaws.com

So we create three VPC Endpoints:

```yaml
SSMInterfaceEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcEndpointType: "Interface"
    PrivateDnsEnabled: "True"
    SubnetIds:
      - !Ref SubnetAppA
    SecurityGroupIds:
      - !Ref InstanceSecurityGroup
    VpcId: !Ref VPC
SSMEC2MessagesInterfaceEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcEndpointType: "Interface"
    PrivateDnsEnabled: "True"
    SubnetIds:
      - !Ref SubnetAppA
    SecurityGroupIds:
      - !Ref InstanceSecurityGroup
    VpcId: !Ref VPC
SSMMessagesInterfaceEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcEndpointType: "Interface"
    PrivateDnsEnabled: "True"
    SubnetIds:
      - !Ref SubnetAppA
    SecurityGroupIds:
      - !Ref InstanceSecurityGroup
    VpcId: !Ref VPC
```

Then, we add connect our instance profile and security group to the EC2 resource definition.

```yaml
...
IamInstanceProfile: !Ref SessionManagerInstanceProfile
SecurityGroupIds: 
  - !Ref InstanceSecurityGroup
```

Success - now I have terminal access and can download software. Next I'll either look at S3 and CloudFront, or setting
 RDS and connecting it to the EC2 instance.