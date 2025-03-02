---
title: RDS Instance
---

# {{ $frontmatter.title }}

In the current deployment, I am hosting my own Postgres database on the droplet. In AWS, I am going to use RDS to learn
and save time on management and setup. This project doesn't need much of a database so I'm hoping I can keep things relatively
cheap.

Today's Goals are to:

1. Set up a RDS instance with a CloudFormation template 
2. Connect to it with `psql` from the previously created ec2 instance

## RDS and CloudFormation

First thing I did was spend some time in the console looking at how RDS instances are created. I find it easier to look 
at the options in the console before writing CloudFormation templates. The DB and DB Subnet Group template is below. 
I also added some template parameters, but omitted them here because they aren't particularly interesting. I am defaulting
the DBInstanceClass to `db.t4g.micro` with 20GiB of storage. My estimations put this around $15/month.

```yaml
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Commuter Challenge DB Subnet Group
      DBSubnetGroupName: cc-db-subnet-group
      SubnetIds:
        - !Ref SubnetDBA
        - !Ref SubnetDBB
        - !Ref SubnetDBC

  PgAppDB:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      DBInstanceIdentifier: !Ref DBInstanceID
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBName: !Ref DBName
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref DBAllocatedStorage
      Engine: Postgres
      EngineVersion: "16.8"
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups: 
        - Ref: "RDSSecurityGroup"
```

## Getting Access From EC2 Instance

Our EC2 instance is located in the previously created `SubnetAppA` and the DB is in our DB subnets. We already have 
routes set up but now we need authorization for the EC2 to connect to the DB. This took some trial and error. I had a
circular reference with the InstanceSecurityGroup and RDSSecurityGroup rules. The solution was to specify the SecurityGroupEgress
and SecurityGroupIngress rules separately rather than in the security group parameter definitions.

The RDSSecurityGroup is just needs to allow ingress on port 5432 with a source security group of the InstanceSecurityGroup.

```yaml
  RDSSecurityGroup: 
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      VpcId: !Ref VPC
      GroupDescription:  Ingress for EC2
  RDSIngress:
    Type: "AWS::EC2::SecurityGroupIngress"
    Properties:
      GroupId: !Ref RDSSecurityGroup
      SourceSecurityGroupId: !Ref InstanceSecurityGroup
      IpProtocol: 'tcp'
      ToPort: 5432
      FromPort: 5432
```

Then the InstanceSecurityGroup needs an egress rules to allow it create tcp connections to the DB:

```yaml
  InstanceSecurityGroupRDSEgress:
    Type: "AWS::EC2::SecurityGroupEgress"
    Properties:
      GroupId: !Ref InstanceSecurityGroup
      Description: 'Allow Egress DB Connection to RDS Security Group'
      DestinationSecurityGroupId: !Ref "RDSSecurityGroup"
      IpProtocol: tcp
      ToPort: 5432
      FromPort: 5432
```

I recently started deploying stacks over the command line:

```shell
  aws cloudformation create-stack \
    --stack-name bcc-test \
    --template-url $CF_TEMPLATE_URL \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameters ParameterKey=DBUsername,ParameterValue=$DBUSER ParameterKey=DBPassword,ParameterValue=$DBPASS
```

## Testing It All Out

I deployed the stack and let it complete. Looking through the console everything appears to be good. I have a new RDS, a
security group with ingress rules, and a new egress rule on the InstanceSecurityGroup. I go to the EC2 console and right
click to connect with SSM and... I can't connect to the EC2 instance. Uh oh! It was working the last time I was working
on this...

I started looking through the [Troubleshooting SSM Agent](https://docs.aws.amazon.com/systems-manager/latest/userguide/troubleshooting-ssm-agent.html)
docs and saw the section that the ssm agent needs HTTPS access to:

- ssm._region_.amazonaws.com
- ssmmessages._region_.amazonaws.com

Then I remembered reading somewhere in the CloudFormation docs that EC2 Security Groups have a default rule that 
allows all egress traffic and that specifying an egress rule would remove that. Aha! So we should need to add an egress
rule for HTTPS. I manually added the rule in the console to verify, then added the following to the template.

```yaml
  InstanceSecurityGroupSSMEgress:
    Type: "AWS::EC2::SecurityGroupEgress"
    Properties:
      GroupId: !Ref InstanceSecurityGroup
      Description: 'Allow HTTPS Egress for SSM'
      CidrIp: '0.0.0.0/0'
      IpProtocol: tcp
      ToPort: 443
      FromPort: 443
```

After redeploying the stack, I have shell access again. To test the connecting we just need to install `psql` and note
out RDS instances endpoint.

```shell
$ sudo dnf install -y postgresql16
$ psql -h $DB_HOST -U $DB_USER
```

![pqsl connected](/public/RDSConnected.png "Connected to RDS with psql")

Success! We have access to our DB from the EC2 instance. I can now delete the stack so I'm not paying for resources that 
are not in use. 

```shell
$ aws cloudformation delete-stack --stack-name bcc-test  
```

## Next Steps

Next, I need an s3 bucket to host user images, and CloudFront for content delivery. Then, I'll have the minimum 
cloud infrastructure needed to host the Commuter Challenge on AWS. There will still be a lot of work setting up/bootstrapping
the environment to host a Rails app and a process for deploying code changes. 