---
layout: 	post
title:  	"'Cloning' an object in javascript"
description: "Sometimes you need an exact copy of a javascript object, here is one way to do that."
date:   	2015-03-24 15:45:00
categories: javascript
comments: true
page-type: article
---
Some recent work that I've been doing has necessitated the 'cloning' of objects in Javascript. The objects in question are ['normal' objects][javascript-object-types-mdn] rather than Function, or constructed objects. Unfortunately this isn't just a simple case of assigning the contents of one variable to another:

<pre>var original = {one: 1, two: 2, three: 3};
var copy = original;</pre>

If we did that and then altered or added a property on _original_, then those changes would apply in _copy_, because the two variables reference the same object.

Searching the internet turned up [How to clone an object in JavaScript][clone-object-mikita-manko] by Mikita Manko, which gives a good intro with some naive implementations, why they don't work; and a final working solution. Unfortunately for my purposes this solution wasn't quite right. A lot of the objects that I was dealing with contained [Array's][mdn-array], and whilst these are copied as objects, with properties accurately numbered, with the sub-data intact, the copy _wasn't_ an array. The problem is that _typeof_ is quite a blunt tool which will return a [limited set of values][mdn-typeof].

To get around this we need to be a little bit cleverer. Specifically we need to [find the name of an objects type][stackoverflow-type-name]. Restructuring the code a little bit to be more functional results in something that looks like this:

<script src="https://gist.github.com/steve-codemunkies/78391c10d7b126d76b85.js"></script>

Using the code is very straight forward:

<pre>var original = {one: 1, two: 2, three: 3, four: [{five: 5, six: 6}]};
var copy = clone(original);</pre>

If you need to deal with objects of other types then just expand the if-else-ladder between lines 25 and 33. Also, it should be noted that this code isn't used in a production scenario, but was used for a data migration where data fidelity was required.

[javascript-object-types-mdn]:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#.22Normal.22_objects.2C_and_functions
[clone-object-mikita-manko]:    http://www.mikitamanko.com/blog/2013/05/12/how-to-clone-an-object-in-javascript/
[mdn-array]:                    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[mdn-typeof]:                   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
[stackoverflow-type-name]:      http://stackoverflow.com/a/332429/747649
