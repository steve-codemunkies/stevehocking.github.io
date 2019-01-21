---
layout: 	post
title:  	"Use Edge In-Private from Visual Studio"
description:  "What Microsoft giveth with one hand occasionally makes you facepalm."
date:   	2019-01-25 21:00:00
categories: vs visualstudio edge inprivate
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
---

When working on web projects it can be useful to make use of the browsers _Incognito_/_Private Browsing_/_InPrivate_ mode. The major reason is that the browser does not cache content or cookies between sessions when running in these modes.

Others have documented how you can use [Chrome Incognito](https://www.hanselman.com/blog/VisualStudioWebDevelopmentTipAddChromeIncognitoModeAsABrowser.aspx) and [Firefox Private Browsing](https://stackoverflow.com/a/37818758) when debugging through Visual Studio.

For _reasons_ I ~~needed~~ wanted to be able to use Edge in _InPrivate_ mode for debugging. And found little information. And all the information I could find about entering _InPrivate_ mode talked me through doing it in the UI. Mmm-hmmm.

![Spidey senses tingling](/assets/2019-01-25-faint-smell-danger.gif)

Searching around the subject I turned up this [gem](https://social.msdn.microsoft.com/Forums/en-US/21affc27-64e1-495c-aa23-c0cbbce4a39c/how-to-start-microsoft-edge-in-private-mode-from-command-line):

> FYI
`C:\Windows\System32\cmd.exe /c start shell:AppsFolder\Microsoft.MicrosoftEdge_8wekyb3d8bbwe!MicrosoftEdge -private`

Hardly the most discoverable... _thing_ in the world ever.

![No! Why Microsoft, why?](/assets/2019-01-25-facepalm.gif)

Microsoft have come a long way recently, making things more open (.NET Core, Powershell) and being open to being open (WSL). And then they go and do something like that.

But fear not, we can work with this. On the start debug button drop the menu and select _Browse With..._. In the dialog that pops up click _Add..._. On the _Add Program_ set these values:

* Program: `C:\Windows\System32\cmd.exe`
* Arguments: `/c start shell:AppsFolder\Microsoft.MicrosoftEdge_8wekyb3d8bbwe!MicrosoftEdge -private`
* Friendly name: `Microsoft Edge InPrivate`

![Configured to use Edge InPrivate](/assets/2019-01-25-edge-inprivate.png)

After this you will be able to debug with Edge in _InPrivate_ mode. A couple of warnings:

* You will briefly see a console window flash up when starting debugging.
* When starting Edge will initially _not_ look like it is in _InPrivate_ mode, the chrome will then update to have the blue _InPrivate_ flash.
