# Build stage - compile PHP and Node dependencies
FROM php:8.4-cli-alpine as builder

RUN apk add --no-cache \
    composer \
    nodejs \
    npm \
    libxml2-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    postgresql-dev \
    oniguruma-dev

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    xml \
    dom \
    session \
    fileinfo \
    tokenizer \
    curl \
    zip \
    gd

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
    postgresql-dev \
    curl \
    bash \
    libxml2-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    xml \
    dom \
    session \
    fileinfo \
    tokenizer \
    curl \
    zip \
    gd

# Remove dev dependencies to reduce image size
RUN apk del --no-cache postgresql-dev libxml2-dev libpng-dev libjpeg-turbo-dev freetype-dev oniguruma-dev

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
