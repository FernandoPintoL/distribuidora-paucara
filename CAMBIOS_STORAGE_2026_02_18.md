# 📦 Cambios en Configuración de Storage - 2026-02-18

## ✅ Cambios Realizados

### 1️⃣ `.gitignore` - Agregados Nuevos Directorios

**Antes:**
```
# Solo permitía:
!/storage/app/public/productos/
!/storage/app/public/empresas/
!/storage/app/public/clientes/
```

**Después:**
```
# Ahora permite:
!/storage/app/public/productos/**
!/storage/app/public/empresas/**
!/storage/app/public/clientes/**
!/storage/app/public/clientes/fotos_lugar/**
!/storage/app/public/proveedores/**          ← NUEVO
!/storage/app/public/fotos_lugar/**          ← NUEVO
!/storage/app/backups/**                     ← NUEVO
```

**Impacto:**
- ✅ Las carpetas de `proveedores` ahora se pueden subir a Git
- ✅ Las carpetas de `fotos_lugar` ahora se pueden subir a Git
- ✅ Los backups ahora se pueden subir a Git
- ✅ Desde `clientes/fotos_lugar/` también se permite

---

### 2️⃣ `Dockerfile` - Agregados Directorios Faltantes

**Antes:**
```dockerfile
mkdir -p storage/app/public/clientes
mkdir -p storage/app/public/productos
mkdir -p storage/app/public/empresas
# Faltaban: proveedores, fotos_lugar, backups
```

**Después:**
```dockerfile
mkdir -p storage/app/public/clientes
mkdir -p storage/app/public/clientes/fotos_lugar    ← NUEVO
mkdir -p storage/app/public/productos
mkdir -p storage/app/public/empresas
mkdir -p storage/app/public/proveedores             ← NUEVO
mkdir -p storage/app/public/fotos_lugar             ← NUEVO
mkdir -p storage/app/backups/images                 ← NUEVO
```

**Impacto:**
- ✅ Docker ahora crea automáticamente ALL los directorios necesarios
- ✅ Evita errores de "directorio no existe"
- ✅ Permisos 777 aplicados a todos

---

### 3️⃣ `ImageBackupController.php` - Agregado Método Diagnóstico

**Nuevo método:**
```php
public function diagnoseDiskSpace(): JsonResponse
```

**Ubicación de ruta:**
```
GET /api/image-backup/diagnostico/disk-space
```

**Qué verifica:**
- ✅ Versión de PHP y extensiones
- ✅ ZipArchive disponible
- ✅ Permisos de directorios (read/write)
- ✅ Espacio en disco disponible
- ✅ Test de escritura en directorio de backup

---

### 4️⃣ `routes/api.php` - Agregada Ruta de Diagnóstico

```php
Route::get('/diagnostico/disk-space',
    [ImageBackupController::class, 'diagnoseDiskSpace']);
```

---

## 📊 Resumen de Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `.gitignore` | Agregados 7 directorios nuevos | +7 |
| `Dockerfile` | Agregadas 3 carpetas + subdirectorios | +4 |
| `ImageBackupController.php` | Agregado método `diagnoseDiskSpace()` | +112 |
| `routes/api.php` | Agregada ruta de diagnóstico | +1 |

**Total de cambios:** 124 líneas de código

---

## 🚀 Cómo Usar

### Para Verificar que Funciona

```bash
# 1. Hacer commit de los cambios
git add .gitignore Dockerfile
git commit -m "feat: agregar directorios persistentes en storage"

# 2. Push a GitHub
git push origin main

# 3. Railway detecta cambio automáticamente
# (O hacer manual redeploy en Railway Dashboard)

# 4. Una vez deployado, verificar:
curl https://tudominio.com/api/image-backup/diagnostico/disk-space
```

---

## ⚠️ IMPORTANTE: Configuración de Volúmenes en Railway

**Solo agregar directorios al `.gitignore` y `Dockerfile` NO es suficiente.**

Debes **configurar volúmenes persistentes en Railway** para que las imágenes no desaparezcan en cada deploy:

### Pasos en Railway Dashboard:

1. Abre tu proyecto en [railway.app](https://railway.app)
2. Click en "Services" → Tu app
3. Click en "Settings"
4. Scroll hasta "Volumes"
5. Click "Add Volume"
6. Configura:
   - **Mount Path**: `/app/storage`
   - Click "Create"
7. Redeploy

**Después de esto, las imágenes persistirán entre deploys ✅**

---

## 📋 Estructura Final de Directorios

```
storage/app/public/
├── clientes/                    # ✅ Imágenes de clientes
│   ├── {cliente_id}/
│   │   ├── ci/
│   │   ├── foto_perfil/
│   │   └── fotos_lugar/         # ✅ NUEVO - Fotos de ubicación
├── productos/                   # ✅ Imágenes de productos
├── empresas/                    # ✅ Logos de empresas
├── proveedores/                 # ✅ NUEVO - Imágenes de proveedores
└── fotos_lugar/                 # ✅ NUEVO - Fotos de lugares

storage/app/backups/            # ✅ NUEVO - Para backups
└── images/                      # ✅ Para ZIP de backups
```

---

## 🔍 Verificación

### En Local
```bash
# Ver que .gitignore permite estos directorios:
git check-ignore -v storage/app/public/proveedores/test.txt
# Output: ! storage/app/public/proveedores/** (negación, permitido)

# Ver que los directorios existen:
ls -la storage/app/public/
# Debería mostrar: clientes  empresas  fotos_lugar  productos  proveedores
```

### En Producción (después de deploy)
```bash
# SSH a tu app en Railway:
railway shell

# Dentro del contenedor:
ls -la storage/app/public/

# Debería mostrar los mismos directorios que en local ✅
```

---

## 📝 Próximos Pasos

1. ✅ Cambios realizados y listos para commit
2. ⏳ Ejecutar `git push origin main`
3. ⏳ Railway hace redeploy automático
4. ⏳ **IMPORTANTE**: Configurar volúmenes en Railway Settings
5. ⏳ Verificar con el endpoint de diagnóstico
6. ⏳ Probar subiendo una imagen de proveedor

---

## 🆘 Si Algo Falla

**Ejecuta el diagnóstico:**
```
GET https://tudominio.com/api/image-backup/diagnostico/disk-space
```

**Verifica:**
1. ¿ZipArchive disponible? (`ziparchive.available: true`)
2. ¿Directorios con permisos escritura? (`writable: true`)
3. ¿Espacio en disco? (`free_space_formatted: > 1GB`)
4. ¿Errores?

**Si hay errores**, consulta `DIAGNOSTICO_BACKUPS_PRODUCCION.md` para la solución correspondiente.

---

**Realizado:** 2026-02-18 10:30 UTC
**Estado:** ✅ Listo para deploy
**Próximo paso:** git push origin main
