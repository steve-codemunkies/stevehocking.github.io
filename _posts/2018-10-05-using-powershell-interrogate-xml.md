---
layout: 	post
title:  	"Using Powershell to interrogate xml"
description:  "What to do when confronted with 100,000 lines of technobabble"
date:   	2018-10-05 10:15:00
categories: powershell xml xpath
comments: true
page-type: article
---

Love it or loathe it XML is probably a part of your daily life if you're a developer of any type. And if you're trying to process a particularly massive chunk of XML to understand an issue you will probably loathe it. There are lots of tools available to help us, but the first blocker is that we need to go off, find them, and then more likely than not install them. _But_ if you're blessed with working on any kind of moderately modern Windows operating system you have one installed already: Powershell.

Today I needed to process that 100k line file to help investigate an issue. specifically I needed to work out if we could de-duplicate some of the data in advance, because as you might have guessed we didn't actually need most of it.

A little bit of digging turned up two really good resources:

* [PowerShell Data Basics: XML](https://www.red-gate.com/simple-talk/sysadmin/powershell/powershell-data-basics-xml/) - This is in the redgate Hub, and is a really good primer on using the .NET XML classes within Powershell. However querying namespaced XML is somewhat hard, though not impossible.
* [Answer to _Read XML file which contains namespace PowerShell_](https://stackoverflow.com/a/20875439/747649) - This answer demonstrates using the Powershell native Xml functionality.

The first step is to load the xml into an `xml` object:

```
$doc = [xml](Get-Content 'C:\Temp\HotelResponse.xml')
```

What is happening here is that the `HotelResponse.xml` is being loaded as a text file, we are then casting to a Powershell `xml` object.

The next step is to setup an array of namespaces that are used within the xml document, the really nice thing about doing it in Powershell is that you just need to setup a [hashtable](https://kevinmarquette.github.io/2016-11-06-powershell-hashtable-everything-you-wanted-to-know-about/):

```
$namespaces = @{
    soap = 'http://schemas.xmlsoap.org/soap/envelope/';
    xsi = 'http://www.w3.org/2001/XMLSchema-instance';
    xsd = 'http://www.w3.org/2001/XMLSchema';
    ota = 'http://www.opentravel.org/OTA/2003/05';
}
```

Unfortunately I can't offer any special sauce or tips on how to get the namespaces, I simply do a visual scan of the file, and if necessary do a find in my favourite text editor.

The next, and most important step is to query the xml, in my case I was after the rooms being returned from a service:

```
Select-Xml -Xml $doc -XPath '//ota:RateDescription/ota:Text' -Namespace $namespaces
```

Because the incoming xml is namespaced your XPath query needs to be (in this case `ota:`). But oh noes! There's an issue with the output!

```

Node Path        Pattern
---- ----        -------
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
Text InputStream //ota:RateDescription/ota:Text
```

This output is less than useful... The objects that are coming through are `Microsoft.PowerShell.Commands.SelectXmlInfo`, and all that is happening is that powershell is `.ToString()`ing these objects to output them. But it's easily fixed by processing the response through a pipeline, like so:

```
Select-Xml -Xml $doc -XPath '//ota:RateDescription/ota:Text' -Namespace $namespaces | %{ $_.Node }
```

Executing this command now gives us the following output:

```
#text
-----
Resort View Double
Resort View Twin
Sea View Room Double
Sea View Room Twin
Deluxe Sea View Double
Deluxe Sea View Twin
Resort View Double
Resort View Twin
Sea View Room Double
Sea View Room Twin
Resort View Double
Resort View Twin
Deluxe Sea View Double
Deluxe Sea View Twin
Resort View Junior Suite Double
```

For me this gave me the information I needed to be able to move towards fixing my issue.
