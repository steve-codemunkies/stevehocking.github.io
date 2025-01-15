---
layout: 	post
title:  	"AWS: Using the AWS CLI to search within files in an S3 Bucket - Part 1 - Cloudformation"
description:  "When setting up infrastructure is more straightforward than the 'simple' task you need to perform"
date:   	2023-06-01 20:30:00
categories: aws cloudformation awscli sns sqs lambda s3
comments: false
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

Recently as part of my job I needed to help colleagues find some very specific files within an S3 bucket. This post deals with setting up some basic infrastructure to mimic how the original data was generated, and then a script to generate some test data. In the next post I'll go through how the search script works.

## Repository

All of the code and the scripts are available on my [Github](https://github.com/steve-codemunkies/find-an-sqs-event).

Starting with the project itself, I've employed a [devcontainer](https://github.com/steve-codemunkies/find-an-sqs-event/blob/main/.devcontainer/devcontainer.json), this is based on the [Typescript-Node](https://github.com/dev-container/ts) devcontainer.

The [devcontainer.json](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/.devcontainer/devcontainer.json#L10-L13) has been updated at lines 10-13 to pull in the [AWS CLI feature](https://github.com/devcontainers/features/tree/main/src/aws-cli) and the [AWS CDK feature contribution](https://github.com/devcontainers-contrib/features/tree/main/src/aws-cdk):

```json
"features": {
    "ghcr.io/devcontainers/features/aws-cli:1": {},
    "ghcr.io/devcontainers-contrib/features/aws-cdk:2": {}
},
```

This means that the aws cli and cdk will be available in the container. To avoid the need to setup the cli each time the container is built I've [mapped my local `.aws` folder](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/.devcontainer/devcontainer.json#L17-L19) to the devcontainer lines (17-19):

```json
"mounts": [
    "source=${localEnv:HOME}/.aws,target=/home/node/.aws,type=bind,consistency=cached"
],
```

The above configuration was put together based on [Rehan Haider's blog post](https://cloudbytes.dev/snippets/mount-aws-credentials-on-vscode-devcontainers).

## Infrastructure

The aim of the [stack](https://github.com/steve-codemunkies/find-an-sqs-event/blob/main/lib/find-an-sqs-event-stack.ts) is to setup infrastructure like the following:

![Container diagram showing an SNS Topic publishing to an SQS Queue, which invokes a Lambda, which then writes to an S3 Bucket](/assets/2023-06-01-find-an-sqs-event.png)

The [lambda function](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/lib/find-an-sqs-event-stack.ts#L22-L31) uses a [javascript function](https://github.com/steve-codemunkies/find-an-sqs-event/blob/main/js-function/findansqsevent/index.js) to write incoming events directly to the s3 bucket:

```typescript
const lambda = new Function(this, 'findansqsevent-lambda',
{
    runtime: Runtime.NODEJS_18_X,
    code: Code.fromAsset(path.join(__dirname, '/../js-function/findansqsevent')),
    handler: "index.handler",
    environment: {
        bucket: bucket.bucketName,
        prefix: "outputFolder/"
    }
});
```

As the lambda is [initially run](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/js-function/findansqsevent/index.js#L6) the `bucket` and `prefix` environment variables are imported to be used in each execution:

```javascript
const { bucket, prefix } = process.env;
```

The [function](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/js-function/findansqsevent/index.js#L14-L27) is setup to be able to deal with multiple incoming messages, cycling through all of them, and `PUT`ting them one at a time in the S3 bucket:

```javascript
for (const { messageId, body } of event.Records) {
    console.log('SQS message %s: %j', messageId, body);
    
    const command = new PutObjectCommand({
        Body: body,
        Bucket: bucket,
        Key: prefix.endsWith('/') ?
            `${prefix}${messageId}.json` : 
            `${prefix}/${messageId}.json`
    });
    
    const response = await client.send(command);
    console.log('S3 response: ' + JSON.stringify(response));
}
```

The stack should first be built using the command `npm run build`. Once this has completed it can de deployed with `cdk deploy`. This assumes you have the aws cli and cdk installed, and configured.

## Data generation script

The repository includes the [`generate-messages.sh](https://github.com/steve-codemunkies/find-an-sqs-event/blob/main/scripts/generate-messages.sh) shell script that publishes events.

The script takes two parameters:

* `-t|--topic <value>` - the arn of the topic deployed
* `-i|--iterations <value>` - the number of events to generate

The script uses the [`aws sns topic`](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/sns/publish.html) command to publish events to the sns topic created by the stack above:

```sh
aws sns publish --topic-arn $topic --message "$value" > /dev/null
```

The output of the `aws sns publish` command is redirected to `/dev/null` to keep the output clean. The output looks similar to the following:

```json
{
    "MessageId": "123a45b6-7890-12c3-45d6-333322221111"
}
```

For this use case I'm not too concerned with the message id, however it may be important to you when publishing messages.

In order to run the script you need to set the execute permission, the following command will do this for the current user only: `chmod u+x generate-messages.sh`

To be able to run the script you will need the aws cli installed and configured.