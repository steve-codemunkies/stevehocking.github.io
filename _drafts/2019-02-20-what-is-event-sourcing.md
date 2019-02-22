---
layout: 	post
title:  	"What is event sourcing?"
description:  "Why shoud I care? And will it make me tea and toast in the morning?"
date:   	2019-02-20 12:00:00
categories: event events eventstore eventsourcing
comments: true
page-type: article
hero-image: /assets/2019-02-14-events.jpg
---

In my [last post]({% post_url 2019-02-14-events-events-events %}) I looked at what events are, why they might be helpful to you, where they come from and some possible ways of dealing with them. At the end of the post I briefly mentioned that Event Sourcing may be helpful to you, in some capacity.

## But what is Event Sourcing?

In an event driven system once an event has been processed it disappears. During the processing of the event the state of the system will change, and these changes will be updated into system storage. Without implementing complex auditing going back to a previous system state isn't possible.

In an event sourced architecture the system is setup to store all of the events (including metadata) that pass through the system in an append only store. This means that it is possible to understand _how_ the system arrived a it's current state, or even to _replay_ the events to recreate the state. The important point to come away with is that the event store is _the single source of truth_ with regards to system state.

Microsoft have a really good overview of event sourcing in their series of articles on [Cloud Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/): [Event Sourcing pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/event-sourcing).

## So how do I do Event Sourcing?

Essentially you have two routes to consider. The first route is to Do It Yourself (DIY). You add something to your event driven system that causes all events that pass through the system to be stored in some long term storage. With RabbitMq this can be as easy as adding a queue to each exchange that takes all messages and persists them. You will also need to persist all of the metadata, like routing keys, as this may be important in the event that the events are replayed. You'll also need to consider how you are going to deal with event replays, and there are two aspects to consider here:

1. How do events get replayed into the system?
2. How do you deal with events that have been replayed (especially when they hit your storage mechanism)?

The other alternative is to use a pre-existing event-sourcing tool in your system. These are a little thin on the ground, but luckily there is one available, [_Event Store_](https://eventstore.org/) (sometimes also called _Get Event Store_ or _GES_).

## Getting started with _Event Store_

There are many [routes to getting _Event Store_ on to your machine](https://eventstore.org/docs/getting-started/index.html?tabs=tabid-1%2Ctabid-dotnet-client%2Ctabid-dotnet-client-connect%2Ctabid-4), but I'm going to go down the [docker route](https://github.com/EventStore/eventstore-docker) as it's a lot tidier. (**N.B.** be sure to take note that this image is only for development purposes.)

Once you've got _Event Store_ running locally you can access it on `http://localhost:2113` `admin:changeit`.

When I was getting started with _Event Store_ I found [Rob Ashton's Blog Series](http://codeofrob.com/blog.html) really useful:

* [Playing with the event store](http://codeofrob.com/entries/playing-with-the-eventstore.html)
* [Pushing data into streams](http://codeofrob.com/entries/pushing-data-into-streams-in-the-eventstore.html)
* [Basic projections](http://codeofrob.com/entries/basic-projections-in-the-eventstore.html)
* [Re-partitioning streams](http://codeofrob.com/entries/re-partitioning-streams-in-the-event-store-for-better-projections.html)
* [Creating a projection per stream](http://codeofrob.com/entries/creating-a-projection-per-stream-in-the-eventstore.html)

These five posts gave me a lot of information and pointers on the power of event sourcing in general and _Event Store_ in particular. The next eight posts form an interesting project:

* [Pumping data from Github into the EventStore](http://codeofrob.com/entries/less-abstract,-pumping-data-from-github-into-the-eventstore.html)
* [Emitting commits as their own events](http://codeofrob.com/entries/evented-github-adventure---emitting-commits-as-their-own-events.html)
* [Backing up your database](http://codeofrob.com/entries/evented-github-adventure---database-storage-and-backing-up.html)
* [Who writes the sweariest commits?](http://codeofrob.com/entries/evented-github-adventure---who-writes-the-sweariest-commit-messages.html)
* [Temporal queries - who doesn't trust their hardware?](http://codeofrob.com/entries/evented-github-adventure---temporal-queries,-who-doesnt-trust-their-hardware.html)
* [Crossing the streams to gain real insights](http://codeofrob.com/entries/evented-github-adventure---crossing-the-streams-to-gain-real-insights.html)
* [Temporal averages](http://codeofrob.com/entries/evented-github-adventure---temporal-averages.html)
* [Sentiment analysis of Github commits](http://codeofrob.com/entries/evented-github-adventure---sentiment-analysis-of-github-commits.html)

There's already an awful lot of information here to consider, so in future posts we'll look at how to tie chains of events together, what happens when you change a query, and other things.
