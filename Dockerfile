# Build stage - compile PHP and Node dependencies
FROM php:8.4-cli-bookworm as builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    autoconf \
    pkg-config \
    nodejs \
    npm \
    libxml2-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libpq-dev \
    libonig-dev \
    zlib1g-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Composer directly
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    xml \
    dom \
    session \
    fileinfo \
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
FROM php:8.4-fpm

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    postgresql-client \
    curl \
    bash && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/php/extensions/no-debug-non-zts-20240924/ /usr/local/lib/php/extensions/no-debug-non-zts-20240924/
RUN docker-php-ext-enable pdo pdo_pgsql mbstring xml dom session fileinfo zip

WORKDIR /app

COPY --from=builder /app /app
COPY --from=builder /app/vendor /app/vendor
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/public/build /app/public/build

RUN mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

RUN chown -R www-data:www-data /app

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
