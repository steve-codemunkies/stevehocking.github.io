---
layout: 	post
title:  	"Setting up aliases in bash"
description: "Aliases, they make life so much simpler, use them!"
date:   	2015-04-16 15:25:00
categories: jekyll chocolatey linux bash
comments: false
page-type: article
---
A lot of the work that I  do is on Windows machines, and I spend an awful lot of time in shells of one sort or another. My shell host of choice is the excellent [conemu][conemu]. You can [download an installer][conemu-installer], or use [chocolatey][choco-top] to [install and maintain][choco-conemu] the latest version.

However for various reasons (which I might get round to documenting one day :) ), I use a [linux vm]({% post_url 2014-07-13-setting-up-ubuntu-server-in-a-hyper-v-vm %}) to run some stuff, including [Jekyll][jekyll]. When using Jekyll you have it _serve_ a directory:

<pre>jekyll serve</pre>

The problem with doing this is that it binds to the local loopback address (localhost/127.0.0.1). Which is fine if you're running a desktop on that machine and can fire up a browser; but slightly limiting when all you have is a text terminal. To be able to access Jekyll externally you need to tell it to bind to a different host, this is easy:

<pre>jekyll server -H 192.168.1.1</pre>

But this is a lot to remember, and type everytime, [especially when you have a finite number of keypresses][hanselman-keys-left]. So what do we need? An Alias! Luckily searching turned up a couple of key resources:

* [SS64.com - alias Man Page][ss64-bash-alias]
* [Raspberry Pi - .BASHRC AND .BASH_ALIASES][raspi-bashrc]

What I hadn't realised from the ss64 page (an excellent command line resource), is that the _.bash_aliases_ file isn't actually interpreted, but is simply executed as part of the _.bashrc_ script (which is why I ended up with the Raspberry Pi documentation). Anyway, by aliasing jekyll to itself with the necessary parameters:

<pre>jekyll='jekyll server -H 192.168.1.1'</pre>

I'm now able to run jekyll with the correct binding just using the jekyll command.

[conemu]:               http://conemu.github.io/
[conemu-installer]:     http://www.fosshub.com/ConEmu.html
[choco-top]:            https://chocolatey.org/
[choco-conemu]:         https://chocolatey.org/packages/ConEmu
[jekyll]:               http://jekyllrb.com/
[hanselman-keys-left]:  http://www.hanselman.com/blog/DoTheyDeserveTheGiftOfYourKeystrokes.aspx
[ss64-bash-alias]:      http://ss64.com/bash/alias.html
[raspi-bashrc]:         https://www.raspberrypi.org/documentation/linux/usage/bashrc.md
