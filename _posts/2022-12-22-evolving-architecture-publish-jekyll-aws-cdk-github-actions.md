---
layout: 	post
title:  	"Evolving Architecture: Publishing a Jekyll site to AWS using GitHub Actions and AWS CDK"
description:  "Moving forward, one step at a time"
date:   	2022-12-22 15:15:00
categories: evolving-architecture aws aws-cdk github github-actions
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

For the last couple of years I've been trying to gently modernise my web-site (from a technical perspective), and not getting very far at all. I have many draft posts and more repositories on my machine that attest to this failure.

Recently it occurred to me that I've been attempting to do this all wrong, and the first step should be to get what I have working in AWS. And this was really remarkably easy. I created a small stack that stands up an [S3 Bucket](https://aws.amazon.com/s3/), a [Cloudfront Distribution](https://aws.amazon.com/cloudfront/) and then uses an existing certificate in [Certificate Manager](https://aws.amazon.com/certificate-manager/).

```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as path from "path";
import { Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import console = require('console');

export class StaticSiteStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const certificateArn = 'arn:aws:acm:us-east-1:' + props?.env?.account + ':certificate/9e00ceb1-e749-46a7-a3ea-034f6d8b4e15';
        console.log('certificate arn: ' + certificateArn);
        const certificate = Certificate.fromCertificateArn(this, 'codemunikies-cert', certificateArn);

        // read://https_aws-cdk.com/?url=https%3A%2F%2Faws-cdk.com%2Fdeploying-a-static-website-using-s3-and-cloudfront%2F
        const bucket = new Bucket(this, 'codemunkies-site', 
        {
            accessControl: BucketAccessControl.PRIVATE
        });

        console.log('_site location: ' + path.resolve(__dirname, '../../_site'));

        const bucketDeployment = new BucketDeployment(this, 'codemunkies-site-deployment',
        {
            destinationBucket: bucket,
            sources: [Source.asset(path.resolve(__dirname, '../../_site'))]
        });

        const originAccessIdentity = new OriginAccessIdentity(this, 'codemunkies-site-originAccessIdentity');
        bucket.grantRead(originAccessIdentity);
        
        const distribution = new Distribution(this, 'codemunkies-distribution', {
            certificate: certificate,
            defaultRootObject: 'index.html',
            defaultBehavior: {
                origin: new S3Origin(bucket, {originAccessIdentity}),
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            domainNames: [ 'beta.codemunki.es' ]
        });
    }
}
```

There are a few bits worth pointing out:
* [ACM certificates used with CloudFront must be in `us-east-1`](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html#https-requirements-certificate-issuer)
* The stack does not create the certificate (I manage my dns outside AWS), so it is created manually and then imported into the stack
* The code to hookup the S3 and Cloudfront were cribbed from [AWS CDK - Deploying a static website using S3 and CloudFront](Deploying a static website using S3 and CloudFront)
* Deploying the stack using Github Actions was cribbed from [PagerTree - Jekyll site to AWS S3 using GitHub Actions](https://pagertree.com/blog/jekyll-site-to-aws-s3-using-github-actions) and [Utkarsha Bakshi - How to Automate AWS CDK Deployments using Github Actions](https://medium.com/geekculture/how-to-automate-aws-cdk-deployments-using-github-actions-cec5db24ca8d)

To make the CDK easy to test I updated the `devcontainer` definition to pull in the AWS CLI as a feature, mount my `.aws` directory (to share configuration), and finally setup [`postCreateCommand.sh`](https://github.com/microsoft/vscode-remote-release/issues/3527#issuecomment-674739457) to do more complex post-create configuration. It is worth noting though that the script needs to be made executable _before_ it can be run.

All of the changes can be found in the [pull request](https://github.com/steve-codemunkies/steve-codemunkies.github.io/pull/2).