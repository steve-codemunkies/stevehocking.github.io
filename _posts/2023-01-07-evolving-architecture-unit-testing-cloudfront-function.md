---
layout: 	post
title:  	"Evolving Architecture [short]: Unit Testing a Cloudfront Function"
description:  "It is time to do the right thing"
date:   	2023-01-07 17:25:00
categories: evolving-architecture aws cloudfront-function js javascript typescript jest
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

I have recently started moving this site to AWS ({% post_url 2022-12-22-evolving-architecture-publish-jekyll-aws-cdk-github-actions %}) and then fixed a CloudFront routing issue with a CloudFront Function ({% post_url 2022-12-27-evolving-architecture-short-fixing-cloudfront-distribution-function %}). But what I _didn't_ do was unit test the function. (Frankly I lifted it wholesale and made use of it... 🤷.)

For reasons I decided that I wanted to write and test the Function as a TypeScript Function. And actually most of it was easy. I'm unsure how - but I found [`@types/aws-cloudfront-function`](https://www.npmjs.com/package/@types/aws-cloudfront-function), and after some minor local problems I had the [tests working](https://github.com/steve-codemunkies/steve-codemunkies.github.io/pull/4/files#diff-0b92f9d57f525cdcf1d701aefb0daedeb40274a04ea1270ddfa32bc497f72373). However I couldn't get past the problem of the generated javascript not being compatible. The basic issue is described in this [StackOverflow question](https://stackoverflow.com/questions/43042889/typescript-referenceerror-exports-is-not-defined). Looking at the [CloudFront Function docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-features.html) you can see that out of the box they support ES5, but it's a quite specific implementation.

While trying to find out how to write CloudFront Functions in TypeScript one of the articles I came across was [Fabio K.'s How to unit test Cloudfront functions](https://medium.com/@fabioknoedt/how-to-unit-test-cloudfront-functions-b790c4532aa0). So I decided to switch tack and leave the function as Javascript, and simply test that.

One minor issue I found is that the suggested `.babelrc` is incorrect. Based on the [docs on npm](https://www.npmjs.com/package/babel-plugin-rewire#with-babelrc) I actually put this in [`.babelrc`](https://github.com/steve-codemunkies/steve-codemunkies.github.io/pull/5/files#diff-98655bd89ed3656d8fff15d488f6176d845e0a5a79e0d6e7748b63f499ee4f54):

```json
{
    "plugins": ["rewire"],
}
```

With [tests](https://github.com/steve-codemunkies/steve-codemunkies.github.io/pull/5/files#diff-e10c8c89ed17dd2c441aea1b953ea1a6e33d150d32d731c3d53852e484c90da1) in place all that was needed was to [extend the github action](https://github.com/steve-codemunkies/steve-codemunkies.github.io/pull/5/files#diff-ecad2183af1362d9d99f4a33e7491c1970c92255c3c318e688ece549ec91fe33) to build and what is effectively a new project:

```yaml
      - name: install CloudFront Function dependencies and build 🧪🔨
        run: cd js-function && npm install && npm run test
```

All of the details can be found in [pr #5](https://github.com/steve-codemunkies/steve-codemunkies.github.io/pull/5).
