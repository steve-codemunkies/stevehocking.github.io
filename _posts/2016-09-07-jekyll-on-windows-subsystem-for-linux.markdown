---
layout: 	post
title:  	"Running Jekyll on Windows Subsystem for Linux"
description:  "Yuh, Jekyll, on Windows, without errors!"
date:   	2016-09-07 10:30:00
categories: jekyll windows bash-on-windows susbsystem-for-linux
comments: true
page-type: article
---
Hello, it's been a long time. And something that has changed in that long time is the [Windows Subsystem for Linux](https://msdn.microsoft.com/en-gb/commandline/wsl/about) (WSL). As well as a catchy name that just trips off the tongue, there are also a [lot](https://blogs.windows.com/buildingapps/2016/07/22/fun-with-the-windows-subsystem-for-linux/#ULclTWZJyUUb70M2.97) [of](http://www.howtogeek.com/265900/everything-you-can-do-with-windows-10s-new-bash-shell/) [excited](http://www.hanselman.com/blog/VIDEOHowToRunLinuxAndBashOnWindows10AnniversaryUpdate.aspx) [people](https://visualstudiomagazine.com/articles/2016/07/21/bash-on-windows-linux.aspx). Including me it turns out!

This blog is [Jekyll](https://jekyllrb.com/) based and hosted on github (thanks GitHub!). Previously I ran an [Ubuntu Server VM]({% post_url 2014-07-13-setting-up-ubuntu-server-in-a-hyper-v-vm %}) on my laptop to run Jekyll and update the blog. This was painful.

The reason for this is that Ruby isn't exactly the most Windows friendly execution environment. But now we have WSL! Yay! So I found some [excellent instructions](http://daverupert.com/2016/04/jekyll-on-windows-with-bash/), and followed them. Next I cloned my repo on to my disk. Then in Bash cd'd to the right folder, issued the command:

<pre>jekyll serve -w</pre>

and got back the following for my troubles:

<pre>jekyll 3.2.1 | Error:  Invalid argument - Failed to watch "/mnt/c/Work/steve-codemunkies.github.io/.git/hooks": the given event mask contains no legal events; or fd is not an inotify file descriptor.</pre>

This is frankly bobbins. As Dave Rupert notes there is a [UserVoice](https://wpdev.uservoice.com/forums/266908-command-prompt-console-bash-on-ubuntu-on-windo/suggestions/13469097-support-for-filesystem-watchers-like-inotify) to bring to Microsoft's attention that you want something like this, and there is also a related [Git Issue](https://github.com/Microsoft/BashOnWindows/issues/216). But this doesn't get me any further. But then [a Jekyll Git Issue](https://github.com/jekyll/jekyll/issues/5233) surfaced which lead me to issuing the command:

<pre>jekyll serve -w --force_polling</pre>

and it all works! As advertised! So no more need to run an Ubuntu Server VM! Yay! Happy blogging!