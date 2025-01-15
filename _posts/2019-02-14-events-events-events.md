---
layout: 	post
title:  	"Events events events!!!"
description:  "What even are events?"
date:   	2019-02-14 12:00:00
categories: event events eventstore
comments: false
page-type: article
hero-image: /assets/2019-02-14-events.jpg
tile-image: /assets/2019-02-14-events-tile.jpg
---

## What is an event?

The OED provides the following definition for the word [event](https://en.oxforddictionaries.com/definition/event):

> _Noun_: A thing that happens or takes place, especially one of importance.

Wikipedia defines an [event](https://en.wikipedia.org/wiki/Event_(computing)) in terms of computer science as:

> In computing, an event is an action or occurrence recognized by software, often originating asynchronously from the external environment, that may be handled by the software&hellip;

Excellent! We've defined an event! Oh ok... In software terms events tend to happen (and be handled) at either the micro or the macro level. Some examples of micro-level events:

* The mouse was moved
* A key was pressed
* The screen was touched

At a macro level events will tend to be concerned with things that have happened In Real Life&trade;, though not necessarily. Some examples of macro-level events:

* An order was placed
* A user modified something
* A new blog post was posted

In this article and further articles I'll be more concerned with macro level events.

## Why should I be concerned about events?

For all but the most basic [`CRUD`](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) applications things don't simply apparate into existence.

![A boy and a girl apparate into existence, proving me wrong](/assets/2019-02-14-apparate.gif)

Something, or some act causes a thing that our system is interested in to happen.

Even in the most basic `CRUD` system you are likely to be asked to provide some kind of audit trail of who did what and when. An audit trail is simply a record of events that have happened within a system.

## How are events generated in my system?

By definition anything that happens within your systems can generate an event. Perhaps the more interesting question is _Why is this an event that I want to process within my system?_ And this is a hard question to answer. I certainly can't answer the question for you. And _maybe_ you shouldn't try answering the question by yourself. However one possible way to answer the question is to have an [event storming](https://en.wikipedia.org/wiki/Event_storming) session or two.

Another closely related technique/set of tools is [DDD/Domain Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design), and brushing up on these tools and techniques will definitely be helpful.

## I know what my events are, how do I collect and process them?

In the same way that events can be anything, you can collect events in any way that you want. If you wanted to create an assembly with public methods that correspond to the events to be raised then you can. This though will simply create a closely coupled monster that very quickly will become a maintenance nightmare.

Moving out to some kind of [Remote Procedure Call](https://en.wikipedia.org/wiki/Remote_procedure_call) (probably via http, but there are other methods) will loosen the coupling slightly, but you are probably just pushing the pain slightly further down the road.

Reducing the level of coupling (by only sharing the definitions of events and the transport mechanism) brings us to an event or service bus. .NET is blessed with good examples ([NServiceBus](https://particular.net/nservicebus) and  [MassTransit](http://masstransit-project.com/)), and there are examples that are available in the cloud as well ([Azure Service Bus](https://azure.microsoft.com/en-gb/services/service-bus/)). But the trade off you achieve in loosening coupling is that you have introduced [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency).

## Eventual _what_? And _how_ eventual?

Eventual consistency is one of many [consistency models](https://en.wikipedia.org/wiki/Consistency_model) employed within computer science.

Imagine that we have an event driven system already. Users place orders through an external system (a website), and that system places the order with our system, probably via `http` call. For _reasons_ we need to let our customer know that the order has been (provisionally) accepted, so our front controller is able to generate the minimal amount of information to do this.

![An order is placed, but has not been processed](/assets/2019-02-14-order-placed.png)

At this point if the external user contacts us and asks about order _XYZ_ we don't actually know about it, as it hasn't been processed. Because of this the systems are in an inconsistent state.

![Order queried by user, the two systems are currently in an inconsistent state](/assets/2019-02-14-order-queried.png)

However, once the order has been processed the internal user will see the same information as the external user, and thus the systems are now consistent.

![The order has now been processed, and the systems are now consistent](/assets/2019-02-14-order-processed.png)

The _eventual_ in _eventual consistency_ refers to the lag between the two systems showing the same versions of the information. How long _eventually_ is, is a function of the number of messages generated and how long it takes to process each message. Ideally though that lag should not be long, minutes, or even seconds as opposed to hours or days.

Speaking of hours or days it's important to speak to your non-technical colleagues and stakeholders about their perception of _eventual_. When I started speaking with colleagues about moving from an 'immediate' system (driven by `http` calls, where all actions took place within the lifespan of the `http` call) to an _eventually consistent_ system I got some very sharp and severe push back, that was only ever really explained as:

> "well, eventually is no good!"

In these instances my colleagues were thinking that _eventually_ meant the conversational sense of eventually, hours, days, weeks or possibly even never. However after explaining that delays would be minimised, and failures rectified colleagues began to come on board.

## Moving beyond Event Driven Architecture

In building your software to respond to generated events you have moved to an Event Driven Architecture, with everything that this entails. You now have software that is de-coupled or only very loosely coupled, and hopefully systems that are easier to reason about. You're very likely using similar if not the same language as your stakeholders. But likely you have systems that only store the current state of the system.

But as humans we don't just live in the here and now, we like to look backwards. A lot. A tremendous amount of effort goes into looking back at data and actions to try and divine what may come next. Also we like to know where things are _right now_! In our example above wouldn't it be good to know that the order has been received even though it hasn't been processed? If you find yourself to be in this position then it's possible that [event sourcing](https://docs.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) may form part of your answer.
