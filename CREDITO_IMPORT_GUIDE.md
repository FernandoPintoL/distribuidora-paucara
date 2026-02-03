# Guía de Importación de Créditos Históricos

## 📋 Paso 1: Ejecutar la Migración

```bash
php artisan migrate
```

Esto agregará el campo `es_migracion` a la tabla `cuentas_por_cobrar`.

---

## 📄 Paso 2: Preparar Archivo CSV

**Ubicación esperada:** Coloca el archivo en cualquier lugar, será subido a través del formulario

**Nombre:** `creditos_historicos.csv`

**Formato:**
```csv
cliente_id,monto,fecha_venta,numero_documento,observaciones
5,1500.00,2025-01-15,FAC-001-2024,Deuda migrada del sistema anterior
8,2300.50,2025-02-10,FAC-002-2024,Cliente con crédito pendiente
12,890.25,2025-01-20,FAC-003-2024,Regularización de deuda
```

### Columnas Requeridas:
- **cliente_id** (número) - ID del cliente en el sistema actual
- **monto** (decimal) - Monto del crédito (ej: 1500.00)
- **fecha_venta** (YYYY-MM-DD) - Fecha de la venta original
- **numero_documento** (texto) - Número de factura o referencia
- **observaciones** (opcional) - Notas adicionales

### Validaciones CSV:
✅ Cliente debe existir en BD
✅ Monto debe ser > 0
✅ Fecha no puede ser futura
✅ Número de documento no puede ser duplicado
✅ Máximo 1000 filas

---

## 🔌 Paso 3: Endpoints API

### A. Validar archivo (sin crear registros)

```
POST /api/creditos/importar/validar
Content-Type: multipart/form-data

Body:
- archivo: [archivo.csv]

Response:
{
  "success": true,
  "data": {
    "total_filas": 3,
    "validas": [
      {
        "cliente_id": "5",
        "monto": "1500.00",
        "fecha_venta": "2025-01-15",
        "numero_documento": "FAC-001-2024",
        "fila": 2,
        "estado": "VALIDA"
      }
    ],
    "errores": [
      {
        "fila": 3,
        "datos": {...},
        "errores": ["Cliente con ID 999 no existe"]
      }
    ],
    "advertencias": [
      {
        "fila": 4,
        "datos": {...},
        "advertencias": ["Cliente no tiene ventas registradas anteriormente"]
      }
    ],
    "puede_importar": true
  },
  "archivo_path": "imports/creditos/...",
  "mensaje": "Archivo válido. Puedes proceder con la importación."
}
```

### B. Importar créditos

```
POST /api/creditos/importar
Content-Type: multipart/form-data

Body:
- archivo: [archivo.csv]

Response:
{
  "success": true,
  "data": {
    "exito": true,
    "importados": [
      {
        "fila": 2,
        "cliente_id": 5,
        "monto": 1500.00,
        "cxc_id": 123,
        "estado": "CREADA"
      }
    ],
    "rechazados": [],
    "total_importados": 3,
    "total_rechazados": 0,
    "mensaje": "3 créditos importados exitosamente."
  },
  "mensaje": "3 créditos importados exitosamente."
}
```

---

## 🧪 Paso 4: Probar con cURL

```bash
# Validar
curl -X POST http://localhost:8000/api/creditos/importar/validar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "archivo=@creditos_historicos.csv"

# Importar
curl -X POST http://localhost:8000/api/creditos/importar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "archivo=@creditos_historicos.csv"
```

---

## 🔒 Seguridad

✅ **Solo Admin puede importar**
```php
// En ImportarCreditosHistoricosRequest.php
public function authorize(): bool
{
    return $this->user()->hasRole(['Admin', 'admin']);
}
```

✅ **Auditoría completa** - Se registra en logs:
```
📋 [CREDITO IMPORT] Validando archivo CSV
✅ [CREDITO IMPORT] Validación completada
📥 [CREDITO IMPORT] Iniciando importación
✅ [CREDITO IMPORT] CxC creada [cliente_id: 5, monto: 1500]
🟢 [CREDITO IMPORT] Importación completada [3 importados, 0 rechazados]
```

✅ **Transacción atómica** - Todo o nada (si hay error, se revierten todos los cambios)

---

## 📊 Estructura en BD

Cada crédito importado crea una `CuentaPorCobrar` con:

```php
[
  'cliente_id' => 5,
  'monto_total' => 1500.00,
  'monto_pagado' => 0,
  'estado' => 'PENDIENTE',
  'fecha_vencimiento' => '2025-02-14',  // +30 días de fecha_venta
  'referencia_documento' => 'FAC-001-2024',
  'tipo' => 'CREDITO_HISTORICO',        // ← Marca como histórico
  'observaciones' => 'Migración histórica. Deuda migrada del sistema anterior',
  'usuario_id' => 2,                    // Admin que importó
  'es_migracion' => true,               // ← Marca como migración
]
```

---

## 🔍 Verificar Importación

```php
// En Laravel tinker
php artisan tinker

// Ver créditos importados
CuentaPorCobrar::where('es_migracion', true)->count();

// Ver detalles
CuentaPorCobrar::where('es_migracion', true)->with('cliente')->get();

// Ver por cliente
CuentaPorCobrar::where('cliente_id', 5)->where('es_migracion', true)->get();
```

---

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Cliente con ID X no existe` | ID de cliente incorrecto | Verificar IDs en BD |
| `numero_documento ya existe` | Número duplicado | Revisar si ya fue importado |
| `fecha_venta debe estar en formato YYYY-MM-DD` | Formato incorrecto | Usar 2025-01-15 |
| `monto debe ser mayor a 0` | Monto inválido | Usar números positivos |
| `No tienes permiso` | Usuario no es Admin | Usar usuario Admin |

---

## 📝 Logs

Ver logs de la importación:

```bash
# En tiempo real
tail -f storage/logs/laravel.log | grep "CREDITO IMPORT"

# Filtrar por tipo
grep "🟢 \[CREDITO IMPORT\]" storage/logs/laravel.log
```

---

## ✅ Flujo Completo de Uso

1. **Admin prepara CSV** con datos históricos
2. **Llama a `/api/creditos/importar/validar`** para ver preview
3. **Revisa errores y advertencias** en la respuesta
4. **Corrige el CSV** si hay problemas
5. **Llama a `/api/creditos/importar`** para crear los registros
6. **Verifica resultado** - Ve los créditos creados en el sistema
7. **Revisa logs** para auditoría completa

---

## 🎯 Próximo Paso (Paso 2)

Crear formulario React en:
`resources/js/presentation/pages/admin/creditos/importar.tsx`

Este formulario permitirá:
- Cargar archivo CSV
- Ver validación en tiempo real
- Confirmar importación
- Ver reporte de resultados
