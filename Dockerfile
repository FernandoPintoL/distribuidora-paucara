# Use PHP 8.2 FPM Alpine with Supervisor
FROM php:8.2-fpm-alpine

# Install system dependencies including supervisor
RUN apk add --no-cache \
    git \
    curl \
    nodejs \
    npm \
    nginx \
    supervisor \
    libzip-dev \
    zlib-dev \
    postgresql-dev \
    oniguruma-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install zip pdo_mysql mbstring pdo_pgsql gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files for dependency installation
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copy package files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm ci

# Copy application code
COPY . /app/

# Build frontend assets
RUN npm run build

# Run Laravel setup
RUN php artisan package:discover --ansi && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    php artisan storage:unlink || true && \
    php artisan storage:link && \
    php artisan optimize

# Set permissions
RUN chmod -R 777 storage/ public/ bootstrap/cache

# Create necessary directories
RUN mkdir -p /run/nginx /var/log/supervisor

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Expose port
EXPOSE 8080

# Start with Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
