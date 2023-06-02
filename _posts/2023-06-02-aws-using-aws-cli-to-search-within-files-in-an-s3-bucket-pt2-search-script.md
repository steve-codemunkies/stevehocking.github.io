---
layout: 	post
title:  	"AWS: Using the AWS CLI to search within files in an S3 Bucket - Part 2 - the Search Script"
description:  "How to 'just' search for a file in an S3 bucket"
date:   	2023-06-02 19:30:00
categories: aws awscli s3 cloudshell jq grep
comments: true
page-type: article
hero-image: /assets/2019-01-07-elite-hacking.jpg
tile-image: /assets/2019-01-07-elite-hacking-tile.jpg
---

Previously on codemunkies: [AWS: Using the AWS CLI to search within files in an S3 Bucket - Part 1 - Cloudformation]({% post_url 2023-06-01-aws-using-aws-cli-to-search-within-files-in-an-s3-bucket-pt1-cloudfromation %})

![A clock counts down](/assets/2023-06-02-previously.gif)

## Executing `find-file.sh`

As with the `generate-messages.sh` script you will need to set the execution bit, and this can be easily done with this command: `chmod u+x find-file.sh`

Once you have made [`find-file.sh`](https://github.com/steve-codemunkies/find-an-sqs-event/blob/main/scripts/find-file.sh) executable you invoke it like so: `./find-file.sh -b "<bucket name>" -p "<prefix>" -n "<grep pattern>"`

There are various parameters that can be set:

* `-b|--bucket <value>` - the bucket to search
* `-p|--prefix <value>` (optional) - the prefix (or folder) to search
* `-o|--objectCount <value>` (optional) - the number of object keys to retrieve from the bucket at one time
* `-n|--pattern <value>` - the grep pattern to use to test messages in files
* `-m|--manyMatches` - when included flags that the script should carry on past the first match
* `-j|--jsonPath <value>` - a jq json path within the file to extract
* `-i|--iterations <value>` - the maximum number of times to retrieve object keys from the bucket

## Processing command options

Almost half of the script is concerned with [setting up variables](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/scripts/find-file.sh#L3-L10):

```sh
bucket="testBucket"
prefix=""
objectCount=10
stopAtFirst=1
pattern="test"
breakFirst=1
jsonPath=".Message"
iterations=5
```

And then [processing the command line](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/scripts/find-file.sh#L12-L46) to either override, or set the variables:

```sh
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--bucket)
            bucket=$2
            shift 2
            ;;
        -p|--prefix)
            prefix=$2
            shift 2
            ;;
        -o|--objectCount)
            objectCount=$2
            shift 2
            ;;
        -n|--pattern)
            pattern=$2
            shift 2
            ;;
        -m|--manyMatches)
            breakFirst=0
            shift
            ;;
        -j|--jsonPath)
            jsonPath=$2
            shift 2
            ;;
        -i|--iterations)
            iterations=$2
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done
```

In truth being reasonably new to bash scripting this was probably the toughest part of the script to create 😔. [Josh Sherman has a good description of how the parsing works](https://joshtronic.com/2023/03/12/parsing-arguments-in-shell-script/).

## Iterations

The script provides two modes of operation. The default is to quit out at the first match. However by specifying `-m` or `--manyMatches` the script can be forced to to run through all of the search iterations. However, you should beware, this could turn out to be an expensive (and time consuming) choice. [Lines 49 and 50](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/scripts/find-file.sh#L48-L49) setup a couple of variables that are used to control this behaviour:

```sh
found=0
count=1
```

## Processing

The main processing loop of the script can be expressed in pseudo-code like this:

```
Get a limited list of objects, and save in files.json

while(files.json exists) {
    foreach(key in files.json) {
        Get the object named in the key, save it to temp.json

        Extract the specific json key from the file
        if(the exists in the extrated value) {
            set found to true
            output object key
        }

        if(found is true and not finding many matches) {
            break the foreach key loop
        }
    }

    if(found is true and not finding many matches) {
        break the while loop
    } else {
        increment the loop count
    }

    if(found is true and the loop count exceeds the iterations) {
        break the while loop
    }

    get the token for the next objects
    get the next list of objects using the token and save in files.json
}

remove temp.json
remove files.json
```

The [actual code](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/scripts/find-file.sh#L51-L93) looks like this:

```sh
while [[ -f files.json ]]
do
    while read key
    do
        aws s3api get-object --bucket "$bucket" --key "$key" temp.json > /dev/null

        if grep -q -i "$pattern"; then
            echo "Match: $key - Message: $(cat temp.json | jq "$jsonPath")"
            found=1
        fi < <(cat temp.json | jq "$jsonPath")

        if [ $found -gt 0 ] && [ $breakFirst -gt 0 ]; then
            break
        fi
    done < <(cat files.json | jq -r '.Contents | .[] | .Key')

    if [[ $found -gt 0 ]] && [[ $breakFirst -gt 0 ]]; then
        break
    else
        echo "Iteration $count completed"
        count=$(expr $count + 1)
    fi

    if [[ $found -gt 0 ]] && [[ $count -gt $iterations ]]; then
        break
    fi

    if [[ -f files.json ]]; then
        nextToken=$( cat files.json | jq -r '.NextToken' )

        aws s3api list-objects --bucket "$bucket" --prefix "$prefix" --max-items $objectCount --starting-token $nextToken > files.json
    fi
done

if [[ -f temp.json ]]; then
    rm temp.json
fi

if [[ -f files.json ]]; then
    rm files.json
fi
```

### Getting a list of objects from S3

There are two subtly different calls made to get a list of objects from S3. The first call gets the first `$objectCount` objects using the default sorting (the key name, ascending):

```sh
aws s3api list-objects --bucket "$bucket" --prefix "$prefix" --max-items $objectCount > files.json
```

In the [json that is returned](https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-pagination.html) there is a `NextToken` key-value-pair, and this is triggered by the `--max-items` argument. To carry on and get the next set of objects the value in `NextToken` must be supplied with the call. I do a [Command Substitution](https://www.geeksforgeeks.org/bash-script-command-substitution/) to get the token value from the file:

```sh
nextToken=$( cat files.json | jq -r '.NextToken' )
```

The token can then be used in the next call to the `s3api list-objects` command in the `--starting-token` argument:

```sh
aws s3api list-objects --bucket "$bucket" --prefix "$prefix" --max-items $objectCount --starting-token $nextToken > files.json
```

### Process Substitution

A repeated issue I encountered whilst developing the script (and a reason why the loop is not structured in a more straight forward way) is that variables I set (in particular `found`) would not be set outside the loop. Much searching brought me to [I set variables in a loop that's in a pipeline. Why do they disappear after the loop terminates? Or, why can't I pipe data to read?](https://mywiki.wooledge.org/BashFAQ/024). The basic issue is that I am piping commands together to get the output I want. Originally I had something similar to this: `cat temp.json | jq "$jsonPath" | grep -q -i "$pattern"`. This will work, and you'll get an actionable exit value from `grep`, but when I test that value, and then set a variable based upon it, I am doing it in the subshell running the `grep` command. However the script is running in a parent shell, and the variable is not automatically passed back up.

Of the workarounds offered, I plumped for [Process Substitution](https://mywiki.wooledge.org/ProcessSubstitution) as this resulted in the code that was most understandable to me ([Lines 59-62](https://github.com/steve-codemunkies/find-an-sqs-event/blob/db38a8a6d0dc3192577b4d0b402b054accf2cfcc/scripts/find-file.sh#L59-L62) demonstrate this most clearly):

```sh
if grep -q -i "$pattern"; then
    echo "Match: $key - Message: $(cat temp.json | jq "$jsonPath")"
    found=1
fi < <(cat temp.json | jq "$jsonPath")
```

Here `<(cat temp.json | jq "$jsonPath")` is the process being substituted in, and the output is piped (`fi < <(cat temp.json | jq "$jsonPath")`) to the grep command, which runs in the context of the parent shell.

## Is this the best way of finding a file?

A question I have asked myself whilst writing up this little script is "is this the best way of finding a file in s3?" and the honest answer is: it depends.

Going back to the original situation, I was asked to help colleagues who were looking for examples of a type of file that was written to the bucket with high frequency. I also didn't need a specific file, I just needed an example of a type of file. So rather than looking for a needle in a hay stack, I was more likely looking for [the brown m&ms](https://www.insider.com/van-halen-brown-m-ms-contract-2016-9), except actually even more likely the red, green and blue m&ms.

If I needed to find something very specific in a large set of objects than I would strongly consider [syncing the bucket to a local machine](https://www.middlewareinventory.com/blog/aws-s3-sync-example/#Sync_S3_bucket_to_Local_-_Downloading_Files_from_S3_to_local) and then searching over those files.

This is just one solution to my particular issue, I've provided it here so that I can remember it in future, but hopefully to help someone else.