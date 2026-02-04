#!/bin/bash
set -e

echo "Starting PHP-FPM..."
php-fpm -y /assets/php-fpm.conf &
PHP_FPM_PID=$!
echo "PHP-FPM started with PID $PHP_FPM_PID"

# Wait a bit for PHP-FPM to start
sleep 2

echo "Starting Nginx..."
nginx -c /app/nginx.conf

# If we get here, nginx exited, so exit the container
exit $?
