---
layout: 	post
title:  	"Build and Deploy an Azure Function using Github Actions"
description:  "Free CI/CD"
date:   	2020-06-10 20:35:00
categories: azure function azure-function github github-actions
comments: false
page-type: article
hero-image: /assets/2020-04-21-clouds.jpg
tile-image: /assets/2020-04-21-clouds-tile.jpg
invert-header: true
---

## TL;DR

My [AzureFunctionDemo](https://github.com/steve-codemunkies/AzureFunctionDemo) repository demonstrates how you can build and deploy a C# Azure Function to an Azure Function using GitHub Actions.

## What even are Functions?

If you've any done any software development before they are _pretty much_ what they sound like; a small piece of code that is used to do a specific job. You know... a [_function_](https://www.thefreedictionary.com/function). Actually that's not fantastically helpful 😒. You will typically hear this type of processing referred to as [Serverless](https://en.wikipedia.org/wiki/Serverless_computing), but don't be fooled. There is still a server (or servers) in the background running your code, there is simply less ceremony, i.e. for the simplest of functions it is possible to get something up and running with a few clicks and and a few lines of code.

## How do I create a Function?

It seems there are _almost_ as many ways to create Functions as there are possible functions. One possible, cross provider, method is to use the [Serverless Framework](https://www.serverless.com/). However as I knew I wanted an Azure Function I followed this very good [tutorial](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?pivots=programming-language-csharp). One call out is that if you've not used [node.js](https://nodejs.org/en/) and you are on Windows then use [nvm-windows](https://github.com/coreybutler/nvm-windows), as it really takes the pain out of installing and managing node.js locally.

## Deployment attempt one

If you've followed the linked tutorial then you've used the [Azure Functions extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) to publish your function. And this is fine as far as it goes, but you're here either out of curiosity or because you want a better more repeatable way of deploying.

## Deployment attempt two

Following [Aaron Powell's Deploying Azure Functions With GitHub Actions](https://dev.to/azure/deploying-azure-functions-with-github-actions-c5p) was straightforward, and really helped in putting my [workflow](https://github.com/steve-codemunkies/AzureFunctionDemo/blob/master/.github/workflows/continuous-integration.yml).

It's worth calling out a couple of things about the whole process.

The first is the use of the [Azure / login](https://github.com/Azure/login) action in the deployment job. This takes a [credential json](https://github.com/Azure/login#configure-deployment-credentials) to log in to Azure for the current job. This is to allow the use of [Azure / appservice-settings](https://github.com/Azure/appservice-settings) to provide settings for the function. The settings come from secrets, and are a json blob in the following format:

```json
[
    {
        "name": "key-1",
        "value": "value-1",
        "slotSetting": false
    },
    {
        "name": "key-2",
        "value": 2,
        "slotSetting": false
    }
]
```

The [Azure / functions-action](https://github.com/Azure/functions-action) is used to deploy the function, the preferred method of connecting to Azure with this action is to use a [Publish Profile](https://github.com/Azure/functions-action#using-publish-profile-as-deployment-credential-recommended), this is downloaded from the Function App itself. It's unfortunate that the _appservice-settings_ doesn't also (at the time of writing) support the use of a Publish Profile.

A final little callout is that I've (again) added a way to invoke a [manual build](https://www.codemunki.es/2020/06/02/build-deploy-react-app-azure-blob-storage/#manual-builds).