---
layout: 	post
title:  	"Bash: Bulk rename some files recursively"
description:  "How to 'just' rename some of the files in a directory in a bash shell (and in the child directories)"
date:   	2023-06-16 10:40:00
categories: bash while-loop mv sed find
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

A short entry today. I'm investigating some new behaviour but want to make use of [previous work]({% post_url 2023-06-01-aws-using-aws-cli-to-search-within-files-in-an-s3-bucket-pt1-cloudfromation %}). But I didn't want everything called `find-an-sqs-event.*`.

Using the answers to [Rename multiple files based on pattern in Unix](https://stackoverflow.com/questions/1086502/rename-multiple-files-based-on-pattern-in-unix) and [Recursively iterate through files in a directory](https://unix.stackexchange.com/questions/139363/recursively-iterate-through-files-in-a-directory) I was able to put together this command line:

```sh
while read line; do mv "$line" $(echo "$line" | sed 's/find-an-sqs-event/body-filter/g'); done < <(find . -name 'find-an-sqs-event*' -type f)
```

If I only wanted change the names of the files in the current directory I could have used something like `for f in find-an-sqs-event; do...`, but then I would need to traverse the directory structure. The [find command](https://linuxhandbook.com/find-command-examples/) allows you to search recursively, and using [process substitution](https://mywiki.wooledge.org/ProcessSubstitution) (`done < <(find . -name 'find-an-sqs-event*' -type f)`) forces the output of the find command into the while loop.

A [command substitution](https://www.baeldung.com/linux/parameter-expansion-vs-command-substitution#command-substitution) uses `sed` to change `find-an-sqs-event` to `body-filter` while keeping the name of the directory the file is in, and the existing extension (`$(echo "$line" | sed 's/find-an-sqs-event/body-filter/g')`). This command substitution is then used in an `mv` command: `do mv "$line" $(echo "$line" | sed 's/find-an-sqs-event/body-filter/g');`.
