---
layout: 	post
title:  	"Managing updates to legacy system databases"
description:  "Change log? Model? It's all about the tools!"
date:   	2015-11-13 11:30:00
categories: legacy maintenance database tools
comments: false
page-type: article
hero-image: /assets/2015-11-05-legacy.jpg
tile-image: /assets/2015-11-05-legacy-tile.jpg
---
As I've [previously posted]({% post_url 2015-11-05-emergency-fixes-for-legacy-systems %}) I've joined a new team looking after two very different systems. And both systems have databases; two very **_large_** databases. And both databases need their schema and static data managing and updating.

There are two main ways of maintaining the schema and static data for a database:

* **Change log**. In this scenario the changes that are required to be made to the schema and static data are logged in a set of files. These changes must then be applied to the database in the correct order.

* **Model**. Here the current (or required) state of the schema and static data is represented, and the differences (or a _delta_) are calculated, and script(s) generated to bring the database up to date.

### The _change log_ approach
Looking at the two options maintaining a _change log_ seems to be the lighter weight option of the two. Maintaining and deploying a _model_ almost definitely requires that you use some kind of tool, or set of tools; where applying a _change log_, or set of _change logs_ only really requires the ability to run queries against the database.

And this is possibly true if you're looking after a very small database that never really changes. However, there are four things that must be considered when taking the _change log_ approach:

* **You need to be able to create the base database state simply**. You have to start somewhere right?
* **You must be able to identify the order that _change logs_ need to be applied**. Six months ago you may have changed the type of a column and added a new column. Today you may be wanting to remove the new column. The order of the changes is important because it's the only way you can get from your base state (above) to the current state.
* **You must be able to identify the update level of the database**. Because there are always multiple copies of a database, and they are never kept in sync. One of the more usual ways of tracking this that I have seen is a table with two, possibly three columns:
  * **_Change log_ identifier** &mdash; usually a string, and usually containing the date that the change log was created (_not actioned_).
  * **_Change log_ description** (optional) &mdash; some information about the change; the source ticket, etc. Though where I have seen this it is rapidly left blank.
  * **Application date** &mdash; the date and time the change log was applied.

  And of course this information has to get into the database somehow, and usually it is as part of the _change log_ itself.
* **The _change log_ itself must be [atomic](<https://en.wikipedia.org/wiki/Atomicity_(database_systems)>)**. If a part of the _change log_ fails then the changes must be rolled back, the database cannot be left in an inconsistent state. Importantly no more _change logs_ can be applied to the database until the problem has been investigated and rectified.

Once you start thinking these requirements through it becomes obvious that having a tool of some kind to manage the application of _change logs_ makes it easier for you and everyone associated with the system. There are [tools available](https://www.google.co.uk/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=database%20change%20log%20tool) though these will have their own pitfalls as well, but mostly I've seen teams evolve their own over time as the burden of managing change logs manually becomes too much.

### The _model_ approach
So what about taking the _model_ approach? From the brief description above you must be wondering _how_? Luckily here the erstwhile developer who gets to look after a large database is well catered for:

* **[Microsoft Sql Server Data Tools (SSDT)](https://msdn.microsoft.com/en-us/library/mt204009.aspx)**. These tools integrate directly into Visual Studio, and allow you to create database projects in your solution. As well as creating database projects from scratch you can import an existing database (_this is only advisable if it's very early in it's lifecycle_).
* **[redgate SQL Source Control](http://www.red-gate.com/products/sql-development/sql-source-control/)**. This tool integrates into Sql Server Management Studio, and integrates directly with git.
* **[ApexSQL SQL Server source control](http://www.apexsql.com/sql_tools_source_control.aspx)**. Another tool that integrates directly into Sql Server Management Studio, and integrates directly with git and other source control systems.

And I am sure that there are others, these are simply the tools I know or found with a minute with a search engine. Whichever tool you choose the general methodology for updating a database will be the same:

* **Get the desired state of the database**. Schema and static data.
* **Specify the database to be updated**.
* **Compare the desired state to the actual state**.
* **Generate (an) update script(s)**.
* **(_Optionally_) Apply the update script(s)**.

Certainly the first few times you update a database in this way it is worth reviewing the script that is generated, and taking a little time to understand the changes to be made, and what (in the desired state) has caused the changes to be generated.

### Practicalities
Both approaches require discipline from all team members.

For the _change log_ approach there are a few things that need to be borne in mind:

* Remembering to script changes to a database to a _change log_.
* Sticking to the system for identifying the order that _change logs_ are applied in.
* Making sure the log of updates is updated.
* Making sure that changes really are atomic, and either all succeed or are all rolled back.

If team members don't do these things then you tend to end up with development/testing databases that don't look like production databases, and _change logs_ that have to test for lots of things to work in all environments.

For the _model_ approach a different approach to changes is required:

* All changes must be made and implemented through the model, and not directly on the database.
* Ideally the change script should be reviewed before deployment to ensure that the new desired state doesn't cause unwanted change (e.g. regeneration of massive tables).

In a previous job, where we were using an SSDT project to manage a large database, one of the developers didn't follow these simple steps. Instead he would make changes to the database, and then replicate them with subtle differences to the project. On one occasion he added a new column to the end of a table in the database, but into the middle in the project. On another occasion he included an underscore in a new column name in the database, but not in the project. Unfortunately these and other incidents caused considerable work (usually) just before or on a deployment day.

### How we're managing databases (this time)
So, after all that, how are we managing the databases for the two systems?

The externally originated system comes with a _change log_ system in place. A tool has been created at some point in the past, and the process of creating and applying _change logs_ to this system is well understood. This, and the age and history of the system mean that it will stay as a _change log_ managed system.

The internal system however simply had a database. There were two loose sql files that had DDL script, but no indication of what or why or the order that they should be applied. So for this system I have created an SSDT project within the solution and imported the schema into that. SSDT projects can also manage static data, so I used the venerable old [Static Data Script Generator for SQL Server](https://code.google.com/p/staticdata/), with a custom template and SQLCMD vars to generate the static data scripts. How all this has been put together, and the way the project is deployed is a subject for a different blog post though.
