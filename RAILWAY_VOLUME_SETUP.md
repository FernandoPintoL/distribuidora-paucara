# Configuración de Volumen Persistente en Railway

## Problema
Los archivos de imágenes de empresas se guardan en `/storage/app/public/empresas/`, pero en Railway los contenedores son efímeros. Cuando se redeploy o reinicia el contenedor, todos los archivos se pierden.

## Solución
Configurar un volumen persistente en Railway para el directorio de almacenamiento.

## Pasos para configurar en Railway

### 1. Acceder a la configuración del servicio
1. Ve a tu proyecto en Railway: https://railway.app
2. Selecciona el servicio (distribuidora-paucara-web)
3. Haz clic en la pestaña **"Volumes"**

### 2. Crear el volumen
Haz clic en **"+ Add Volume"** y configura:

```
Mount Path: /app/storage/app/public
Volume Size: 5GB (o el tamaño que necesites)
```

### 3. Redeploy
Una vez creado el volumen, Railway automáticamente hará un redeploy del servicio.

## Archivos afectados por el volumen

El volumen en `/app/storage/app/public` incluirá:
- `/storage/app/public/empresas/` - Imágenes de empresas ✅
- `/storage/app/public/productos/` - Imágenes de productos ✅
- `/storage/app/public/` - Otros archivos públicos ✅

## Verificación

Después de configurar el volumen, puedes verificar:

1. **En la consola de Railway:**
   ```bash
   ls -la /app/storage/app/public/empresas/
   ```

2. **Usando el script de diagnóstico:**
   ```bash
   php artisan tinker < storage_check.php
   ```

## Notas importantes

- El volumen persiste entre reinicios y redeploys
- Los límites de tamaño dependen de tu plan de Railway
- Puedes aumentar el tamaño en cualquier momento desde la UI
- Los archivos en el volumen se facturan según el almacenamiento usado

## Alternativa: Almacenamiento en la nube

Si prefieres una solución más robusta, considera usar:
- **AWS S3** - Para producción
- **Google Cloud Storage** - Alternativa a S3
- **Azure Blob Storage** - Si usas ecosistema Azure

Esto requeriría cambios en el controlador para guardar en la nube en lugar del sistema de archivos local.
