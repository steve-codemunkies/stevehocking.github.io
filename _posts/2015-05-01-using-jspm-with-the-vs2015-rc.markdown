---
layout: 	post
title:  	"Using JSPM with the Visual Studio (VS) 2015 Release Candidate (rc)"
date:   	2015-05-01 08:30:00
categories: javascript jspm vs2015 visualstudio
comments: true
---
The first thing I should point out is that most of the work for this was done for me; on this occasion I'm standing on the shoulders of K. Scott Allen using his recent article [Using jspm with Visual Studio 2015 and ASP.NET 5][odetocode-vs2015-jspm].

Having got that out of the way the [release candidate (rc) for Visual Studio 2015][vs-blog-build-2015] was released to coincide with [Build 2015][build-2015]. Various CTP builds have been available for a while, but there has been a lot of change around ASP.NET recently, so using CTP 6 has been painful. So with the release of the rc I decided to revisit Scott's tutorial.

The only real caveat is around step 5, having default.html served as default. To do this Scott uses the file server in the _Microsoft.AspNet.StaticFiles_ package. By default if you're adding this package in using Visual Studio then you'll be given the latest available version; at the time of writing this is 1.0.0-beta5-11856. However the template is setup to use 1.0.0-beta4 packages. There are two ways to fix this:

The first way is to simply set all packages to take the latest revision:

<pre>"dependencies": {
  "Microsoft.AspNet.Server.IIS": "1.0.0-*",
  "Microsoft.AspNet.Server.WebListener": "1.0.0-*",
  "Microsoft.AspNet.StaticFiles": "1.0.0-*"
}</pre>

The other way is to alter the dependency for _StaticFiles_ so that all are using the beta4 packages:

<pre>"dependencies": {
  "Microsoft.AspNet.Server.IIS": "1.0.0-beta4",
  "Microsoft.AspNet.Server.WebListener": "1.0.0-beta4",
  "Microsoft.AspNet.StaticFiles": "1.0.0-beta4"
}</pre>

I've uploaded my test project to [GitHub][github-aspnetvnext] to make it easy to get started and have a play.

[odetocode-vs2015-jspm]:  http://odetocode.com/blogs/scott/archive/2015/02/18/using-jspm-with-visual-studio-2015-and-asp-net-5.aspx
[vs-blog-build-2015]:     http://blogs.msdn.com/b/visualstudio/archive/2015/04/29/build-2015-news-visual-studio-code-visual-studio-2015-rc-team-foundation-server-2015-rc-visual-studio-2013-update-5.aspx
[build-2015]:             http://www.buildwindows.com/
[github-aspnetvnext]:     https://github.com/steve-codemunkies/AspNetvNext
