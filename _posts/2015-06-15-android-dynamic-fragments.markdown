---
layout: 	post
title:  	"Creating an Android app that uses dynamic fragments"
description:  "When running before you've learned to walk, make sure to have as many scissors in your hands as possible."
date:   	2015-06-15 16:00:00
categories: android dynamic fragments
comments: true
---

For various reasons that are too complicated (and mostly forgotten) I recently ended up installing [Android Studio][android-studio-download]. The original reasons I did this have frittered away into the mists of time, however one of my experiments has stuck around.

One of the things I've been looking at doing for some time is building a small app for myself which would have certain parts that are dynamically generated/refreshed (aren't they all?). So I started with the [Building Your First App][android-first-app-tutorial] tutorial and came through it reasonably quickly and unscathed. I moved on to the [Adding the Action Bar][android-action-bar-tutorial] tutorial, and decided "yeah, I know what I'm doing".

I quickly moved to the [Building a Dynamic UI with Fragments][android-dynamic-fragment-tutorial], but quickly ran into problems (uh-oh, running before I can walk!):

* The tutorial is very fragmentary, it only shows the absolute bare bones
* The tutorial actually does something slightly different to what I was expecting (it swaps part of an activity for a different activity, and then adds data through an adapter, something I didn't want to do)
* For the life of me I couldn't open the tutorial in Android Studio, which made navigating it hard (I suck, I know)

So I started hunting around the internet and the best tutorial I found was from [Lars Vogel - Multi-pane development in Android with Fragments - Tutorial][vogel-fragment-tutorial]. So armed with these tutorials and various bits of found information I set off on enhancing my application...

The first step (for me at any rate), was to [remove the support library][remove-support-library]. The reason I wanted to do this was that a lot of the information I was finding was based on the later Android SDKs, and not using the support library. The support library, amongst many other things, adds fragment support to older versions of Android, but necessarily names and method signatures are slightly different.

The next step in the process was to add a message fragment, the first part is the MessageFragment class. A couple of points about the class: The class has a static factory function that takes the information to be displayed in the fragment, and then returns an instance of the class:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/java/es/codemunki/sample/MessageFragment.java?slice=17:25"></script>

One point to notice is that the string is put into an argument [Bundle][android-bundle-docs], that is then fed to the [Fragment][android-fragment-docs] [setArguments][android-fragment-setargs-doc]. Of course it would be possible to simply put the arguments into the class and hold them as members, but this doesn't seem to be _The Done Thing<sup>TM</sup>_. (Beginner, remember...?)

The other thing of importance is the way that the string is populated into the fragment UI. This is done in the _onStart_ override:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/java/es/codemunki/sample/MessageFragment.java?slice=63:70"></script>

The reason this is done in onStart, rather than _onCreate_ is because of the way the [activity lifecycle][android-fragment-lifecycle-docs] works.

As well as adding the MessageFragment class a [layout][sample-fragment-layout] is created, and the referenced static string (to supply default content) is added to the [strings.xml][sample-strings-xml].

Once the fragment was ready I moved on to adjust the main activity layout. First I moved the text input and button into a [LinearLayout][android-linearlayout-docs]:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/res/layout/activity_main.xml?slice=6:22"></script>

Doing this isolates these static parts of the display from the parts that will change.

I also added a second LinearLayout, this one is empty and has an orientation of _vertical_ so that new fragments appear at the bottom. The height of the layout is set to _fill_parent_ so that it occupies all space that is available.

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/res/layout/activity_main.xml?slice=23:30"></script>

At this point it's important to note that the height for the [fragment][sample-fragment-layout] is set to _wrap_content_ (on both the _FrameLayout_ and _TextView_) (lines 3 and 8). This allows the display of the fragment to be large enough to show the required text, but not take up the entire area. Originally I had both set to _match_parent_ and was wondering why only one fragment ever displayed, even though the code was working correctly.

The final step is to update the [Main Activity][sample-main-activity]. There are two updates that are needed, first it has to implement the _OnFragmentInteractionListener_ interface defined in the message fragment:

Definition:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/java/es/codemunki/sample/MessageFragment.java?slice=71:85"></script>

Declaration:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/java/es/codemunki/sample/MainActivity.java?slice=14"></script>

Implementation:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/java/es/codemunki/sample/MainActivity.java?slice=64:67"></script>

Declaring an interface like this allows the fragment to accept user input, but delegate it's action to containing class(es). In this case there is (currently) nothing I want to deal with.

The other part of _MainActivity_ that needs to be changed is make the _SendMessage_ method create and display the fragment, easy right?

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/java/es/codemunki/sample/MainActivity.java?slice=53:63"></script>

Actually yes, this particular part of the process is reasonably well documented. The method simply retrieves the string the user has entered, uses the [Activity][android-activity-docs]'s [getFragmentManager Method][android-activity-docs-getfragmentmanager] to get a [FragmentManager][android-fragmentmanager-docs], and then includes the newly created fragment into the display.

And this is what the built app looks like:

<img src="/assets/2015-06-15-app1.png" alt="Screen shot 1" style="width: 200px;" />
<img src="/assets/2015-06-15-app2.png" alt="Screen shot 2" style="width: 200px;" />
<img src="/assets/2015-06-15-app3.png" alt="Screen shot 3" style="width: 200px;" />

Text is entered in the text box, press Send and it is added to the area below. Why? Because I wanted to find out how to do it...

[android-studio-download]:                    https://developer.android.com/sdk/index.html
[android-first-app-tutorial]:                 https://developer.android.com/training/basics/firstapp/index.html
[android-action-bar-tutorial]:                https://developer.android.com/training/basics/actionbar/index.html
[android-dynamic-fragment-tutorial]:          https://developer.android.com/training/basics/fragments/index.html
[vogel-fragment-tutorial]:                    http://www.vogella.com/tutorials/AndroidFragments/article.html
[remove-support-library]:                     https://mobiarch.wordpress.com/2015/04/17/removing-support-library-in-android-studio/
[android-bundle-docs]:                        http://developer.android.com/reference/android/os/Bundle.html
[android-fragment-docs]:                      http://developer.android.com/reference/android/app/Fragment.html
[android-fragment-setargs-doc]:               http://developer.android.com/reference/android/app/Fragment.html#setArguments(android.os.Bundle)
[android-fragment-lifecycle-docs]:            http://developer.android.com/reference/android/app/Fragment.html#Lifecycle
[sample-fragment-layout]:                     https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/res/layout/fragment_message.xml
[sample-strings-xml]:                         https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/res/values/strings.xml
[android-linearlayout-docs]:                  http://developer.android.com/guide/topics/ui/layout/linear.html
[sample-main-activity]:                       https://github.com/steve-codemunkies/Android-Studio-Sample/blob/master/app/src/main/java/es/codemunki/sample/MainActivity.java
[android-activity-docs]:                      http://developer.android.com/reference/android/app/Activity.html
[android-activity-docs-getfragmentmanager]:   http://developer.android.com/reference/android/app/Activity.html#getFragmentManager()
[android-fragmentmanager-docs]:               http://developer.android.com/reference/android/app/FragmentManager.html
[app-screen-shot-1]:                          /assets/2015-06-15-app1.png
[app-screen-shot-2]:                          /assets/2015-06-15-app2.png
[app-screen-shot-3]:                          /assets/2015-06-15-app3.png
