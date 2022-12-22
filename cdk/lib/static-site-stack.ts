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