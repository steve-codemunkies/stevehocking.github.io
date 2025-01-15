---
layout: 	post
title:  	"Docker Networking - create and connect"
description:  "When localhost, 127.0.0.1 or ::1 just aren't good enough"
date:   	2019-02-13 21:00:00
categories: docker localhost container
comments: false
page-type: article
hero-image: /assets/2018-12-12-container-ship.jpg
tile-image: /assets/2018-12-12-container-ship-tile.jpg
---

Over the last few days I've been working on solving a DevOps style problem. And all of the various bits and pieces I've been trying to string together have been in Docker containers. My (somewhat faulty, it now turns out) understanding was that one container should be able to talk to another container _just like that_!

![A reference for the younger and/or foreign members of the audience](/assets/2019-02-13-just-like-that.gif)

Alas, this isn't quite true. But in digging around (and my, isn't [Docker Networking](https://www.bing.com/search?q=docker+networking) such a well served area?) I did come across a couple of _very_ useful commands.

This first command will create a bridge network called `localnet`.

```
docker network create --driver bridge localnet
```

From the [documentation](https://docs.docker.com/network/bridge/):

> &hellip;a bridge network uses a software bridge which allows containers connected to the same bridge network to communicate, while providing isolation from containers which are not connected to that bridge network.

Usefully (as described further down) a _bridge network_ provides DNS resolution between containers. This means that if you give your container a name, you can use that name in _other containers connected to the same network_ to refer to that container.

Great! Brilliant! But I already have a running container that I would like to refer to from another container...?

The second useful command is this:

```
docker network connect localnet eventstore
```

This [command](https://docs.docker.com/engine/reference/commandline/network_connect/) attaches the running container _eventstore_ to the network _localnet_, without needing a restart, of anything. Now I can connect to the services provided by _eventstore_ using the name _eventstore_ from any other containers connected to _localnet_.

N.B. It's worth pointing out that when connecting to services within the containers on the host (e.g. your machine) you still use `localhost` or `127.0.0.1` (or `::1` if you've enabled ipv6).
