---
layout: 	post
title:  	"Not all changes to your React components result in events"
description:  "Your expectation may be being matched by mistake"
date:   	2021-05-10 19:00:00
categories: javascript react material-ui
comments: false
page-type: article
hero-image: /assets/2021-05-03-web-dev.jpg
tile-image: /assets/2021-05-03-web-dev-tile.jpg
---

I've been playing with React recently, and realised that I'd setup my forms incorrectly, I was not [lifting the state](https://reactjs.org/docs/lifting-state-up.html). In fixing up some of the tests I then broke some tests that were previously working. Looking at the following code which tests do you think will pass?

<script src="https://gist.github.com/steve-codemunkies/ecf2464a59dad64567fd6a36c79bcb2b.js"></script>

The first test (from `changed` to `test`) should pass. But what about the second test (from `test` to `test`)? Somewhat naively I'd assumed that my code would trigger an event that would simply be reflected up into my code. Unfortunately this was not the case. I'm documenting this here in the hope that I'll remember this in the future!