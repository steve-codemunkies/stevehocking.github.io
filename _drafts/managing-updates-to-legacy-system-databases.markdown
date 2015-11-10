---
layout: 	post
title:  	"Managing updates to legacy system databases"
description:  "Change log? Model? It's all about the tools!"
date:   	2015-11-10 14:00:00
categories: legacy maintenance database tools
comments: true
page-type: article
hero-image: /assets/2015-11-05-legacy.jpg
---

As I've [previously posted]({% post_url 2015-11-05-emergency-fixes-for-legacy-systems %}) I've joined a new team looking after two very different systems. And both systems have databases; two very **_large_** databases. And both databases need their schema and static data managing and updating.

There are two main ways of maintaining the schema and static data for a database:

* **Change log**. In this scenario the changes that are required to be made to the schema and static data are logged in a set of files. These changes must then be applied to the database in the correct order.

* **Model**. This time the current (or required) state of the schema and static data is represented, and the differences (or a _delta_) are calculated, and script(s) generated to bring the database up to date.

Looking at the two options maintaining a _change log_ seems to be the lighter weight option of the two. Maintaining and deploying a _model_ almost definitely requires that you use some kind of tool, or set of tools; where applying a _change log_, or set of _change logs_ only really requires the ability to run queries against the database.

And this is possibly true if you're looking after a very small database that never really changes in any form.
