---
title: VPC and Subnets
---

# {{ $frontmatter.title }}

This is the first post and first steps in the project of migrating the Billings Commuter Challenge from Digitial Ocean to AWS. The reason for this migration is purely educational. Digitial Ocean has served the Commuter Challenge well, but this project is the perfect size and complexity for learning AWS. It is complex enough to be interesting, but not so much that it is overwhelming.

## VPC

After creating a new AWS account and setting up and administrator IAM user, the first task is the networking configuration. I decided to create a VPC with a `10.16.0.0/16` CIDR. This is overkill for the Commuter Challenge but it won't hurt anything and has plenty of room to grow.

## Subnets

I decided to create 4 subnetsover 3 AZs. One for reserved, database, app, and web. Each subnet is allocated 4096 IPv4 addresses. Initially, I plan to get the Commuter Challenge working on AZA, then in the future I can add resiliancy with the other AZs. This also leaves room for another four subnets of the same size.

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

If this looks familiar, you've probably also done Adrian Cantrill's [courses](https://learn.cantrill.io). This simple structure is based off his examples in the AWS CSA course.