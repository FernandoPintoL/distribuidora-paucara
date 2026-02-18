# 🔍 Diagnóstico de Backups en Producción

## Problema
Los backups funcionan en local pero **NO funcionan en producción** en `/admin/image-backup`.

## Solución Rápida: Endpoint de Diagnóstico

Accede a este endpoint para ver exactamente qué está fallando:

```
GET https://tudominio.com/api/image-backup/diagnostico/disk-space
```

### Pasos:
1. **Abre tu navegador** en producción
2. **Copia esta URL** (reemplaza `tudominio.com`):
   ```
   https://tudominio.com/api/image-backup/diagnostico/disk-space
   ```
3. **Presiona Enter** para ver un JSON detallado
4. **Copia el JSON completo** (presiona Ctrl+A, Ctrl+C)
5. **Comparte el resultado** conmigo

## Qué Buscar en la Respuesta

### ✅ Respuesta Exitosa:
```json
{
  "success": true,
  "message": "✅ Todo parece estar OK",
  "data": {
    "errors": [],
    "write_test": {
      "success": true,
      "message": "Se puede crear archivos en backup dir"
    }
  }
}
```

### ⛔ Problemas Comunes y Soluciones:

#### **1. "⛔ No se puede escribir en: storage/app/backups/images"**
```
CAUSA: Permisos de carpeta insuficientes
SOLUCIÓN: Ejecuta en el servidor (SSH):

  mkdir -p /ruta/a/storage/app/backups/images
  chmod -R 755 /ruta/a/storage/app/backups
  chown -R www-data:www-data /ruta/a/storage/app
```

#### **2. "⛔ ZipArchive no disponible"**
```
CAUSA: Extensión ZIP de PHP no está compilada
SOLUCIÓN:

  Ubuntu/Debian:
    apt-get install php8.2-zip
    systemctl restart php8.2-fpm

  CentOS/RedHat:
    yum install php82-pecl-zip
    systemctl restart php-fpm
```

#### **3. "⛔ Espacio insuficiente en disco"**
```
CAUSA: Disco lleno o sin espacio para backups
SOLUCIÓN:
  1. Liberar espacio en el servidor
  2. O configurar un límite de backups automáticos
```

#### **4. "⛔ Directorio no existe"**
```
CAUSA: storage/app/backups/images no se pudo crear automáticamente
SOLUCIÓN: Crear manualmente:

  mkdir -p /var/www/tuapp/storage/app/backups/images
  chmod 755 /var/www/tuapp/storage/app/backups/images
```

## Detalles en la Respuesta JSON

```json
{
  "php_info": {
    "version": "8.2.0",           // Versión PHP
    "memory_limit": "256M",        // Límite de memoria
    "max_execution_time": "300",   // Máximo tiempo ejecución (segundos)
    "upload_max_filesize": "2G",   // Máximo tamaño de archivo
    "post_max_size": "2G"          // Máximo POST
  },

  "ziparchive": {
    "available": true,             // ¿ZipArchive disponible?
    "version": "1.20.0"            // Versión de ZipArchive
  },

  "storage_paths": {
    "storage_path": "/var/www/app/storage",
    "backup_dir": "/var/www/app/storage/app/backups/images"
  },

  "directory_checks": {
    "storage": {
      "exists": true,              // ¿Existe la carpeta?
      "readable": true,            // ¿Se puede leer?
      "writable": true             // ¿Se puede escribir?
    }
  },

  "disk_space": {
    "free_space": 5368709120,
    "free_space_formatted": "5.0 GB",    // Espacio libre disponible
    "total_space": 107374182400,
    "total_space_formatted": "100 GB",   // Espacio total
    "used_percent": 95.0                 // % usado del disco
  },

  "errors": [
    "⛔ No se puede escribir en: storage/app/backups/images"
  ]
}
```

## Próximos Pasos

1. **Ejecuta el diagnóstico** en producción
2. **Identifica el error** en la lista anterior
3. **Aplica la solución** correspondiente
4. **Vuelve a ejecutar** el diagnóstico
5. **Intenta crear un backup** desde `/admin/image-backup`

## Si Sigue Sin Funcionar

Comparte conmigo:
1. La respuesta completa del endpoint de diagnóstico
2. Los logs de Laravel: `storage/logs/laravel.log` (últimas 50 líneas)
3. El navegador que usas y la URL exacta
4. Si es Railway.app o otro hosting

## Comandos Útiles para Debugging

```bash
# Ver permisos de storage
ls -la /var/www/app/storage/app/

# Crear manualmente la carpeta
mkdir -p /var/www/app/storage/app/backups/images
chmod 755 /var/www/app/storage/app/backups/images

# Verificar ZipArchive disponible
php -m | grep zip

# Ver espacio en disco
df -h

# Seguir logs en tiempo real
tail -f storage/logs/laravel.log
```

## Railway.app Específicamente

Si usas Railway.app:
- El directorio `/storage` es **temporal** (se borra en cada deploy)
- **Solución**: Usar variables de entorno o montar volumen persistente

Agrégale a tu `docker-compose.yml` o configuración de Railway:
```yaml
volumes:
  - storage:/app/storage
```

---

**Creado**: 2026-02-18
**Última actualización**: 2026-02-18
