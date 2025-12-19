# Build stage - compile PHP and Node dependencies
FROM php:8.4-cli-alpine as builder

RUN apk add --no-cache \
    build-base \
    autoconf \
    nodejs \
    npm \
    libxml2-dev \
    postgresql-dev \
    oniguruma-dev \
    zlib-dev \
    git \
    curl

# Install Composer directly
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN docker-php-ext-install \
    pdo_pgsql \
    mbstring \
    zip

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --no-progress --optimize-autoloader

COPY . .

# Build frontend using dummy SQLite to avoid DB connection during build
RUN DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    npm install && \
    npm run build

# Production stage
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-client \
    curl \
    bash \
    libpq \
    libzip \
    oniguruma \
    libxml2

COPY --from=builder /usr/local/lib/php/extensions/no-debug-non-zts-20240924/ /usr/local/lib/php/extensions/no-debug-non-zts-20240924/
RUN docker-php-ext-enable pdo_pgsql mbstring zip

WORKDIR /app

COPY --from=builder /app /app

RUN mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache \
    && chmod -R 755 storage bootstrap/cache \
    && chown -R www-data:www-data /app

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
