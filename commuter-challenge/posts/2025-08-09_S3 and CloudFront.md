---
title: S3, CloudFront and OAC
---

# {{ $frontmatter.title }}

Today I have a short post describing setup for an S3 bucket and CloudFront distribution for serving the Commuter Challenge user's profile photos.

## S3 and CloudFront

The setup is pretty straight forward. I created an S3 bucket and allowed public access and set the bucket policy to allow public access.

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "PublicAccess",
			"Effect": "Allow",
			"Principal": "*",
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::cf-testing-123145513342243562346/*"
		}
	]
}
```

Next I uploaded a handsome picture of Wilbur and verified I could access it publicly.

![CSA](/public/wilbur.jpg){style="width: 70%; display: block; margin: 0 auto}

So far so good. Next I hopped over to CloudFront and went through the steps to create a new distribution with an S3 origin. I purposely unchecked `Allow private S3 bucket access to CloudFront` so I could set up the OAC manually. Once the distribution was ready, I copied the distribution name and verified I could access the image through CloudFront.

The last step is to set up OAC. This was pretty simple. Just edit the distribution settings to check the `Origin access control setting` under origin and create a new OAC. It helpfully gives you a new bucket policy that you can copy and apply to the bucket.

```json
{
	"Version": "2008-10-17",
    "Id": "PolicyForCloudFrontPrivateContent",
	"Statement": [
		{
			"Sid": "AllowCloudFrontServicePrincipal",
			"Effect": "Allow",
			"Principal": {
				"Service": "cloudfront.amazonaws.com"
			},
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::cf-testing-123145513342243562346/*",
			"Condition": {
				"StringEquals": {
					"AWS:SourceArn": "arn:aws:cloudfront::12345678910:distribution/E2LVT1XATDR4FO"
				}
			}
		}
	]
}
```

As you can see, this policy allows the CloudFront principal with the new distribution's ARN to `GetObject` in the bucket. With the bucket policy updated, you can no longer access the image through the bucket URL. CloudFront would have done this for me if I just checked the box, but I think it's valuable to walk through setup manually at least once.

Woot! With that, we have all the infrastructure initially needed to host the Billings Commuter Challenge. Next up is bootstrapping the server and deploying Rails...