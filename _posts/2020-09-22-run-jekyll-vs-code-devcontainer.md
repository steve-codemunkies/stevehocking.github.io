---
layout: 	post
title:  	"Run Jekyll in a VS Code Dev Container"
description:  "WSL2, docker, linux, ruby, jekyll, my! my! my!"
date:   	2020-09-22 20:59:00
categories: docker wsl wsl2 docker jekyll
comments: true
page-type: article
hero-image: /assets/2018-12-12-container-ship.jpg
tile-image: /assets/2018-12-12-container-ship-tile.jpg
---

This blog, the one you're reading right now, is [github pages](https://pages.github.com/) blog, and you can view the [repository](https://github.com/steve-codemunkies/steve-codemunkies.github.io). The back-end technology for github pages is [Jekyll](https://jekyllrb.com/), which is simple to use static site generation software. Static sites are much more straightforward to maintain and deal with than dynamic sites, the performance alone is probably worth it:

![Lighthouse performance rating for the blog front page](/assets/2020-09-19-site-lighthouse.png)

![Lighthouse performance rating for a blog page](/assets/2020-09-19-page-lighthouse.png)

I've previously written about [running Jekyll in WSL]({% post_url 2016-09-07-jekyll-on-windows-subsystem-for-linux %}). The major issue with this approach is that you need to [install a whole pile of software](https://daverupert.com/2016/04/jekyll-on-windows-with-bash/). Clearly this can be scripted, but you unless you're organised (I'm not), then you forget to either create the script in the first place, or don't run it and go and find the original blog post. There _must_ be a better way...

### devcontainers

Someone at Microsoft has been listening and [VS Code](https://code.visualstudio.com/) now includes [devcontainer](https://code.visualstudio.com/docs/remote/create-dev-container) functionality. In a nutshell you add some configuration files to a `.devcontainer` directory in your repository and (assuming you have [Docker Desktop for Windows](https://docs.docker.com/docker-for-windows/) installed) VS Code will open your repository in a container.

Rather than start this from scratch I found [Carlos Mendible's article](https://carlos.mendible.com/2020/01/10/vs-code-remote-containers-jekyll/), and this gave me the first steps. First I created a [`dockerfile`](https://github.com/steve-codemunkies/steve-codemunkies.github.io/blob/master/.devcontainer/Dockerfile), and it is in here that you script the coonfiguration of your environment. You also need to create a [`devcontainer.json`](https://github.com/steve-codemunkies/steve-codemunkies.github.io/blob/master/.devcontainer/devcontainer.json). There is one crucial difference with Carlos' method, he used the [`appPort`](https://code.visualstudio.com/docs/remote/devcontainerjson-reference) property, but using this requires you to publish the ports and your application (in this case Jekyll) to listen on all interfaces and not just `localhost`. I've used the ['forwardPorts`](https://code.visualstudio.com/docs/remote/containers#_always-forwarding-a-port) property instead:

```json
    "forwardPorts": [4000]
```

The reason for swapping to using `forwardPorts` was that I could not access the site when using `appPort` (I suspect this was the problem of Jekyll running on the wrong interface). The other addition I have made is to include a [`.vscode/tasks.json`](https://github.com/steve-codemunkies/steve-codemunkies.github.io/blob/master/.vscode/tasks.json):

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start jekyll (drafts, future) for codemunki.es",
            "command": "jekyll",
            "args": [
                "serve",
                "-w",
                "-D",
                "--future"
            ],
            "type": "shell",
            "problemMatcher": []
        },
        {
            "label": "Start jekyll for codemunki.es",
            "command": "jekyll",
            "args": [
                "serve",
                "-w"
            ],
            "type": "shell",
            "problemMatcher": []
        }
    ]
}
```

This allows me to run Jekyll from within the devcontainer easily, and view new posts as I create them.