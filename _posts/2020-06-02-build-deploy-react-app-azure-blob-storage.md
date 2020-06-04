---
layout: 	post
title:  	"Build and Deploy a React App to Azure Blob Storage using Github Actions"
description:  "Free CI/CD"
date:   	2020-06-02 20:30:00
categories: azure blob-storage azure-blob-storage static-content react github github-actions
comments: true
page-type: article
hero-image: /assets/2020-04-21-clouds.jpg
tile-image: /assets/2020-04-21-clouds-tile.jpg
invert-header: true
---

## TL;DR

My [SampleReactApp](https://github.com/steve-codemunkies/SampleReactApp) repository demonstrates how you can build and deploy a React App to an Azure Storage Blob using GitHub Actions.

## What are GitHub actions?

[GitHub Actions](https://help.github.com/en/actions/getting-started-with-github-actions/about-github-actions)...

> ...enables you to create custom software development life cycle (SDLC) workflows directly in your GitHub repository.

The [usage limits](https://help.github.com/en/actions/getting-started-with-github-actions/about-github-actions#usage-limits) for actions are generous, and there are many Actions available in the [marketplace](https://github.com/marketplace?type=actions). As pointed out by [El Reg, they've been made free in response to GitLab](https://www.theregister.com/2020/04/15/github_core_features_free_price_drop/), but this is by-the-by, and who am I to look a gift horse in the mouth?

![I actually have no idea](/assets/2020-06-02-gift-horse.gif)

## Creating a React App to build and deploy

It's been a long time since I last dabbled with React, so I went back to the [tutorial](https://reactjs.org/tutorial/tutorial.html) and made use of [`create-react-app`](https://create-react-app.dev/). I used the very easy and straight-forward [nvm-windows](https://github.com/coreybutler/nvm-windows) to get node installed and running.

## Setting up GitHub Actions

As someone has previously said to me, this isn't my first time to this rodeo, but I'm not ready to talk about that yet...

![Rodeo](/assets/2020-06-02-rodeo.gif)

As such there are three sites I'm going to call out, but they are only tangentially linked to _this_ post:

* [Deploy Azure Functions using Github Actions](https://dev.to/azure/deploying-azure-functions-with-github-actions-c5p)
* [Implementing GitHub Actions for an Azure Static Website](https://dev.to/azure/implementing-github-actions-for-an-azure-static-website-488h)
* [Azure Functions/GitHub - HowTo](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions?tabs=csharp)

From these I pieced another workflow together. This was then transplanted into a workflow based on this [template](https://github.com/actions/starter-workflows/blob/87a8d83e309a179bf1d126a21cb7669c830b0e0e/ci/node.js.yml), and modified into the [workflow](https://github.com/steve-codemunkies/SampleReactApp/blob/master/.github/workflows/continuous-integration.yml) for my React App.

In terms of the workflow itself there isn't a great deal to call out. I've been unable to get the tests step to work without actual tests 🤔. I'm using [bacongobbler / azure-blob-storage-upload](https://github.com/bacongobbler/azure-blob-storage-upload) to achieve the upload to Blob Storage, and as you can see this is really simple, and just needs a connection string.

The connection string to Blob Storage itself may be contentious, as it effectively provides full access to your Blob Storage account.

The connection string is stored as a secret named `BLOBSTORAGECONNECTIONSTRING` on the repository, and it is referenced on line 55 using this construct: `{% raw %}${{ secrets.BlobStorageConnectionString }}{% endraw %}`.

## Manual builds

The final part of getting this working (for me) was getting a method to manually trigger a build and deploy _without altering code_. In the GitHub UI this is not possible 😞. However Github also has [Events that trigger workflows](https://help.github.com/en/actions/reference/events-that-trigger-workflows), also known as repository despatch events.

Following the details on how to [manually trigger a github actions workflow](https://goobar.io/2019/12/07/manually-trigger-a-github-actions-workflow/) I added the following lines (they are [lines 9 and 10](https://github.com/steve-codemunkies/SampleReactApp/blob/master/.github/workflows/continuous-integration.yml#L9-L10) in GitHub):

```yaml
on:
  repository_dispatch:
    type: manual-build
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]
```

The `push` and `pull_request` sections detail how the workflow is triggered automatically. The `repository-dispatch` section stipulates that an event of type `manual-build` will also trigger the workflow. Actually generating the event is easy:

```shell
curl -H "Accept: application/vnd.github.everest-preview+json" \
    -H "Authorization: token <your-token-here>" \
    --request POST \
    --data '{"event_type": "manual-build"}' \
    https://api.github.com/repos/steve-codemunkies/SampleReactApp/dispatches
```

And the build shows up in the history with the name of your event type:

![A manual build in progress](/assets/2020-06-02-manual-build.png)

The token in the query above is a [Personal Access Token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line). Happy building!