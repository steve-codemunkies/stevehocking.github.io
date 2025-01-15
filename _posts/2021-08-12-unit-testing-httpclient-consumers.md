---
layout: 	post
title:  	"Unit testing HttpClient consumers"
description:  "Testing your code that uses HttpClient may not be as hard as you thought"
date:   	2021-08-12 20:15:00
categories: dotnet dotnetcore httpclient ihttpclientfactory xunit unittest
comments: false
page-type: article
hero-image: /assets/2021-08-12-quality-control.jpg
tile-image: /assets/2021-08-12-quality-control-tile.jpg
---

Recently I was investigating the performance of systems, and a lot of the issues kept coming back to the same core issue: http calls to other services.

In an absolutely ideal world each of our microservices would own _all_ of the data that they require to function, but this isn't always the case, and sometimes you need to store data in an appropriate repository, e.g. [Azure Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction) or [AWS S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html). In these circumstances there is an inevitability about the need to make http calls.

In reviewing all of this code making http calls, one striking thing jumped out at me, none of the code that made use of [HttpClient](https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpclient?view=net-5.0) was unit tested. There was some effort at integration testing, though thanks to the complexity of the systems involved this was, at best, piecemeal.

So I started investigating, trying to find a sensible description of how to test code that made use of _HttpClient_, and I'll be honest I found precisely _one_ (yes, 1) article. And now I cannot find that article. So here for posterity is a (quick) walkthrough of how I began to rectify the situation.

## What is a _DelegatingHandler_?

Luckily the concept to unit testing code that makes use of _HttpClient_ is very simple, and is rooted in the way that _HttpClient_ is designed. We're going to create a simple [DelegatingHandler](https://docs.microsoft.com/en-us/dotnet/api/system.net.http.delegatinghandler?view=net-5.0) and inject that into our _HttpClient_. Steve Gordon has an excellent article that discusses the internals of _HttpClient_ - [HttpClientFactory In Asp.Net Core 2.1 (Part 3) - Outgoing Request Middleware With Handlers.](https://www.stevejgordon.co.uk/httpclientfactory-aspnetcore-outgoing-request-middleware-pipeline-delegatinghandlers). I cannot recommend this set of articles highly enough, and even though they were written in 2018 they are still relevant now. I _strongly_ recommend reading the article on _DelegatingHandlers_ before finishing this article.

Instead of passing control back to the base class as Steve demonstrated in his article, our stub will directly return a suitable response, creating a stack like so:

![Modified outgoing request pipeline](/assets/2021-08-12-delegating-handler-stub.jpg)

The code to create the stub delegating handler is very simple and straight forward:

```csharp
internal class OkMessageHandler : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
    }
}
```

It's a simple task of creating a class that inherits from _DelegatingHandler_ and providing an implementation of [SendAsync](https://docs.microsoft.com/en-us/dotnet/api/system.net.http.delegatinghandler.sendasync?view=net-5.0).

Use of the stub delegating handler is as straightforward, though slightly less intuitive. We do this via the [_HttpClient_ constructor](https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpclient.-ctor?view=net-5.0#System_Net_Http_HttpClient__ctor_System_Net_Http_HttpMessageHandler_):

```csharp
var httpClient = new HttpClient(new OkMessageHandler());
```

Then we get the system under test to use _our_ _HttpClient_:

<script src="https://gist.github.com/steve-codemunkies/ebe1192617e5860d32d982d6ac374321.js"></script>

The [InternetCaller](https://gist.github.com/steve-codemunkies/1605b7525d7a99f462e8601c063c81bd) demonstrates (after a fashion) how to use a directly provided _HttpClient_ or creating one using [IHttpClientFactory](https://docs.microsoft.com/en-us/dotnet/api/system.net.http.ihttpclientfactory?view=dotnet-plat-ext-5.0).