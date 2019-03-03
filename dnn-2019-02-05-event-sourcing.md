---
layout: page
title: "Dot Net North Lightening Talks - 5/2/2019 - Event Sourcing"
permalink: /dnn-2019-02-05-event-souring/
page-type: article
---

[Slides](/assets/2019-05-05-dnn-es-slides.pptx) are available to download, created in Office 365 Powerpoint.

## My setup

* Dell XPS 15 9570
* Windows 10 Professional
* [Conemu](https://conemu.github.io/)
  * [Oh My Posh!](https://github.com/JanDeDobbeleer/oh-my-posh)
  * [Oh My Zsh!](https://github.com/robbyrussell/oh-my-zsh)
  * [Font - Fira Code](https://github.com/tonsky/FiraCode)
* [Docker for Windows Desktop](https://docs.docker.com/docker-for-windows/install/)
* [VS Code](https://code.visualstudio.com/)
* [Event Store](https://eventstore.org/)

## Demo code

I generated the events for the demo using [pony-gen](https://github.com/steve-codemunkies/pony-gen), do with this code as you will. If you have any questions please do [contact me](mailto:steve@codemunki.es&subject=DNN Lightening Talk).

## Running EventStore on Docker

EventStore provide a [docker image](https://github.com/EventStore/eventstore-docker) for development purposes. This command is a really good starting point: `docker run --name eventstore -d -p 2113:2113 -p 1113:1113 -e EVENTSTORE_RUN_PROJECTIONS=all -e EVENTSTORE_START_STANDARD_PROJECTIONS=true eventstore/eventstore`, starting EventStore with the ability to run Projections.
