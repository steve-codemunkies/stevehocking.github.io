---
layout: 	post
title:  	"Evolving Architecture [short]: Fixing a Cloudfront Distribution with a Function"
description:  "What?!? There's no such thing as a default file?"
date:   	2022-12-27 13:50:00
categories: evolving-architecture aws aws-cdk cloudfront distribution function
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

When I originally setup the infrastructure to serve my static site (for {% post_url 2022-12-22-evolving-architecture-publish-jekyll-aws-cdk-github-actions %}) I manually set things up in the AWS console.

![Sue me, I'm an idiot 😉](/assets/2022-12-27-sue-me.gif)

One thing I hadn't realised in doing this was that I setup the _bucket_ to return an `index.html` if a directory was requested, rather than a file. However I didn't replicate that into my CDK stack.

And doing a bit of testing revealed this.

![Doofus](/assets/2022-12-27-snigger.gif)

Doing some quick reading I soon found [Cloudfront Functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html) and the [sample to add `index.html` to request URLs that don't include a file name](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/example-function-add-index.html).

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Check whether the URI is missing a file name.
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    // Check whether the URI is missing a file extension.
    else if (!uri.includes('.')) {
        request.uri += '/index.html';
    }
    
    return request;
}
```

But how to deploy this via CDK? [Idan Lupinsky's: Static Site Deployment using AWS CloudFront, S3 and the CDK](https://idanlupinsky.com/blog/static-site-deployment-using-aws-cloudfront-and-the-cdk/) quickly provided the answer.

```typescript
const rewriteFunction = new Function(this, 'codemunkies-urlrewrite-function', {
    code: FunctionCode.fromFile({ filePath: 'cfd-fn/url-rewrite.js' }),
});

const distribution = new Distribution(this, 'codemunkies-distribution', {
    certificate: certificate,
    defaultRootObject: 'index.html',
    defaultBehavior: {
        functionAssociations: [{
            function: rewriteFunction,
            eventType: FunctionEventType.VIEWER_REQUEST
        }],
        origin: new S3Origin(bucket, {originAccessIdentity}),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
    domainNames: [ 'beta.codemunki.es' ],
});
```

While the function is undoutedly basic, and doesn't cover every conceivable situation, it's a starting point.

The full change is available in [pull request #3](https://github.com/steve-codemunkies/steve-codemunkies.github.io/pull/3).
