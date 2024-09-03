---
layout: 	post
title:  	"The incredible power of cleaning house"
description:  "How to have AWS Elastic Container Registry (ECR) automatically expire your old images for fun, savings and security"
date:   	2024-09-03 15:15:00
categories: aws awscli docker elasticcontainerregistry ecr security
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

[Amazon Fargate](https://aws.amazon.com/fargate/) is serverless compute for containers (it says so on the page!). If you have a workload that does not easily translate to Lambda, or has a spiky usage profile then it can be a good tool to use. Fargate makes use of Docker Images, among others.

If you are building your own images to use on Fargate, where do you store them? You could subscribe to the Docker Hub and make your images private, or you could use Amazon [Elastic Container Registry](https://aws.amazon.com/ecr/) to store those images in a secure, private manner. And [ECR is not terribly expensive](https://aws.amazon.com/ecr/pricing/) (in the context of professional development). Because the service is charged on the basis of the amount of data stored (in my case this is of the order of 10's of GB) and the amount of data transferred (most images are stood up once, some will be stood up four or five times on their journey to production) there has historically been less incentive to clean up unused data.

[Amazon Inspector](https://aws.amazon.com/inspector/) is a security tool for your AWS account. Workloads, and in the case of ECR, potential workloads are scanned for security vulnerabilities and unintended network exposure. This was recently enabled across all of the company's accounts, including the account hosting the ECR. Predictably (as a lot of the images are more than 5 years old) many images were flagged as having outstanding vulnerabilities. Because of the immutable nature of of images the way to correct these issues is to build a _new_ image that corrects the component or components at risk, and then updating workloads to use these new images. But this (by itself) leaves the old image in the ECR repository, and means that your list of notified security issues just grows _ad infinitum_.

ECR does not provide functionality to remove images directly, however it does provide [expiration via lifecycle policy](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html). The lifecycle policies are based on the tags applied to images, beware that these are not the same as [AWS tags](https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/what-are-tags.html). However, like AWS tags it is possible to apply more than one tag to an image, and it is this property that we'll exploit to manage images.

![Diagram showing an ECR registry hosting many repositories](/assets/2024-09-03-ecr-diagram.png)

An ECR registry can host one or more Repositories, and each repository can host one or more types of image. Lifecycle rules apply to _all_ of the images in a specific repository. The steps that I'll be describing assume that you only have one type of image in each repository (using multiple repositories does not attract specific extra fees), but can easily applied to multi-image-type repositories.

## Anatomy of a Lifecycle Rule

As detailed in [Examples of lifecycle policies in Amazon ECR > Lifecycle policy template](https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy_examples.html#lifecycle_policy_syntax) there are four main sections to a policy:

* **Priority** / `rulePriority` - A number used to sort the policies, the number should be unique. _Hint*: The numbers do not need to sequential so utilise large gaps so that new rules can be easily inserted in the future (e.g. 10, 20, 30; or even 100, 200, 300).
* **Description** / `description` - A text string that describes the aim of the rule, e.g. "Prod - retain last two images".
* **Image status/tag list/match criteria** / `selection` - Which image or images will this rule be applied to? The [Examples of lifecycle policies in Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy_examples.html) page has a number of excellent example rules.
* **Rule action** / `action` - What to do if the selection criteria is met, _expire* (or `{ "type": "expire" }` via the CLI) is the only valid value here

### The difference between `untagged` and `any`

Especially if you setup a rule in the AWS console it can appear that there is little to choose between `untagged` and `any` in the image status, but there is a world of difference. Untagged images will have _no_ image tags associated with them, while `any` means that the rule applies to any image in the repository.

## How we went about cleaning house

### 0. Understand how the lifecycle policy rules are applied

It's at this point that we designed the lifecycle policy rules. The ECR documentation [Automate the cleanup of images by using lifecycle policies in Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html) has a clear description of how rules are applied, and conflicts resolved. Using this as a guide we decided to:

* maintain the existing tagging scheme that sees images tagged with the build number at the point that they are uploaded to the repository
  * As this tag is used for deployment to Fargate it meant that we didn't need to update the rest of the deployment process
* augment the tagging with an environment specific tag of `<environment prefix>-<build number>`.
* have a lifecycle policy rule per environment, even though for most environments the rules (are currently) otherwise the same
  * This also accounts for the situation where an image will be promoted through a number of environments, but not all the way to production. This is to do with the way rules are applied. If a rule has multiple tags associated with it then an image must match _all_ the tag rules for the rule to be applied.
* have the lowest priority rule be one that matches `any` image and expires images more then 90 days old - a catch all rule with sufficient delay to allow issues to be corrected

### 1. Update the deployment pipeline to tag images

Our next step was to update the pipeline that deploys the image to ECS so that it adds a new tag. Amazon provide a guide to doing this: [Retagging an image in Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-retag.html). To be able to retag your images your pipeline will need to be able to run AWS CLI commands. The following example assumes that your pipeline provides a new number for each execution as `BuildNumber`. Additionally the environment is provided in `DevopsEnv`.

```bash
MANIFEST=$(aws ecr batch-get-image --repository-name my-large-repository --image-ids imageTag=$(BuildNumber) --output text --query 'images[].imageManifest')
aws ecr put-image --repository-name my-large-repository --image-tag ${DevopsEnv}-$(BuildNumber) --image-manifest "$MANIFEST"  
```

### 2. Identify the images running in your different environments

There are ways of doing this with code, but for the purposes of the PoC the images were manually identified.

### 3. Manually tag the images you are currently using

The pipeline update you did in stap one will, unfortunately, only tag images moving forward. To stop the images you're using right now being expired, manually tag them. Be careful to use the correct environment prefix.

### 4. Create a lifecycle policy preview

Before deciding that you do not want to do this step it's worth knowing that when the lifecycle policy is applied is outside of your control. Indeed when the real policy was applied to one Repository within my account the all 2,000+ images had been evaluated, and the majority removed within five minutes of the rules being setup.

One thing that was learned by testing using the policy preview was that the rules for the higher environments should have higher priorities. Our production rule is based on images having a tag that starts `Prod-`, and we retain the last five images. By setting this rule to have the highest priority we had the best confidence that prod images would be retained.

Depending on the number of images and number of rules you configure it may take several minutes for the test run to complete and report the images that will be removed.

### 5. Apply the lifecycle policy rules

As noted above, the rules will be applied relatively quickly, so be very careful at this stage.

## Impact

At the start of the investigation process the test repository contained 2,200+ images and Inspector had flagged over 33,000 vulnerabilities. After testing and applying a simple set of lifecycle policy rules the number of images was reduced to 91 and the number of vulnerabilities to around 1,100.