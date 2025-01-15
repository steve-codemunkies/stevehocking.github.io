---
layout: 	post
title:  	"Enabling Jenkins to build GitHub Enterprise Pull Requests"
description:  "Taking some of the load out of code reviews"
date:   	2016-10-13 08:55:00
categories: github github-enterprise jenkins pull-request
comments: false
page-type: article
---

The first step in getting Jenkins to build Pull Requests is to get the [GitHub pull request builder plugin](https://wiki.jenkins-ci.org/display/JENKINS/GitHub+pull+request+builder+plugin) installed and setup. Installing is easy, simply go into Jenkins > Plugin Manager, go to the Available tab, check the box next to *GitHub pull request builder plugin* and press the buttons to do the install. More information is available on the plugins [readme](https://github.com/jenkinsci/ghprb-plugin/blob/master/README.md). Some basic configuration is required on Jenkins *configuration page* (Manage Jenkins > Configure System) look for the *GitHub Pull Request Builder* section. You'll need to provide an address for your GitHub api and a user for the plugin to log in to GitHub with.

To really get the benefit of building pull requests we need to install a webhook on the repository that we are interested in. Except that we don't do it, we have to let Jenkins (or more specifically GitHub user that Jenkins is using) do it. The easiest way to do this is to do this is to put the Jenkins user into a team within your (GitHub) organisation.

Go to GitHub, go into the organisation the repository belongs to, and click the *Team* tab (circled red).

![](/assets/2016-10-13-org-teams.PNG)

Locate the *+ New Team* button (circled red).

![](/assets/2016-10-13-org-add-new-team.PNG)

Add your Jenkins user to the group, at this point you can remove yourself from the group, assuming that the Jenkins users is a seperate user.

The next step is to go to the repository that you want Jenkins to build Pull Requests on, and go to the settings tab (circled red).

![](/assets/2016-10-13-repository-settings.PNG)

And click on *Collaborators & teams* (circled red).

![](/assets/2016-10-13-repository-settings-two.PNG)

Add the group containing your Jenkins user, and then grant them *Admin* access to the repository (circled red).

![](/assets/2016-10-13-repository-jenkins-admin.PNG)

This completes the configuration on the GitHub side. Back in Jenkins go to the configure your build. In the *Build Triggers* section locate the *GitHub Pull Request Builder* checkbox and check it (circled red).

![](/assets/2016-10-13-enable-pull-request-build.PNG)

The one setting we have changed from default is the *Build every pull request automatically without asking (Dangerous!).* setting, turning it on. We additionally had to add a *Update commit status during build* *Trigger* setting the *Commit Status Context*. You may or may not need to do this depending on your setup.

The final step is to add the *Set build status on GitHub commit* *Post-build Action*, if the build is completed successfully then the last commit is flagged.
