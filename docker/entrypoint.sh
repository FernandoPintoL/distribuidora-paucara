#!/bin/bash
set -e

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
