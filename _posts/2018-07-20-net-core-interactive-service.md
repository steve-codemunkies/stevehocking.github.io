---
layout: 	post
title:  	"Building an interactive service with .NET Core 2.1"
description:  "Exploring whats new with .NET Core 2.1 whilst also exploring how to make services a bit friendlier"
date:   	2018-07-20 09:00:00
categories: dotnet-core autofac serilog rabbitmq app-metrics ihostedservice http
comments: false
page-type: article
---

**TL;DR**: .NET Core 2.1 makes Windows Services really straight forward, and integrating other parts of .NET Core technology is very straight-forward. Go look at the [sample application](https://github.com/steve-codemunkies/ServiceHttpConfig).

It started with a tweet (that I can't find...) And then it lay, festering, for a while. An itch unscratched. _How to make windows service configuration/status available via http?_ Of course I actually already possess _all_ of the tools necessary to do this. I'm just a bit short of time (and in truth some motivation) to work out _how_ to get all those disparate pieces working together.

And then there was another tweet, or more accurately a blizzards of tweets:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Ok tweeting about some hidden gems in the release that people may not know about. <a href="https://twitter.com/hashtag/aspnetcore?src=hash&amp;ref_src=twsrc%5Etfw">#aspnetcore</a> <a href="https://twitter.com/hashtag/dotentcore?src=hash&amp;ref_src=twsrc%5Etfw">#dotentcore</a></p>&mdash; David Fowler (@davidfowl) <a href="https://twitter.com/davidfowl/status/1004232622845804544?ref_src=twsrc%5Etfw">June 6, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

And in there, close to the top, were these two:

<blockquote class="twitter-tweet" data-conversation="none" data-lang="en"><p lang="en" dir="ltr">Next, Windows services now work on .NET Core <a href="https://t.co/RFSCY4JyyY">https://t.co/RFSCY4JyyY</a>. The docs are being updated <a href="https://t.co/8w6FQw72og">https://t.co/8w6FQw72og</a> (it still says .NET Framework only)</p>&mdash; David Fowler (@davidfowl) <a href="https://twitter.com/davidfowl/status/1004233944085118976?ref_src=twsrc%5Etfw">June 6, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet" data-conversation="none" data-lang="en"><p lang="en" dir="ltr">Next, IHostedService. A way to run long running background operations in both the generic host and in your web hosted applications. <a href="https://t.co/cR2rB8SZHa">https://t.co/cR2rB8SZHa</a>. 2.1 added support for a BackgroundService base class that makes it trivial to write a long running async loop.</p>&mdash; David Fowler (@davidfowl) <a href="https://twitter.com/davidfowl/status/1004233301823852544?ref_src=twsrc%5Etfw">June 6, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<iframe src="https://giphy.com/embed/l4KhPbIIDgO3sMw0w" width="480" height="429" frameBorder="0" class="giphy-embed-right"></iframe>

I might just have found my motivation...

[.NET Core 2.1](https://blogs.msdn.microsoft.com/dotnet/2018/05/30/announcing-net-core-2-1/) was announced at the end of May this year, and it is the kind of step change that .NET Fx (Framework) 2 was to .NET Fx 1.1. To me at least it moves Core from being something I want to work with, to something that I can happily and easily work with day in and day out. Motivation sorted I got on with it (kind of...)

The sample I slapped together is available on [GitHub](https://github.com/steve-codemunkies/ServiceHttpConfig), and details of links etc are available in the individual commits:

* [Host ASP.NET Core in a Windows Service](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/windows-service?view=aspnetcore-2.1) - Running a .NET Core application as a service. It's worth noting that to get the sample to work at this point I needed to fix versions to `2.1.0`, and I needed an extra `using` statement: `Microsoft.AspNetCore.Hosting.WindowsServices`
* Adding [Autofac](https://autofac.org/) was based on the Autofac [ASP.NET Core](https://autofaccn.readthedocs.io/en/latest/integration/aspnetcore.html) and [.NET Core](https://autofaccn.readthedocs.io/en/latest/integration/netcore.html) documentation, as well as the [ASP.NET Core](https://github.com/autofac/Examples/tree/master/src/AspNetCoreExample) and [Generic Host Builder](https://github.com/autofac/Examples/tree/master/src/GenericHostBuilderExample) Examples
* Adding the hosted service (essentially the service that runs in the background) was based on [docs.microsoft](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-2.1#timed-background-tasks)
* Going back to the [RabbitMq Tutorials](https://www.rabbitmq.com/tutorials/tutorial-one-dotnet.html) really helped a huge amount (internally at work we have a very sophisticated package that works nicely with RabbitMq and Autofac, but means I've completely forgotten how to RabbitMq...)
* Finally setting up App-Metrics was based on the [getting started tutorial](https://www.app-metrics.io/getting-started/), and [ASP.NET Core docs](https://www.app-metrics.io/web-monitoring/aspnet-core/) and [quick start](https://www.app-metrics.io/web-monitoring/aspnet-core/quick-start/)

The real work came in figuring out how to get the (now badly named) [`TimedHostedService`](https://github.com/steve-codemunkies/ServiceHttpConfig/blob/master/ServiceApp/TimedHostedService.cs) into the Home Controller. Initially I simply had DI inject an instance. But it quickly became apparent that this _wasn't_ the instance that the Framework had setup to run in the background.

Looking in [Startup](https://github.com/steve-codemunkies/ServiceHttpConfig/blob/master/ServiceApp/Startup.cs#L23) I needed to work out what `.AddHostedService<>()` was doing. Rather nicely .NET Core is open source, so this is [very straight forward](https://github.com/aspnet/Hosting/blob/master/src/Microsoft.Extensions.Hosting.Abstractions/ServiceCollectionHostedServiceExtensions.cs). And it turns out the method is just registering my type as a transient type, that specifically implements `IHostedService`. Taking this knowledge I can now dump that call to register the hosted service, and substitute it with a [new registration (in Autofac)](https://github.com/steve-codemunkies/ServiceHttpConfig/blob/master/ServiceApp/Startup.cs#L52) that tells the DI there should only be one instance of the class, and that it implements multiple interfaces. As a friend says Job Jobbed.

In truth if you're putting something in to production you probably want to tidy this up, but the basic concept is there. Are there other changes you might want to make? Definitely:

* To get ASP.NET MVC working nicely I brought along *a lot* of extras, that's not nice really. Can they be cut down? How about using something like [Nancy Fx](http://nancyfx.org/)?
* The view to get the service status and button in front of the user isn't included in the executable, which could lead to issues, perhaps those could be retrieved from Resources, or elsewhere?
* The DI setup is gnarly, that can probably be cleaned up as well

But I'm going to leave these inspirations for another time.
