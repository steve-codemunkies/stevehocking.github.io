---
layout: 	post
title:  	"Why am I getting a 500.19 from IIS when my xml isn't malformed?"
description:  "What? These URLRewrite rules?"
date:   	2015-11-02 15:30:00
categories: android pwdgnr8r preferences app
comments: false
page-type: article
---
**TL;DR** Do you need to install [URLRewrite](http://www.iis.net/downloads/microsoft/url-rewrite)?

I have recently moved jobs and one of the things I am currently picking up is automating the build and deployment of two successful, though neglected applications. The apps are being built through [Jenkins](https://jenkins-ci.org/) and shipped off to [Octopus](https://octopus.com/).

Getting the first application configured to build and [package](http://docs.octopusdeploy.com/display/OD/Packaging+applications) correctly has been pretty straight forward. Even getting the application on the webserver was remarkably straightforward. But when I tried hitting the site I was getting the dreaded grey screen of 500. Hitting the site locally on the server yielded more information:

<img src="/assets/2015-11-02-iis-500-19.png" alt="Detailed error message - HTTP Error 500.19 - Internal Server Error - 0x8007000d" />

And <strike>googling</strike>Binging brought me to the MS knowledge base ["HTTP Error 500.19" error when you open an IIS 7.0 Webpage](https://support.microsoft.com/en-gb/kb/942055). And there, right at the top is our error code, and it says the resolution is to "Delete the malformed XML element from the ApplicationHost.config file or from the Web.config file". So, now to open the web.config in something that flags broken xml, and... *Nothing, nada, zip*.

This is not good, after some googling I ended up at this [StackOverflow question](http://stackoverflow.com/questions/14132029/http-error-500-19-on-ie7-malformed-xml-in-web-config). And part way down I see this:

> However I see no malformed XML, and when I remove the web.config file altogether, the site loads but URL Rewriting doesn't work (obviously). Furthermore, even if I delete all XML from the web.config file, leaving it blank, I get the same error. It seems to have a problem with the fact that the web.config file exists at all.

*Ah ha!* I haven't installed [URLRewrite](http://www.iis.net/downloads/microsoft/url-rewrite) and there's a dirty great section of URL's to be re-written! I hope this saves one person 5 minutes.
