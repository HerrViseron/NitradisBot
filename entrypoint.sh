#!/bin/bash

echo "Ensuring that folder permissions are correct..."
chown -R node:node /var/lib/nitradisbot
chown -R node:node /usr/src/nitradisbot

echo "Continuing with App start!"
exec "$@"