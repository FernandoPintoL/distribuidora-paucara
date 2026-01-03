# Use PHP 8.2 to match Railway's version
FROM php:8.2-fpm-alpine

# Build arguments for Vite environment variables
ARG VITE_APP_NAME=Laravel
ARG VITE_GOOGLE_MAPS_API_KEY=
ARG VITE_WEBSOCKET_URL=http://localhost:3001
ARG VITE_API_URL=/api
ARG VITE_LOGO_SVG=/logos/DistribuidoraPaucara/logo.svg
ARG VITE_LOGO_PNG=/logos/DistribuidoraPaucara/logo.png
ARG VITE_LOGO_ALT=DistribuidoraPaucara

# Export as environment variables for the build
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_LOGO_SVG=${VITE_LOGO_SVG}
ENV VITE_LOGO_PNG=${VITE_LOGO_PNG}
ENV VITE_LOGO_ALT=${VITE_LOGO_ALT}

# Install minimal system dependencies and build requirements for PHP extensions
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
    $PHPIZE_DEPS

# Install and enable PHP extensions required by dependencies
RUN docker-php-ext-install zip pdo_mysql mbstring pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies (now that ext-zip is available)
# Defer Composer scripts (which call artisan) until after app code is copied
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copy package files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm ci

# Copy application code (excluding .env which will be provided by Railway at runtime)
COPY . /app/
RUN rm -f /app/.env

# Create a temporary .env for the build with Vite variables
RUN cat > /app/.env.build << EOF
VITE_APP_NAME=${VITE_APP_NAME}
VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}
VITE_API_URL=${VITE_API_URL}
VITE_LOGO_SVG=${VITE_LOGO_SVG}
VITE_LOGO_PNG=${VITE_LOGO_PNG}
VITE_LOGO_ALT=${VITE_LOGO_ALT}
EOF

# Configure Nginx and Supervisor
RUN mkdir -p /run/nginx /var/log/nginx /etc/nginx/http.d \
    && cp /app/nginx.conf /etc/nginx/http.d/default.conf \
    && cp /app/supervisord.conf /etc/supervisord.conf

# Build assets with environment variables
RUN cd /app && npm run build

# Remove the temporary build .env
RUN rm -f /app/.env.build

# Clear any prebuilt caches (env will be provided at runtime on Railway)
RUN php artisan package:discover --ansi || true && \
    php artisan optimize:clear || true && \
    chmod -R 777 storage/ public/ bootstrap/cache

# Expose HTTP port (Railway defaults to 8080)
EXPOSE 8080

# Start Nginx and PHP-FPM via Supervisor (no automatic migrations)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
