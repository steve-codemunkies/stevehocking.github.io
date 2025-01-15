---
layout: 	post
title:  	"Share SSH Keys between multiple WSL2 Distributions"
description:  "Because why stop at one distribution?"
date:   	2025-01-15 20:30:00
categories: docker ssh ssh-keys wsl2 keychain
comments: false
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

I've been using WSL2 distributions for personal development for quite some time. As part of that development process I created a SSH key and set it up in github, and use it to authenticate my WSL2 distribution for git operations.

For reasons I've needed to setup a second distribution for some experimentation I've been doing, but I didn't want to setup a new set of keys and try to remember a new passphrase. So I had a think about I can share the keys from distro A to distro B. Then I remembered that my [AWS credentials were synchronised from Windows](https://alexey-gnetko.com/posts/synchronize-windows-aws-profile-with-wsl/).

## How not to share SSH keys between distros

So I moved the files in `~/.ssh` to `/mnt/c/Users/<username>/.ssh`, removed the `~/.ssh` folder and then created the symlink:

```bash
ln -s /mnt/c/Users/<username>/.ssh ~/.ssh
```

I verified, that the folder was linked (`ls -la`  in `~`), and then restarted WSL. When I went into my WSL2 distro I was confronted with this:

```bash
 * keychain 2.8.5 ~ http://www.funtoo.org
 * Waiting 5 seconds for lock...
 * Found existing ssh-agent: 622
 * Error: Problem adding; giving up
```

Uh-oh... After doing some rumaging on the internet I discovered that the best way to determine the issue was to call `ssh-add` directly (`ssh-add ~/.ssh/id_ed25519`) which elicited this output:

```bash
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0777 for 'id_ed25519' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
```

`ls -la ~/.ssh` showed that indeed the permissions for all the files in that symlinked folder were indeed wide open, and deep rumaging on the internet failed to show anyway to control these permissions 😔.

## How to share SSH keys between distros in a way that will work

Unfortunately a simple symlink isn't going to work. And statically copying the files once won't cut it, because occasionally the keys might change. But does the copying need to be static...? 💡

Happily the `C:\` drive is mounted in the distro early, so is available during the processing of the `.bashrc` file, so how to copy the keys each time I go into the distro? Glad you asked...

```bash
# Remove the existing contents of the ~/.ssh folder
rm ~/.ssh/*
# Copy the contents of the C .ssh to local .ssh
cp /mnt/c/Users/<username>/.ssh/* ~/.ssh

# Set the permissions on each file
for file in ~/.ssh/*; do
    # Double check that it really is a file
    if [ -f "$file" ]; then
        # Set the permissions to read/write for me alone https://www.howtogeek.com/437958/how-to-use-the-chmod-command-on-linux/
        chmod 600 "$file"
    fi
done
```

There is probably a better way of copying the files to the home folder on the distro, however this route does work and provides a level of security.

The final thing is that if you create new keys on a distro using this code in the `.bashrc` you will need to manually copy them back to the host OS disk, or they will be destroyed the next time you log in.