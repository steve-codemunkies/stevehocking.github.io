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

* **Model**. Here the current (or required) state of the schema and static data is represented, and the differences (or a _delta_) are calculated, and script(s) generated to bring the database up to date.

Looking at the two options maintaining a _change log_ seems to be the lighter weight option of the two. Maintaining and deploying a _model_ almost definitely requires that you use some kind of tool, or set of tools; where applying a _change log_, or set of _change logs_ only really requires the ability to run queries against the database.

And this is possibly true if you're looking after a very small database that never really changes. However, there are four things that must be considered when taking the _change log_ approach:

* **You need to be able to create the base database state simply**. You have to start somewhere right?
* **You must be able to identify the order that _change logs_ need to be applied**. Six months ago you may have changed the type of a column and added a new column. Today you may be wanting to remove the new column. The order of the changes is important because it's the only way you can get from your base state (above) to the current state.
* **You must be able to identify the update level of the database**. Because there are always multiple copies of a database, and they are never kept in sync. One of the more usual ways of tracking this that I have seen is a table with two, possibly three columns:
  * **_Change log_ identifier** &mdash; usually a string, and usually containing the date that the change log was created (_not actioned_).
  * **_Change log_ description** (optional) &mdash; some information about the change; the source ticket, etc. Though where I have seen this it is rapidly left blank.
  * **Application date** &mdash; the date and time the change log was applied.  
  And of course this information has to get into the database somehow, and usually it is as part of the _change log_ itself.
* **The _change log_ it self must be [atomic](<https://en.wikipedia.org/wiki/Atomicity_(database_systems)>)**. If a part of the _change log_ fails then the changes must be rolled back, the database cannot be left in an inconsistent state. Importantly no more _change logs_ can be applied to the database until the problem has been investigated and rectified.

Once you start thinking these requirements through it becomes obvious that having a tool of some kind to manage the application of change logs then it will be easier for you and everyone associated with the system. There are [tools available](https://www.google.co.uk/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=database%20change%20log%20tool) though there are pitfalls as well, but mostly I've seen teams evolve their own over time as the burden of managing change logs manually becomes too much.
