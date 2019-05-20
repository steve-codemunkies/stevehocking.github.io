---
layout: 	post
title:  	"Bulk updates to files using Powershell"
description:  "Sometimes you just have to do some bulk updating on some files."
date:   	2019-01-07 21:00:00
categories: powershell bulk
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

For reasons I today needed to apply some bulk updates to a _lot_ of code files. A colleague did this last week, using [sublime text](https://www.sublimetext.com/) to make the required changes within files, and then I helped him put together the necessary changes to rename files in Powershell. This week it has been my turn to do something very similar. Except the problem is, whilst I know I can do these changes in Powershell the exact commands always elude me and I need to work them out each time. So now is the time to document how I did it today for posterity.

My first step was to apply some file renames, but only to specific files. If you're here your probably aware of `Get-ChildItem -Filter "your-filter"`. My issue is that actually I only want to change files named `*Your-Filter*`and ignore `*your-filter*`. (Yes, I'm aware [Windows isn't case sensitive, but NTFS is...](https://superuser.com/a/364062).) Regexes are case sensitive, and Powershell does regex by default. Except `Get-ChildItem` doesn't. What we can do though is pipe the files through to another Cmdlet and filter them there. For this we can use the `Where-Object` Cmdlet, which is aliased to `?`. The last part then is to use `Rename-Item` to do the rename. And so:

```
Get-ChildItem -Recurse | ?{ $_.Name -match "Your-Filter"  } | %{ Rename-Item $_.PSPath -NewName ($_.Name -replace "Your-Filter","My-File") }
```

Breaking this down:

1. `Get-ChildItem -Recurse` gets all of the items under the current directory and sub-directories.
2. `?{ $_.Name -match "Your-Filter"  }` `?` is an alias for the `Where-Object` Cmdlet, [`$_` is a pipeline placeholder](https://www.computerperformance.co.uk/powershell/dollar-variable/), `-match` invokes a regex match. The whole construct filters the incoming files based on name using the provided regex.
3. `($_.Name -replace "Your-Filter","My-File")` is an expression that replaces `Your-Filter` with `My-File` and returns the new string.
4. `%{ Rename-Item $_.PSPath -NewName ($_.Name -replace "Your-Filter","My-File") }` `%` is an alias for the `ForEach-Object` Cmdlet, looping over each object in the pipeline. For each item, we then call the `Rename-Item` Cmdlet, passing it the items `PSPath` property. The new name is derived from the expression shown in step 3.

The next step was selectively change the contents of files. Theoretically this can be done using `Get-Content` and `Set-Content`. But there are two problems:

1. `Set-Content` seems to always update the specified file. This is problematic because only _some_ of the files need changing, and I don't want a commit touching every single file.
2. `Get-Content` (by default) gets the file contents as an array of strings. This makes it hard to determine if we can skip updating the current file.

The key (for me) to resolving this was discovering that [`Get-Content` has a `-Raw` flag that retrieves the contents as a single string](https://www.powershellmagazine.com/2012/11/13/pstip-get-the-contents-of-a-file-in-one-string/). Using this I was able to come up with the following multi-line script:

```
$files = Get-ChildItem -Recurse | ?{ !($_.PSIsContainer) }

foreach($file in $files) {
  $contents = Get-Content -Path $file.PSPath -Raw

  if($contents -match "Your_Filter") {
    Set-Content -Value ($contents -replace "Your_Filter", "My_Filter") -Path $file.PSPath
  }
}
```

Breaking this down:

1. `$files = Get-ChildItem -Recurse | ?{ !($_.PSIsContainer) }` get the list of items in the current directory and sub-directories, and then filters out any directories (as you can't alter the contents of a directory in this way...). The list of files is then assigned to the `$files` variable.
2. `foreach($file in $files)` loops over the files in the `$files` variable. This could have been written as `%{ ... }` with `$_` replacing `$file`.
3. `$contents = Get-Content -Path $file.PSPath -Raw` gets the contents of the current file as a single string.
4. `if($contents -match "Your_Filter")` as above `-match` invokes a regex comparison on the variable.
5. `Set-Content -Value ($contents -replace "Your_Filter", "My_Filter") -Path $file.PSPath` when executed this step will cause the text `Your_Filter` to be replaced with `My_Filter` and then saved to the file.

The above could (probably) be re-written as a one-liner just using pipes and without variables, and I leave that as an exercise for you the reader :) .
