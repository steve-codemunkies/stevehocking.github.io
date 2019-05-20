---
layout: 	post
title:  	"Useful docker commands"
description:  "Some useful commands when working with docker"
date:   	2018-12-12 12:00:00
categories: docker
comments: true
page-type: article
hero-image: /assets/2018-12-12-container-ship.jpg
tile-image: /assets/2018-12-12-container-ship-tile.jpg
---

This is more for my own benefit, but other may find it useful too.

## Listing images

It can be useful to know what images are on your system, `docker image ls` is your friend here, and will produce output like this:

```
REPOSITORY          TAG                  IMAGE ID            CREATED             SIZE
aspnetapp           latest               c57a36e90398        2 minutes ago       264MB
<none>              <none>               8fe537899022        3 minutes ago       1.84GB
microsoft/dotnet    sdk                  ea6f66a1e7b7        16 hours ago        1.73GB
microsoft/dotnet    aspnetcore-runtime   41db56126a6d        16 hours ago        260MB
```

## Listing running containers

Likewise it is good to know which containers are actually running. `docker container ls -a` will show you a list of running containers with output like this:

```
CONTAINER ID        IMAGE               COMMAND                  CREATED              STATUS              PORTS                  NAMES
01184955588d        aspnetapp           "dotnet Blog.Applica…"   About a minute ago   Up About a minute   0.0.0.0:8080->80/tcp   myapp
```

## Stopping and removing a running container

To stop a container use `docker container stop <container id>`. So to stop the container above we issue the command `docker container stop 01184955588d`. _However_ you aren't yet done.

The container must be removed using `docker container rm <container id>`. So to remove the container we use `docker container rm 01184955588d`.

## Removing an old image

Finally to clean up an image that is no longer needed we can use `docker image rm <repository name>`, so getting rid of the image we've been using we execute `docker container rm aspnetapp`.
