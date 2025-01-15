---
layout: 	post
title:  	"PwdGnr8r: Android password generation app - Preferences"
description:  "Expressing an Android Preference"
date:   	2015-09-23 12:30:00
categories: android pwdgnr8r preferences app
comments: false
page-type: article
hero-image: /assets/2015-09-23-dev-workspace.jpg
---
[Passwords are not nice, are not easy, and cause headaches](https://www.google.com/webhp?ie=UTF-8#q=site:codinghorror.com+passwords).

Unfortunately, they are what anyone who is offering a service to us wants us to use. A few years ago I got fed-up with my password management strategy (I didn't have one), and investigated the possibilities. I settled on generating an (essentially) gibberish string and *memorizing it* in a somewhat obfuscated way... (I write them down, so shoot me!) To aid this I created a nice powershell function:

<script src="https://gist.github.com/steve-codemunkies/36b21b65170b9678a625.js"></script>

And I usually call it thusly:

<pre class="terminal">
1..10 | %{ New-Password }
</pre>

And this works nicely, generating 10 passwords that I can choose from, but it does have a couple of limitations:

* Characters can be (and usually are) repeated
* It's a powershell function (so you need to already be logged in and have bits of my profile setup in powershell)
* And I'm sure there are others

As I've already posted I've been looking at [Android development]({% post_url 2015-06-15-android-dynamic-fragments %}), so why not create a small app to generate passwords automatically? Crucially by doing it in an Android app I would then have something with me most of the time where I can get a new password. *Nice!* So I quickly scratched down a design for my *very basic* app:

<img src="/assets/2015-09-23-main-screen-design.jpg" alt="Main screen" style="width: 300px;" />
<img src="/assets/2015-09-23-preference-screen-design.jpg" alt="Main screen" style="width: 300px;" />

And such works of art they are!

So with Android Studio fired up, and a pristine new project loaded off I set. One of the important (to me) parts of the powershell function is that I'm able to specify complexity and length when necessary. So I decided to get the <s>settings</s> preferences working first. And here [Google's own tutorial](http://developer.android.com/guide/topics/ui/settings.html) came up trumps. Creating an initial set of preferences

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/PwdGnr8r/blob/99f0ee7ab4e08e58aee36293daed3f42594f2d20/app/src/main/res/xml/preferences.xml"></script>

and getting them up on screen

<img src="/assets/2015-09-23-initial-preferences.png" alt="Initial preferences screen" style="width: 400px;" />

was pretty straightforward. Unfortunately there were a couple of problems: the length allowed anything; and the summary for the length was not working correctly.

<img src="/assets/2015-09-23-ip-text-number.png" alt="Initial preferences screen" style="width: 400px;" />

Going through the tutorial led me to [building a custom preference](http://developer.android.com/guide/topics/ui/settings.html#Custom), which is fine, though work that I felt sure that someone else had already done. Some judicious searching revealed that [Niklas Baudy](https://github.com/vanniktech) [was way ahead of me](https://github.com/vanniktech/VNTNumberPickerPreference). Integrating the *VNTNumberPickerPreference* in to my project really was as straightforward as [README.md](https://github.com/vanniktech/VNTNumberPickerPreference/blob/master/README.md) suggests:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/PwdGnr8r/blob/master/app/build.gradle?slice=21:30"></script>

Updating the preferences xml was also straightforward:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/PwdGnr8r/blob/master/app/src/main/res/xml/preferences.xml?slice=4:14"></script>

One problem I did encounter was that I had re-used the preference name, so it already existed, as a string, which caused some crashes. Once I engaged brain and read the error message in the console that was quickly solved by uninstalling the app from the emulator, and then running again.

By default *VNTNumberPickerPreference* provides a simple summary of the selected value. But my design (ha!) called for something a little more *sophisticated*. Looking at the sample application revealed that I should be implementing *SharedPreferences.OnSharedPreferenceChangeListener* and overriding *onSharedPreferenceChanged*:

<script src="http://gist-it.appspot.com/https://github.com/steve-codemunkies/PwdGnr8r/blob/master/app/src/main/java/es/codemunki/pwdgnr8r/SettingsActivity.java?slice=74:81"></script>

I did try implementing *Preference.OnPreferenceChangeListener* and overriding *onPreferenceChange* but although this gets called the summary set by Preference itself is used.

The completed preference screen now looks like this.


<img src="/assets/2015-09-23-proper-preferences.png" alt="Preferences screen with custom summary" style="width: 300px;" />
<img src="/assets/2015-09-23-pp-number-selector.png" alt="Preferences screen with number selector" style="width: 300px;" />
