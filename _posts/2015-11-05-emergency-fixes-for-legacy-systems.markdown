---
layout: 	post
title:  	"Dealing with emergency fixes on poorly understood legacy systems"
description:  "If these things were easy everyone would be doing it"
date:   	2015-11-05 19:30:00
categories: legacy maintenance
comments: false
page-type: article
hero-image: /assets/2015-11-05-legacy.jpg
tile-image: /assets/2015-11-05-legacy-tile.jpg
---

**TL;DR** Planning, even in an emergency, produces confidence and ensures the desired outcome is reached.

I have recently joined a small team of developers (who are part of a larger development community), helping to look after two legacy solutions. The first solution has been developed in house over a number of years, and whilst it isn't in the best condition is straightforward, and a known quantity. I'll write more about this solution in the future.

The second, and by some distance - larger, solution is not like this. The acquisition path of this software is convoluted, at best. The software originates with a third party supplier, but is licensed as source code that we have the right to modify. The source code is now pretty ancient (in computing terms), and looks crusty.

As luck would have it an Emergency has forced the business to request that we update data in the database directly (to cancel sales), as the software is (correctly) blocking the necessary changes. It soon transpired that this was not the first time this type of request had been made, and nor would it be the last...

To improve the whole teams understanding of the system we decided to take a few steps back and work through the problem methodically, as a pair. And this is the process that we followed:

* **Identify the desired end state for the *majority* of the data**. It seems obvious, but one of my colleagues was preparing to dive straight in and alter data directly on the live server. This would have been disastrous as the changes we needed are very complex. The first step in this process was to find data related to a correctly cancelled simple sale. This was important, as most sales will be straight forward, but some become complicated because of (allowed) interventions further in the process.

* **Prototype the changes on a test system**. In the majority of systems this will be simple and straightforward, unfortunately for us it wasn't. Unfortunately the schema for our piece of software has a severe case of *mutating column names*: i.e. An Id column on one table will not use that name in any of the other tables. This means that mostly through prior knowledge, and a lot of experimentation we had to divine how various tables are linked.  
  But because we were using a test system it didn't matter.

* **Test the changes on a *copy* of the live system**. Once we had our proposed fix we tested it on a local copy of the live database. The reason we did this was that we lacked confidence that the data we had been testing against was sufficiently similar to the live data we needed to modify. Doing the modification against a copy of live gave us confidence. It also meant that we could connect a copy of the software and check that everything looked correct.

* **Apply the changes to the live system**. And it was at this point we were *very* happy we'd tried it against a copy of live. We knew that some of our modifications would error, but on our test server the script had simply carried on. For whatever reason on the live server it stopped at the first error. But because we'd already tried our solution against live data we knew that there was a fundamental problem, we simply needed to slightly alter our approach to the problem.

* **Automate the fix**. Well actually, in our case we didn't fully automate it. Instead we've created a new stored procedure and documented it's use, complete with sample calling script. For us, this is good enough, as we do not want to encourage the business to be doing this on a regular basis. However the next time the business need it we will be in a position to do the work in an hour or so, and more importantly other members of the team will be able to do the job.

Ultimately all this meant that it took a day and a half to complete the change for the business, instead of their hoped for hour-or-so. But if we hadn't done it this way, then an initial change would have been done very quickly, but we would be revisiting the consequences for some time to come.
