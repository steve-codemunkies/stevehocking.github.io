#!/bin/sh
npm list -g aws-cdk | grep -i '(empty)'
if [ $? -eq 0 ]
then
    npm install -g aws-cdk
else
    echo 'Not installing'
fi

exit 0