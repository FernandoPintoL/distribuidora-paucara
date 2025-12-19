FROM php:8.2-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    nodejs \
    npm \
    postgresql-client \
    curl \
    bash \
    git

# Copy Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --optimize-autoloader

# Install and build frontend
RUN npm ci && npm run build

# Create necessary directories
RUN mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache /var/log/nginx \
    && chmod -R 755 storage bootstrap/cache /var/log/nginx \
    && chown -R www-data:www-data /app

# Copy configurations
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
