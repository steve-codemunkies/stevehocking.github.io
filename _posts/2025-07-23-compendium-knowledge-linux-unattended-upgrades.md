---
layout: 	post
title:  	"Compendium of Knowledge and Helpful Things - Unattended Upgrades"
description:  "Stay secure, install and configure `unattended-upgrades`"
date:   	2025-07-23 14:45:00
categories: compendium-of-knowledge helpful-things unattended-upgrades
comments: false
page-type: article
---

I run a [pi-hole](https://pi-hole.net/) on my home network (yes, your Wifi is a home network). But this means that I need to keep the Raspberry Pi up to date as well.

Previously I have used this script:

```shell
#!/bin/sh
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get autoremove -y
sudo apt-get autoclean -y
sudo /usr/local/bin/pihole -up
sudo /usr/local/bin/pihole -g
sudo reboot
```

And this is run at 3am every Sunday morning by this command (via cron):

```shell
sh /home/pi/update.sh > /home/pi/logs/cronlog 2>&1
```

But reading [the Register](https://www.theregister.com/2025/07/23/firefox_141_relieves_linux_pain/) there is a box out extolling the benefits of `unattended-upgrades`. A quick search turned up the [It4home - Installing and Configuring Unattended Upgrades on Raspberry Pi](https://it4home.dk/index.php/2023/08/05/installing-and-configuring-unattended-upgrades-on-raspberry-pi/) article. An excellent guide to setup.

My Sunday morning script is now down to:

```shell
#!/bin/sh
sudo /usr/local/bin/pihole -up
sudo /usr/local/bin/pihole -g
sudo reboot
```
