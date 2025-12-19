#!/bin/bash
set -e

echo "Running database migrations..."
php artisan migrate --force

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
