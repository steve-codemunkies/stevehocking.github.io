---
layout: 	post
title:  	"Authentication and Authorization: Integrating Active Directory"
description:  "Who are you? You want to do what? Why should I believe you?"
date:   	2015-11-18 12:45:00
categories: legacy authentication authorization authorisation "active directory" ad ldap dotnet
comments: true
page-type: article
hero-image: /assets/2015-11-05-legacy.jpg
---
One of the more, _ahh_, _interesting_ points about the two legacy systems I'm helping to maintain are that both of them use use essentially custom built security to authenticate and authorize (a&a) users. And neither are very good. The good news is that both of these applications are internal, so it isn't the end of the world, yet...

Ok, now it is!

So the question that comes up is:

### How do we improve the security of these systems? ###

Essentially (from my point of view) there are two things that can be done:

* **Improve the existing code by fixing the errors that have been made with the existing A&A systems**. But that still leaves our team responsible for authenticating _and_ authorising users. And a recent internal audit has shown up that the teams managing these kind of things are really poor at managing permissions (i.e. keeping them minimal), and removing users who should not be accessing the system anymore.

* **Use _someone else's_ authentication and claims system in out system**. All of a sudden we just have to authorise a user based on the claim presented by someone else.

  And if we can tap into a system that has some kind of management processes around it, even better...

Play the William Tell Overture! Here comes Active Directory!

So that's that sorted out, we'll just flip on Windows Authorization, give it all a quick test, _jobs a good 'un_!

Sorry, what's that, it doesn't just work? And you've not got a asp.net application? Oooh...

So I've been investigating building an active directory authentication service. Most of the code I'll show you here is based on the _LdapAuthentication_ class in the [Active Directory Authentication from ASP .NET](<https://msdn.microsoft.com/en-us/library/ms180890(v=vs.80).aspx>) article, though I have had to modify it. One issue that I had early on was [working out what AD server to connect to](http://stackoverflow.com/a/749316/747649) which lead me to the MSDN article on [Serverless Binding and RootDSE](<https://msdn.microsoft.com/en-us/library/ms677945(VS.85).aspx>).

<script src="https://gist.github.com/steve-codemunkies/3ff6e307b2ee9f4fde1b.js"></script>

The first snippet (_authenticate.cs_) shows how it is possible to authenticate the user. Line 3 sets up the [_DirectoryEntry_](<https://msdn.microsoft.com/en-us/library/system.directoryservices.directoryentry(v=vs.110).aspx>) with a path to Active Directory and the username and password to authenticate. It is line 4, accessing the [_NativeObject_](<https://msdn.microsoft.com/en-us/library/system.directoryservices.directoryentry.nativeobject(v=vs.110).aspx>) that actually causes the authentication to happen.

Getting the claims for the user proved to be harder. .NET provides the [_DirectorySearcher_](<https://msdn.microsoft.com/en-us/library/system.directoryservices.directorysearcher(v=vs.110).aspx>), but actually being able to use it was problematic. Doing the search in the way suggested by the _Active Directory Authentication from ASP .NET_ was failing for me as the internal AD is setup to not allow searching by authenticated users. It turned out that the trick here was to use the _defaultNamingContext_ to set the search path (line 4). The rest of the _claims.cs_ snippet is concerned with extracting the groups that the user belongs to.
