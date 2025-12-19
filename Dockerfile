# Build stage - compile PHP and Node dependencies
FROM php:8.2-fpm-alpine as builder

RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    curl \
    postgresql-client

# Install Composer directly
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --no-progress --optimize-autoloader --no-scripts

COPY . .

# Create minimal .env for build to avoid database connection errors
RUN echo "APP_ENV=production" > .env && \
    echo "APP_DEBUG=false" >> .env && \
    echo "APP_KEY=base64:+EKCy7Tb3hBU1s8hEZaAKjG7MsqRoV+7pV1C0MRxVc0=" >> .env && \
    echo "DB_CONNECTION=sqlite" >> .env && \
    echo "DB_DATABASE=:memory:" >> .env

# Build frontend without database connection
RUN npm install && npm run build

# Production stage
FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-client \
    curl \
    bash

# php:8.2-fpm-alpine ya tiene todas las extensiones compiladas (pdo, mbstring, zip, curl, json, xml, etc.)

WORKDIR /app

COPY --from=builder /app /app

RUN mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache /var/log/nginx \
    && chmod -R 755 storage bootstrap/cache /var/log/nginx \
    && chown -R www-data:www-data /app

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
