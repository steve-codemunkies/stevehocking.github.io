---
layout: 	post
title:  	"Create a Docker Layered Build .net core Applications"
description:  "I feel the need, the need for speed!"
date:   	2020-06-04 20:55:00
categories: docker netcore layers unittest
comments: false
page-type: article
hero-image: /assets/2018-12-12-container-ship.jpg
tile-image: /assets/2018-12-12-container-ship-tile.jpg
---

## TL;DR

On the 17th of April a voice was heard, asking if fellow developers were running their unit tests inside their build containers, and how this witchcraft and sorcery might be achieved. I saw that cry for help on the 18th and threw together [a Docker Layered Build sample](https://github.com/steve-codemunkies/DockerLayeredBuild).

## You can Dockerize anything

A container is a (reasonably) simple and straightforward way of isolating some software. Docker is the choice _du jour_ to achieve that. And it is possible to ensconce any application within a Docker image/container.

The question that was asked wanted to go further:

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Those using <a href="https://twitter.com/hashtag/AspNetCore?src=hash&amp;ref_src=twsrc%5Etfw">#AspNetCore</a> and <a href="https://twitter.com/hashtag/Docker?src=hash&amp;ref_src=twsrc%5Etfw">#Docker</a>, are you running your unit tests inside of your docker container too? As simple as RUN dotnet test or ??? How are you doing it?</p>&mdash; Erik Porter (@HumanCompiler) <a href="https://twitter.com/HumanCompiler/status/1251263824478433280?ref_src=twsrc%5Etfw">April 17, 2020</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Luckily I've spent a lot of the past two years sorting out _just this sort of thing_.

![mm-hmm](/assets/2020-06-04-mm-hmm.gif)

## The code

The code is so boring and straight-forward I'm not going to bore you with it. The important part, for our purpose here, is that it has unit tests that need running. To get started clone the repository locally, start a shell, cd in to the root of the repository and run this command:

```shell
dotnet test
```

I'll wait here, you go ahead and give it a try. It's always good to know that something is working before you start tinkering 😉.

![The expected output](/assets/2020-06-04-dotnet-test.gif)

You hopefully see output similar to the above in your shell.

## Building a Docker Image

One of the key things that the [dockerfile](https://github.com/steve-codemunkies/DockerLayeredBuild/blob/master/Dockerfile) is taking advantage of is layering. As noted by [Jessica G in her post _Digging into Docker Layers_](https://medium.com/@jessgreb01/digging-into-docker-layers-c22f948ed612):

> Layers of a Docker image are essentially just files generated from running some command. You can view the contents of each layer on the Docker host at `/var/lib/docker/aufs/diff`. Layers are neat because they can be re-used by multiple images saving disk space and reducing time to build images while maintaining their integrity.

The other side effect of using layers is that you will save time, especially on nuget package pulls with a well thought through _dockerfile_.

[Lines 5-15 of the docker file](https://github.com/steve-codemunkies/DockerLayeredBuild/blob/master/Dockerfile#L5-L15) are concerned with simply copying the solution (and a `nuget.config` if you have one) and the `.csproj` files to the correct places.

```dockerfile
# First copy the solution file, if you have a nuget config copy it here as well
COPY *.sln .

# Then copy the source projects, they all get put into the same folder
COPY src/*/*.csproj .
# This line then moves the project files to the correct folders
RUN for file in $(ls *.csproj); do mkdir -p src/${file%.*}/ && mv $file src/${file%.*}/; done

# Next copy the test projects, agains they all get put into the same folder
COPY tests/*/*.csproj .
# This line then moves the test project files to the correct folders
RUN for file in $(ls *.csproj); do mkdir -p tests/${file%.*}/ && mv $file tests/${file%.*}/; done
```

This at first may seem excessive, but we're going for savings of time and disk space. Docker will determine whether a step needs to be run again by checking hashes, once it hits a layer that needs recreating it then creates all the layers from that point on. Once you get out of the early phase of a project your solution file and nuget config should be pretty stable, so it makes sense to copy these first.

Next come the project files for the main packages. The [`COPY`](https://docs.docker.com/engine/reference/builder/#copy) command uses wildcards, and the rules come from [Go's filepath.Match](https://docs.docker.com/engine/reference/builder/#copy). It is worth noting that the `COPY` command flattens the structure when filters are used, which is why the next line is used to make directories and copy the project files into them. This process is then repeated for the test projects.

At this point it's worth pointing out that .net cores [default compilation includes](https://docs.microsoft.com/en-us/dotnet/core/tools/csproj#default-compilation-includes-in-net-core-projects) really help here, and if you have developers who insist on including or excluding files (usually using Visual Studio), you're not going to see as much benefit.

Next comes the first real time/space saver:

```dockerfile
# Now we can restore all the packages that we need
RUN dotnet restore
```

Assuming that your projects are referenced (directly or indirectly) from the `.sln` file dotnet will march through and pull down the packages for you. Or, if you've done this before and haven't changed the `.sln`, nuget config or `.csproj` files it won't, _because docker will use the cached layer_ 😁.

The next line copies everything in to the container:

```dockerfile
# Now to copy everything across
COPY . .
```

And it's worth noting that because there isn't a folder the data structure is retained.

[Lines 24-31](https://github.com/steve-codemunkies/DockerLayeredBuild/blob/master/Dockerfile#L24-L31) are concerned with building, testing and publishing the application.

```dockerfile
# We can now build everything, but we don't need to restore, so tell dotnet to skip that
RUN dotnet build -c Release --no-restore

# And then we can test, but this time we don't build, as we've alredy done that
# You can just do a test instead of build then test, but I've found diagnosing issues easier this way
RUN dotnet test -c Release --no-restore --no-build

# Lastly we need to publish everything
RUN dotnet publish src/ConsoleApp/ConsoleApp.csproj -c Release --no-restore --no-build -o /output
```

At this point it's worth noting that `docker` will stop if a command returns a non-zero value, which is what will happen should any step fail. Becareful when setting your own `dockerfile` up to make sure that you specify the build configuration everywhere (`-c Release` in the above cases), to use the `--no-restore` flag (you did this earlier, you can completely skip the restore), and on the test and publish to specify that you don't want to do the build phase _again_ (`--no-build`).

The [last four lines](https://github.com/steve-codemunkies/DockerLayeredBuild/blob/master/Dockerfile#L34-L37) are concerned with copying the output of the build process over to the runtime image. You are then in a position to publish your new image and start using it.

## You mentioned a `.dockerignore` file?

I didn't, but you're right, there _is_ a `.dockerignore` file, and much like it's counterpart `.gitignore` it is really important, as it stops unwanted files being copied across to your build image. [Alexei Ledenev's article _Do not ignore .dockerignore (it’s expensive and potentially dangerous)_](https://codefresh.io/docker-tutorial/not-ignore-dockerignore-2/) does a good job of explaining why you need a `.dockerignore` file. But if you develop on windows you'll soon figure out you've forgotten it when you see errors referring to `C:\...` 😂😉.

## And that's it?

Pretty much. It isn't witchcraft or sorcery. No animals need to be harmed. And if you can see the benefits of doing this it is well worth it. 

Though one useful [Stack Overflow answer](https://stackoverflow.com/a/20816397/747649) shows how you can run a container and get access to the file system. This is always useful to know especially when you're setting up a new build process. Even now I still have stray files copying to new and exciting locations. By running a shell on the container and doing a few judicious `cd` and `ls -la` commands it's really very quick to get to the bottom of these mysteries.