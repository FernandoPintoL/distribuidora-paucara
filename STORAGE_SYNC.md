# 📦 Sistema de Sincronización de Almacenamiento

## Problema Resuelto

**Antes:** Los archivos descargados localmente en `/storage/app/public/` se subían a GitHub, pero en producción (Railway) **no aparecían automáticamente** en el volumen persistente.

**Ahora:** Al hacer deploy, Railway:
1. Descarga el código de GitHub
2. Ejecuta el script `sync-storage.sh` automáticamente
3. Copia todos los archivos desde el código Git al volumen persistente
4. Los archivos están disponibles inmediatamente en producción

## Cómo Funciona

### Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                       │
│  storage/app/public/clientes/                               │
│  storage/app/public/productos/                              │
│  storage/app/public/empresas/                               │
│  ... (todos los directorios con archivos)                  │
└────────────────┬────────────────────────────────────────────┘
                 │ git clone/pull
                 ▼
┌──────────────────────────────────────────────────────────────┐
│              Railway Container - Build Stage                 │
│  /app/storage/app/public/ (código descargado)               │
│  - clientes/                                                 │
│  - productos/                                                │
│  - empresas/                                                 │
│  - entregas/                                                 │
│  - etc...                                                    │
└──────────────────┬───────────────────────────────────────────┘
                   │ supervisord: sync-storage-files
                   │ (ejecuta scripts/sync-storage.sh)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│     Railway Volume Persistente (5GB) - storage               │
│  /app/storage/app/public/ (volumen)                          │
│  - clientes/ ✅ (sincronizado)                              │
│  - productos/ ✅ (sincronizado)                             │
│  - empresas/ ✅ (sincronizado)                              │
│  - entregas/ ✅ (sincronizado)                              │
│  - visitas/ ✅ (sincronizado)                               │
└──────────────────────────────────────────────────────────────┘
```

### Flujo de Ejecución en Railway

1. **Deploy iniciado** → `git clone` del código
2. **Build** → Docker construye la imagen con todos los archivos
3. **Start Container** → supervisord inicia
4. **Programa: sync-storage-files** (priority=4) → Ejecuta `/app/scripts/sync-storage.sh`
   - Copia archivos de `/app/storage/app/public/` al volumen persistente
   - **NO sobrescribe** archivos existentes en el volumen (`cp -n`)
5. **Programa: storage-link** (priority=5) → Crea symlink
6. **Programa: php-fpm** (priority=10) → Inicia PHP
7. **Programa: nginx** (priority=20) → Inicia Nginx

### Script de Sincronización

Ubicación: `scripts/sync-storage.sh`

**Qué hace:**
```bash
# Para cada directorio (clientes, productos, empresas, etc.):
# 1. Verifica que exista en el código
# 2. Copia archivos AL volumen persistente
# 3. NO sobrescribe archivos existentes (-n flag)
# 4. Establece permisos 777
# 5. Cuenta y reporta archivos sincronizados
```

**Directorios sincronizados:**
- `clientes/` - Fotos de clientes
- `empresas/` - Logos de empresas
- `productos/` - Imágenes de productos
- `entregas/` - Fotos de entregas
- `visitas/` - Fotos de visitas
- `proveedores/` - Logos de proveedores
- `fotos_lugar/` - Fotos de ubicaciones

## Flujo Completo: Desarrollo a Producción

### En tu máquina local:

```bash
# 1. Descargas/editas imágenes
📥 Descargas foto_producto.jpg
📁 La pones en: storage/app/public/productos/

# 2. Subes a Git
git add storage/app/public/productos/
git commit -m "Add product image"
git push origin main
```

### En Railway (automático):

```bash
# 3. Railway recibe el push
🔔 Webhook activado → Deploy iniciado

# 4. Build & Deploy
📦 docker build → Incluye todos los archivos en /app
🚀 supervisord inicia
  ├─ sync-storage-files
  │  └─ 📦 Copia: /app/storage/app/public/ → volumen persistente
  ├─ storage-link
  │  └─ 🔗 Crea: public/storage → /app/storage/app/public
  ├─ php-fpm
  └─ nginx

# 5. Los archivos están disponibles
✅ https://produccion.vercel.app/storage/productos/foto_producto.jpg
✅ Accesibles desde cualquier continente (CDN)
```

## Características Clave

### ✅ No sobrescribe archivos existentes
```bash
cp -rn /app/storage/app/public/$dir/* /app/storage/app/public/$dir/
# -n = no-clobber (no sobrescribir)
```

Esto significa:
- Si un archivo ya existe en el volumen, NO se sobrescribe
- Útil si modificas archivos en producción manualmente
- Pero SÍ agrega archivos nuevos

### ✅ Permisos automáticos
Después de sincronizar, establece permisos 777:
```bash
chmod -R 777 /app/storage/app/public
```

### ✅ Logging detallado
El script muestra:
- Directorios sincronizados
- Cantidad de archivos por directorio
- Errores (si los hay)
- Todo va a stdout → visible en Railway logs

## Qué Hacer Ahora

### 1. Hacer commit y push

```bash
git add -A
git commit -m "📦 Agregar sync-storage para sincronizar archivos en Railway"
git push origin main
```

### 2. En Railway:

- El próximo deploy ejecutará `sync-storage-files` automáticamente
- Verás logs como:
  ```
  ========================================
  📦 SYNC-STORAGE: Iniciando sincronización
  ========================================
  ✅ Directorio raíz creado/verificado
  📋 Sincronizando directorio: productos
  ✅ productos sincronizado (24 archivos)
  📋 Sincronizando directorio: clientes
  ✅ clientes sincronizado (8 archivos)
  ...
  ========================================
  ✅ SYNC-STORAGE: Sincronización completada
  ========================================
  ```

### 3. Prueba

1. Descarga una imagen localmente
2. Ponla en `storage/app/public/productos/`
3. Haz commit y push
4. Ve a Railway → verifica los logs
5. Accede a `https://tuapp.vercel.app/storage/productos/imagen.jpg`

## Troubleshooting

### Los archivos no aparecen después del deploy

**Solución:**
1. Verifica que el archivo esté en Git:
   ```bash
   git ls-files storage/app/public/ | grep nombre_archivo
   ```

2. Revisa los logs de Railway:
   ```
   Railway Dashboard → Deployments → View Logs
   ```

3. Busca la sección `SYNC-STORAGE` en los logs

### Permisos insuficientes

El script ya establece `chmod -R 777`, pero si aún hay problemas:
```bash
# En Railway (via SSH):
chmod -R 777 /app/storage/app/public
```

### Volumen lleno

Si el volumen de 5GB se llena:
1. Revisa qué directorios pesan más:
   ```bash
   du -sh /app/storage/app/public/*/
   ```

2. Considera mover archivos antiguos a S3/CDN

## Archivos Modificados

```
✅ Dockerfile
   - Agrega copia de scripts/sync-storage.sh
   - Establece permisos +x

✅ supervisord.conf
   - Nuevo programa: sync-storage-files
   - Ejecuta: /app/scripts/sync-storage.sh
   - Priority: 4 (ejecuta antes de storage-link)

✅ scripts/sync-storage.sh (NUEVO)
   - Script de sincronización
   - Copia archivos sin sobrescribir
   - Establece permisos
   - Logging detallado
```

## Referencias

- **Railway Volumes:** https://docs.railway.app/guides/volumes
- **Dockerfile COPY:** https://docs.docker.com/engine/reference/builder/#copy
- **Supervisord:** http://supervisord.org/configuration.html
