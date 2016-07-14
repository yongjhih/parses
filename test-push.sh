#!/usr/bin/env bash

echo $1 $2 $3
curl -X POST \
  -H "X-Parse-Application-Id: $1" \
  -H "X-Parse-Master-Key: $2" \
  -H "Content-Type: application/json" \
  -d '{
        "channels": ["ch_2DI4ophzzP"],
        "data": {
            "title": "The Shining",
            "alert": "Test"
        }
      }' \
  "$3/push"

