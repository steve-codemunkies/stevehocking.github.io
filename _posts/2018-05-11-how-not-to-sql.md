---
layout: 	post
title:  	"How not to write SQL statements"
description:  "Your TSQL statements might be around a lot longer than you expect..."
date:   	2018-05-11 13:15:00
categories: legacy maintenance sql tsql
comments: true
page-type: article
hero-image: /assets/2015-11-05-legacy.jpg
tile-image: /assets/2015-11-05-legacy-tile.jpg
---

We have a tendency to think of computers and the software that runs on them as ephemeral, fleeting artefacts, here today, gone tomorrow. Both of the systems I and my team look after disprove this. And indeed the older of the two (nearly twenty years old now) is the subject of this post.

We're all familiar SQL statements that look something like this:

```SQL
SELECT *
FROM MyTable
```

On SQL Server this statement assumes that `MyTable` is in the default schema that you have been given access to. This may not be the case, in which case you may end up with a statement like this:

```SQL
SELECT *
FROM mySchema.MyTable
```

Again on SQL Server there is an assumption that `myschema.MyTable` are in the database that you have specified when connecting to SQL Server, or that you have somehow changed your connection to use. You may have legitimate reason to query across serveral databases, and SQL Server will let you do this (subject to permissions checks):

```SQL
SELECT *
FROM myDatabase.mySchema.MyTable
```

And finally, if you need to query a database on _another server_ you can do through [linked servers](https://docs.microsoft.com/en-us/sql/relational-databases/linked-servers/create-linked-servers-sql-server-database-engine?view=sql-server-2017) (though this requires a little more preparation). If you're doing this your query will look a little like this:

```SQL
SELECT *
FROM myServer.myDatabase.mySchema.MyTable
```

With all of that context we can now look at todays issue. For reasons lost with the original developers a decision was made that all SQL Server objects in queries should be fully qualified. To the server level. And this means that the vast majority of queries in the application look somewhat like the one above.

In a single server system this is fine, as the server name will be the name of the server that the database is hosted on, and SQL Server will auto-magically sort this out for you. However if your database is a member of an [Always on Availability Group](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/overview-of-always-on-availability-groups-sql-server?view=sql-server-2017) you will likely be using an [Availability Group Listener](https://docs.microsoft.com/en-us/sql/database-engine/availability-groups/windows/create-or-configure-an-availability-group-listener-sql-server?view=sql-server-2017).

In this situation you create a listener (which consists of an ip address and a name), and this is managed by Windows Clustering to point to the Primary server (unless you've said you're only reading in which case it may be a secondary that you're directed to). Now because you're a very clever software developer you've taken some account of the fact that your software and databases can move, and your query may well look something like this:

```SQL
SELECT *
FROM myListener.myDatabase.mySchema.MyTable
```

The problem is that whilst the SQL Server on `myServer` knows a little bit about the _Always on Availability Group_, the listener is transparent. Which means you end up with a message like this:

```SQL
Msg 7202, Level 11, State 2, Line 4
Could not find server 'myListener' in sys.servers. Verify that the correct server name was specified. If necessary, execute the stored procedure sp_addlinkedserver to add the server to sys.servers.
```

Now in fairness how could the developer twenty years ago have known about _Always on Availability Groups_? They couldn't. It's easy. However they could have significantly simplified things by not being so pedantic as insisting on qualifying all of the SQL Server objects to server level. [The more complex a piece of software is, the more likely it is to fail](https://www.computerworld.com/article/2550521/enterprise-applications/the-no--1-cause-of-it-failure--complexity.html), and this is an example "It might be needed at some point" complexity.

Unfortunately at this point I haven't found a clever way of fixing this, other than testing and fixing when an error occurs. Fortunately for me (on this occasion) only one affected query was in code, the remainder of the queries were stored in the database (no, not in functions or stored procedures) and reasonably straight forward to fix.
