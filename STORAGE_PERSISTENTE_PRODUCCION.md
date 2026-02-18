# 📦 Almacenamiento Persistente en Producción

## Problema
En desarrollo local, `storage/app/public/` contiene imágenes de clientes, productos, etc.
En producción (Railway.app, Docker, etc.), estos directorios se **pierden** porque:
- Docker crea una imagen nueva en cada deploy
- El almacenamiento de la imagen es **temporal**
- Los archivos subidos después del deploy se pierden en el siguiente redeploy

## Solución: 3 Opciones

### ✅ OPCIÓN 1: Volúmenes Persistentes (RECOMENDADO para Railway.app)

#### 1️⃣ Configurar en Railway.app

En tu proyecto Railway, agrega volúmenes persistentes:

```yaml
# En Railway Dashboard:
# Services → Tu App → Settings → Volumes

# Volumen 1: Storage
Source: storage
Mount Path: /app/storage

# Volumen 2: Público
Source: public-storage
Mount Path: /app/public/storage
```

O si usas `railway.toml`:

```toml
[environments.production.services.app.volumes]
storage = "/app/storage"
public_storage = "/app/public/storage"
```

#### 2️⃣ Verificar después del deploy

```bash
# SSH a tu contenedor:
railway shell

# Verificar que los volúmenes están montados:
df -h | grep /app

# Debería mostrar:
# /dev/... /app/storage ext4 ...
# /dev/... /app/public/storage ext4 ...
```

---

### ✅ OPCIÓN 2: Amazon S3 o Servicios de Almacenamiento

Cambiar `config/filesystems.php` para usar S3:

```php
'disks' => [
    'public' => [
        'driver' => 's3',  // Cambiar de 'local' a 's3'
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
        'url' => env('AWS_URL'),
    ],
]
```

Luego en `.env`:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=mi-bucket
AWS_URL=https://mi-bucket.s3.amazonaws.com
```

**Ventajas:**
- ✅ Escalable sin límite
- ✅ CDN integrado
- ❌ Costo mensual

---

### ✅ OPCIÓN 3: Mantener en Git + .gitignore (ACTUAL)

**Cómo funciona ahora:**

1. **En desarrollo local:**
   - Guardas imágenes en `storage/app/public/clientes/`, `productos/`, etc.
   - Git las sube gracias a las excepciones en `.gitignore`

2. **En producción:**
   - El Dockerfile copia todo (incluyendo imágenes)
   - En Railway.app, esto se **borra en cada deploy** ❌

3. **Solución:**
   - Configurar volúmenes persistentes (Opción 1)
   - O usar Git + mantener sincronizado manualmente

---

## 📋 Configuración Actual (MEJORADA)

### ✅ `.gitignore` - Directorios permitidos

```bash
# Ignora storage/ globalmente
/storage/*.key
/storage/pail
/storage/logs
/storage/framework

# PERO permite estos directorios específicos:
!/storage/app/public/
!/storage/app/public/productos/
!/storage/app/public/productos/**
!/storage/app/public/clientes/
!/storage/app/public/clientes/**
!/storage/app/public/clientes/fotos_lugar/**
!/storage/app/public/empresas/
!/storage/app/public/empresas/**
!/storage/app/public/proveedores/        # ← NUEVO
!/storage/app/public/proveedores/**
!/storage/app/public/fotos_lugar/        # ← NUEVO
!/storage/app/public/fotos_lugar/**
!/storage/app/backups/                   # ← NUEVO
!/storage/app/backups/**
```

### ✅ `Dockerfile` - Crea directorios

```dockerfile
RUN mkdir -p storage/app/public/clientes
RUN mkdir -p storage/app/public/clientes/fotos_lugar
RUN mkdir -p storage/app/public/productos
RUN mkdir -p storage/app/public/empresas
RUN mkdir -p storage/app/public/proveedores  # ← NUEVO
RUN mkdir -p storage/app/public/fotos_lugar  # ← NUEVO
RUN mkdir -p storage/app/backups/images      # ← NUEVO
RUN chmod -R 777 storage/
```

---

## 🚀 Para Railway.app Específicamente

### Paso 1: Agregar Volúmenes en Dashboard

1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona tu proyecto
3. Click en "Services" → Tu app
4. Click en "Settings"
5. Baja hasta "Volumes"
6. Click en "Add Volume"
7. Configura:
   - **Mount Path**: `/app/storage`
   - Deja "Source Path" vacío (se generará automáticamente)
8. Repite para más volúmenes si necesitas `/app/public/storage`

### Paso 2: Deploy

```bash
git add .
git commit -m "feat: agregar volúmenes persistentes en producción"
git push origin main
```

Railway detectará cambios automáticamente y hará redeploy.

### Paso 3: Verificar

```bash
# SSH a tu app en Railway:
railway shell

# Dentro del contenedor:
df -h

# Debería mostrar el volumen montado:
# /dev/... /app/storage ext4

# Verificar directorios:
ls -la /app/storage/app/public/
# Output: clientes  productos  empresas  proveedores  etc.
```

---

## 🔄 Flujo Completo

### En Desarrollo (Local)
```
1. Subes imagen en UI
2. Se guarda en storage/app/public/productos/
3. Haces git push
4. Git sube la imagen (por .gitignore exceptions)
5. GitHub almacena la imagen
```

### En Producción (Railway.app con Volúmenes)
```
1. Docker build copia repo (incluyendo imágenes)
2. Contenedor inicia con volumen montado
3. /app/storage apunta a volumen persistente
4. Nuevas imágenes se guardan en volumen
5. Volumen persiste entre redeploys ✅
6. Próximo deploy = imágenes siguen ahí ✅
```

---

## 📁 Estructura Recomendada

```
storage/
├── app/
│   ├── private/              # NO sincronizar
│   ├── public/
│   │   ├── clientes/         # ✅ Sincronizar en Git
│   │   ├── clientes/fotos_lugar/  # ✅ Nuevo
│   │   ├── productos/        # ✅ Sincronizar en Git
│   │   ├── empresas/         # ✅ Sincronizar en Git
│   │   ├── proveedores/      # ✅ NUEVO - Sincronizar
│   │   └── fotos_lugar/      # ✅ NUEVO - Sincronizar
│   ├── backups/              # ✅ NUEVO - Sincronizar
│   │   └── images/
│   ├── logs/                 # ❌ Ignorar (logs dinámicos)
│   └── framework/            # ❌ Ignorar
└── ...
```

---

## ⚠️ Problemas Comunes

### "Las imágenes desaparecen después de deploy"
**Causa:** No hay volumen persistente configurado
**Solución:** Agregar volumen en Railway Settings

### "Cannot write to storage/app/public"
**Causa:** Permisos insuficientes (chmod)
**Solución:** Dockerfile ya tiene `chmod -R 777 storage/` ✅

### "GIT error: LFS file not found"
**Causa:** Archivos grandes en Git
**Solución:** Usar Git LFS o S3 para archivos > 100MB

### "Espacio en volumen lleno"
**Causa:** Demasiadas imágenes acumuladas
**Solución:**
- Implementar limpieza automática
- Comprimir imágenes en upload
- Usar S3 en su lugar

---

## ✅ Checklist para Producción

- [ ] `.gitignore` configurado con excepciones para storage
- [ ] `Dockerfile` crea directorios (`mkdir -p storage/...`)
- [ ] Permisos configurados en `Dockerfile` (`chmod -R 777`)
- [ ] Volúmenes configurados en Railway (si usas Railway)
- [ ] Probado en staging antes de producción
- [ ] Backup de imágenes en Git (como respaldo)
- [ ] Monitoring de espacio en disco configurado

---

## 🎯 Resumen

| Aspecto | Valor |
|--------|-------|
| **Archivos Git** | ✅ `.gitignore` + `Dockerfile` |
| **Producción** | ✅ Volúmenes persistentes (Railway) |
| **Respaldo** | ✅ Imágenes en Git + Volumen persistente |
| **Escalabilidad** | ⚠️ Limitado a tamaño del volumen |
| **Alternativa** | S3 / Azure Blob Storage |

---

**Fecha**: 2026-02-18
**Última actualización**: 2026-02-18
**Estado**: ✅ Configuración completada
