---
layout: 	post
title:  	"Dockerize an ASP.NET Core Blog"
description:  "Setting off on the way to exploring some cloud services"
date:   	2018-10-23 12:00:00
categories: aspnetcore docker
comments: true
page-type: article
---

The cloud space is becoming really exciting now, and moving very fast, so my skills need to keep up! It's all very well noodling around with individual technologies, but there's nothing like a project, however far fetched and over-wrought, to bring things together.

After attending a [brilliant talk](https://speakerdeck.com/shahiddev/kubernetes-for-net-developers) by [Shahid Iqbal](https://twitter.com/ShahidDev) ([video](https://www.youtube.com/watch?v=_-rxEBK97CQ)), I started noodling with Docker, and then realized that I had a potential project. [This blog](http://www.codemunki.es) is hosted on [GitHub](https://github.com/steve-codemunkies/steve-codemunkies.github.io). Writing the blog locally I use [Jekyll](https://jekyllrb.com/) to check what I'm creating (this is the underlying technology behind GitHub Pages). Handily this also creates a whole bunch of XML. Score!

![Score!](/assets/2018-10-23-score.gif)

The first stop for me was to create a simple ASP.NET Core website that currently serves purely static content. A reference to the `Microsoft.AspNetCore.StaticFiles` package is required:

```
<PackageReference Include="Microsoft.AspNetCore.StaticFiles" Version="2.1.1" />
```

We can then tell ASP.NET to use the default file mappings (e.g. `index.html` when the root of a directory is requested), and serve static files:

```
app.UseDefaultFiles();
app.UseStaticFiles();
```

Lastly the static files are copied from the `_site` folder in my pages reposiory to the `wwwroot` folder the in the ASP.NET application. Testing the application this serves the expected content.

As a final step I [added a custom middleware](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-2.1) that will add a header showing the name of the machine serving the response (don't worry! I wouldn't do this in a real application!).

```
app.Use(async (context, next) => {
  context.Response.Headers.Add("X-machine-name", Environment.MachineName);
  await next.Invoke();
});
```

The last step (for this article) is to actually dockerize the application. And the [Docker docs](https://docs.docker.com/engine/examples/dotnetcore/#create-a-dockerfile-for-an-aspnet-core-application) really show how to do this very easily. There are a couple of points that are not obvious:

* The commands shown in the article should be run in a Administrator Powershell.
* The docker cli needs to be logged in to the docker hub, this is easily done with the `docker login` command. But beware that the cli needs your _docker id_, _not_ the email address you registered with.

You can have a look at the [current application on my GitHub](https://github.com/steve-codemunkies/Blog/tree/e973b94d4d4b293eabacd3fd2da53889a5572d73).
