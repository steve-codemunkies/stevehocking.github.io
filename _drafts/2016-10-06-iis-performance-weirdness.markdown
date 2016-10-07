---
layout: 	post
title:  	"One little secret worth knowing about IIS performance"
description:  "Forget the depth, feel the breadth!"
date:   	2016-10-06 14:30:00
categories: iis performance newrelic
comments: true
page-type: article
hero-image: /assets/2016-09-09-speed.jpg
---
We have an application running on two servers, one of the servers is an old, high-spec, real tin server that is nearing end of life. The other server is a high spec virtual machine. On Tuesday of this week we moved all of our external traffic to the new server. This first graph shows the performance of our application on Tuesday evening at around our busiest time.

![](/assets/2016-10-06-perf-new-tues.PNG)

And this is the throughput graph for the same time.

![](/assets/2016-10-06-tp-new-tues.PNG)

Both of which seem ok, until you compare them to what was happening on the older server.

![](/assets/2016-10-06-perf-old-tues.PNG)
![](/assets/2016-10-06-tp-old-tues.PNG)

The old server was absolutely caning the new server.
