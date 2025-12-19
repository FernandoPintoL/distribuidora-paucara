FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    nodejs \
    npm \
    postgresql-client \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    curl \
    bash \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions - all that Laravel might need
RUN docker-php-ext-install \
    pdo_pgsql \
    pdo \
    mbstring \
    zip \
    gd \
    bcmath \
    && docker-php-ext-configure gd --with-freetype --with-jpeg

# Copy Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --optimize-autoloader

# Create temporary .env for build (to avoid DB connection errors)
RUN echo "APP_ENV=production" > .env && \
    echo "APP_DEBUG=false" >> .env && \
    echo "APP_KEY=base64:+EKCy7Tb3hBU1s8hEZaAKjG7MsqRoV+7pV1C0MRxVc0=" >> .env && \
    echo "DB_CONNECTION=sqlite" >> .env && \
    echo "DB_DATABASE=:memory:" >> .env && \
    mkdir -p database && \
    touch database/database.sqlite

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
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
