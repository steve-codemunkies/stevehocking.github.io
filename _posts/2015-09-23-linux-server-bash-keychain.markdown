---
layout: 	post
title:  	"Setting up keychain for bash on a linux server"
description:  "Because it's nice to not enter your SSH passwords everytime you log on."
date:   	2015-09-23 11:30:00
categories: ubuntu linux bash keychain ssh
comments: false
page-type: article
---
I have managed to do much messing around with linux recently:

* [Setting up an Ubuntu Server VM in Windows 8 Hyper-V]({% post_url 2014-07-13-setting-up-ubuntu-server-in-a-hyper-v-vm %})
* [Setting up aliases in bash]({% post_url 2015-04-16-setting-up-bash-aliases %})

I'm a big fan of using ssh keys, and have powershell setup to request my password once. However on the linux server I had the following in my *.profile*:

<pre class="terminal">
if [ -z "$SSH_AUTH_SOCK" ] ; then
    eval `ssh-agent -s`
    ssh-add
fi
</pre>

Which is fine, but it starts an *ssh-agent* instance for every log-in. And this means that I'm prompted for the password everytime I log in.

One answer I've seen frequently is to use [keychain](http://www.funtoo.org/Keychain), and I have installed it in the past:

<pre class="terminal">
sudo apt-get update
sudo apt-get install keychain
</pre>

But, I failed (yes, I know, I suck...) and couldn't get it to work... But today I finally invested some proper time into understanding ssh-agent, keychain and bash. Thanks to [ZIADI Mohamed ali's answer](http://serverfault.com/a/698692) on serverfault I've now got it working nicely. In my *.profile* I now have this line:

<pre class="terminal">
eval `keychain ~/.ssh/id_rsa --eval`
</pre>

And I'm only asked for the password once. *Job's a good 'un!*
