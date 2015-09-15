---
layout: 	post
title:  	"Why is my Javascript RegExp doing that?! The g flag..."
description:  "Some people, when confronted with a problem, think 'I know, I'll use regular expressions'. Now they have two problems."
date:   	2015-04-29 10:15:00
categories: javascript regexp
comments: true
---
I recently picked up a defect in a [cordova][apache-cordova] application; searching through the locally stored records simply wasn't returning the expected results. My initial thought was that there was something slightly wonky with the data, or a hidden space; but no it was all very vanilla.

The next thing I did was to re-write the filtering code in an expanded form. The filter now started behaving correctly, returning the expected records. Hmmmm... This is not good. So then I started experimenting in the console, and was able to recreate my odd results. The code I was using was very similar to this:

<script src="https://gist.github.com/steve-codemunkies/7e99bedabc058bae4401.js"></script>

(The code can be run either in a browser console or node REPL.) Looking at that you'd expect the log output to be:

<pre>Steven Hocking,Robert Stevenson,Steve Hocking</pre>

_But!_ What you actually get is:

<pre>Steven Hocking,Robert Stevenson</pre>

_Whuuut?!_ So now I created a slightly different test in the console:

<script src="https://gist.github.com/steve-codemunkies/fd4048557af2ab7d4b17.js"></script>

The result I really want to see (more in hope than expectation) is this:

<pre>true,true,true,true,true,true,true,true,true,true</pre>

Instead I saw this:

<pre>true,false,true,false,true,false,true,false,true,false</pre>

Ahhh... At this point a colleague who was looking at this with me suggested dropping the global (g) flag from the regex:

<script src="https://gist.github.com/steve-codemunkies/835c0e540655606cdbdf.js"></script>

And now we get the result we wanted:

<pre>true,true,true,true,true,true,true,true,true,true</pre>

_Ionut G. Stan's_ [answer][stackoverflow-regexp] on _Stackoverflow_ provides the reason for this behaviour: when the global (g) flag is set, Javascript will remember the end point of the last match. If you do need to use the global flag then you can reset the _lastIndex_ property on the regexp to zero, or whatever value you need.

<script src="https://gist.github.com/steve-codemunkies/9fe8e0ed845a0bf5c342.js"></script>

[apache-cordova]:       https://cordova.apache.org/
[stackoverflow-regexp]: http://stackoverflow.com/a/1520853/747649
