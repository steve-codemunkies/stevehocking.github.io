---
layout: 	post
title:  	"Implementing an AverageTimer32 Performance Counter in .NET"
description:  "Use just one performance counter to monitor performance, not with new AverageTimer32 Performance Counters"
date:   	2015-12-08 12:30:00
categories: dotnet csharp perfmon performance-counter averagetimer32
comments: true
page-type: article
---
A task that I'm working on involves injecting quite a chunk of processing in to a performance sensitive part of the system. Luckily the system already uses performance counters to monitor the performance of this part of the system. Unfortunately it turns out that [performance counters are hard](http://www.codeproject.com/Articles/8590/An-Introduction-To-Performance-Counters). This is similar to the code that was originally in the measurement code:

<script src="https://gist.github.com/steve-codemunkies/d64843e5a31f3bbc8a10/af9a3d4de02493ab6b8187a456683be5c2a53d5f.js"></script>

I kind of understand what the code is attempting to do, but not really. The [documentation for QueryPerformanceFrequency](<https://msdn.microsoft.com/en-us/library/windows/desktop/ms644905(v=vs.85).aspx>) kind-of helps, mostly by pointing to a [different document](<https://msdn.microsoft.com/en-us/library/windows/desktop/dn553408(v=vs.85).aspx>). Reading this documentation it becomes obvious that there is a simpler way of obtaining the value that is needed:

<script src="https://gist.github.com/steve-codemunkies/d64843e5a31f3bbc8a10.js"></script>

The [Stopwatch](<https://msdn.microsoft.com/en-us/library/system.diagnostics.stopwatch(v=vs.110).aspx>) class really is very useful, and hides a lot of the complexity around getting accurate time measurements. And that's why we're writing .NET code and not C or C++, right?
