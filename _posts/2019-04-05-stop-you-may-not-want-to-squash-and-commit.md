---
layout: 	post
title:  	"Stop! You may not want to squash and commit..."
description:  "Yes it gets rid of cruft, but so does rebase"
date:   	2019-04-05 22:00:00+01:00
categories: git hg mercurial
comments: false
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

## TL;DR

* It turns out I've been doing development stuff _a long time_
* One size fits all policies rarely work well
* `git rebase` is hard, but isn't the only way to clean up the cruft in a branch
* squash and merge may be beneficial in certain situations

## A grey-beard sermonises...

My first encounter with [Distributed Version Control (or DVC)](https://en.wikipedia.org/wiki/Distributed_version_control) happened around ten years ago, and was actually with [Mercurial or (Hg)](https://www.mercurial-scm.org/). At the time I'd heard much about [Git](https://git-scm.com/), but hadn't used it. One of the major differences between the two was summed up to me like this:

> Commits in Mercurial are immutable, once you have written the commit you cannot change it. But commits in Git are _maybe_ immutable, everyone has to agree that a commit is immutable. It's possible to go back and change pretty much everything about a commit. *But I don't know why you'd want to do that...*

And being a callow youth there that stayed, until recently. The reason I bring it up now is that a couple of things have happened recently that reminded me of this.

## Squash and merge is the law of unintended consequences in action

In the first situation myself and a colleague were investigating an issue that had occurred with some newly deployed software. The minor difficulty was that we had created this software on a long lived feature branch ([there are reasons you may consider long-lived feature branches to be harmful](https://blog.newrelic.com/culture/long-running-branches-considered-harmful/)), and the software was actually already a couple of weeks old. If you're [committing with good messages](https://chris.beams.io/posts/git-commit) then this isn't too much of an issue. Once you've pinpointed the code that has caused the issue you can just look at the commit to find out _why_ the code/config/whatevs is that way. (And here I'm going to call out [GitLens in VS Code](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) as it surfaces this information _right in the editor_.)

![GitLens in action, I don't use Dark Themes, sue me!](/assets/2019-04-05-vscode-gitlens.png)

Except that what we saw in the editor wasn't information on why the code or config was the way it was. What we saw instead was all the code/config in the file associated with a single commit, with a subject line of the name of the long-lived feature branch. On clicking through to view the commit we were confronted with a _Wall Of Text_.

![Walls of text are no good for anyone. Don't do it! Stop it!](/assets/2019-04-05-wall-of-text.png)

This was a branch with _60+_ commits on it, that had consisted of tens of sub-branches (some of which had also been squash-merged, but I'll come to that). And in that _Wall Of Text_ was the information I needed. I'll be truthful, we abandoned that line of inquiry and worked backward to try and establish why things were that way. In talking to my colleague who had squash-merged, it emerged that it was common practice within the organisation.

## It's good to talk

The second situation occurred earlier this week. A member of another team had tweaked some of our code because it came to light that the events they were generating (and we were consuming) whilst having sensible names, had names that could cause problems in the future. ([Naming things is one of the hardest problems in computer science.](https://www.martinfowler.com/bliki/TwoHardThings.html))

<!-- https://blog.hubspot.com/blog/tabid/6307/bid/34273/How-to-Center-Align-Your-Embedded-Tweets-Quick-Tip.aspx -->
<blockquote class="twitter-tweet tw-align-center" data-lang="en-gb"><p lang="en" dir="ltr">There are 2 hard problems in computer science: cache invalidation, naming things, and off-by-1 errors.</p>&mdash; Leon Bambrick (@secretGeek) <a href="https://twitter.com/secretGeek/status/7269997868?ref_src=twsrc%5Etfw">1 January 2010</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

But I needed to put in a minor build fix, and appended it to his branch ([naughty](https://medium.com/@hugooodias/the-anatomy-of-a-perfect-pull-request-567382bb6067)). For some reason I decided to go and tell my colleague he could merge and kick off the deployment process. And for some reason he asked if it was ok to squash+merge. We started talking about commits, [good commit messages](https://chris.beams.io/posts/git-commit) and cleaning up cruft. His principal got involved in the conversation and the conversation to `rebase`ing, which pretty much killed it dead &#x1f644; .

And it is true, rebasing can be hard the first few times that you do it. But any skill worth acquiring is hard initially, and the same is true of `git rebase` (and I would argue that it is a distinct skill within the `git` skill set). As long as the original branch has been pushed up to a server you can then go to town on cleaning up the branch, and the only thing that will be lost (until you push again) is a little time.

## Squash and merge might not be that bad

Now I did mention above that it might be legitimate to squash and merge a branch. The one situation this may be legitimate is when you're working on a [_short-lived_ feature branch](https://trunkbaseddevelopment.com/short-lived-feature-branches/). But here you need to be careful. You need to ensure that your not creating a monster commit. You also need to go and edit the commit message that will be generated for you. Certainly on Github the commit message will consist of the branch name as the subject of the commit, and the commit messages as a bulleted list within the body.
