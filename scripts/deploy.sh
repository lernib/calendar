#!/bin/bash

set -e

GIT_ROOT=$(git rev-parse --show-toplevel)
export AWS_PAGER=""

# Validate
aws cloudformation validate-template \
    --template-body "file://$GIT_ROOT/aws/stacks/dynamodb.yml" >/dev/null

STACK_ID=$(aws cloudformation create-stack \
    --stack-name LernibCalendarDB \
    --template-body "file://$GIT_ROOT/aws/stacks/dynamodb.yml")

echo $STACK_ID > LernibCalendarDB.txt

aws s3 cp LernibCalendarDB.txt s3://lernib-bucket.build/stacks/LernibCalendarDB.txt

rm LernibCalendarDB.txt
