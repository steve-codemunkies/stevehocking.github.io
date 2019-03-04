---
layout: page
title: "Dot Net North Lightning Talks - 5/3/2019 - Event Sourcing"
permalink: /dnn-2019-03-05-event-souring/
page-type: article
---

[Slides](/assets/2019-03-05-dnn-es-slides.pptx) are available to download, created in Office 365 Powerpoint. There are notes associated with slides with extra bonus links!

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

## Projections

Both projections were created as Continuous Projections, with Checkpoints and Emit enabled and Tracking of Emitted Streams enabled.

## PonyTalkCount projection

```js
fromStream("Ponies")
  .when({
    $init: function() {
      return { count: 0 }
    },
    "PonyTalkEvent": function(state, event) {
      state.count += 1;
    }
  })
```

## ChattyPonies projection

```js
fromStream("Ponies")
  .when({
    $init: function() {
      return { }
    },
    "PonyTalkEvent": function(state, event) {
        if(state[event.body.Name] === undefined) {
            state[event.body.Name] = {
                lastTimestamp: new Date(event.body.Timestamp),
                count: 0
            };
        } else {
            var item = state[event.body.Name];

            var currentTimestamp = new Date(event.body.Timestamp);
            var diff = (currentTimestamp.getTime() - item.lastTimestamp.getTime()) / 1000;

            if (diff <= 10) { item.count += 1; }

            item.lastTimestamp = currentTimestamp;
        }
    }
  })
```
