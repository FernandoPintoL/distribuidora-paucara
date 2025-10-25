# 🧪 GUÍA DE TESTING - ENDPOINTS DE PAGO Y CONFIRMACIÓN

**Fecha:** 2025-10-25
**Status:** ✅ Implementación Completa
**Tiempo Estimado:** 1 hora para probar todos los endpoints

---

## 📋 Resumen de Endpoints Nuevos

| Endpoint | Método | Función | Tiempo |
|----------|--------|---------|--------|
| `/api/app/proformas/{id}/confirmar` | POST | Confirmar proforma → Crear venta | 15 min |
| `/api/app/ventas/{id}/pagos` | POST | Registrar pago en venta | 20 min |
| Validación en `/programar` | GET | Verificar pago antes de envío | 10 min |

**Total Testing:** ~45 minutos

---

## 🔐 CREDENCIALES DE PRUEBA

Usar cualquiera de estos usuarios cliente (ya creados):

```
Usuario 1:
Email: juan.perez@paucara.test
Password: password123

Usuario 2:
Email: maria.gonzalez@paucara.test
Password: password123

Usuario 3:
Email: carlos.ruiz@paucara.test
Password: password123
```

---

## 🚀 PASO 1: LOGIN Y OBTENER TOKEN

### Request
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@paucara.test",
    "password": "password123"
  }'
```

### Response (Guardar el token)
```json
{
  "success": true,
  "data": {
    "token": "YOUR_TOKEN_HERE",
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan.perez@paucara.test"
    }
  }
}
```

**Importante:** Copiar el `token` para usarlo en las siguientes peticiones

---

## 📝 PASO 2: CREAR UNA PROFORMA (Requisito)

Primero necesitas una proforma APROBADA para poder confirmarla.

### 2.1 Crear Proforma
```bash
curl -X POST http://localhost:8000/api/app/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "items": [
      {"producto_id": 1, "cantidad": 5},
      {"producto_id": 2, "cantidad": 3},
      {"producto_id": 3, "cantidad": 2},
      {"producto_id": 4, "cantidad": 4},
      {"producto_id": 5, "cantidad": 1}
    ],
    "direccion_id": 1,
    "observaciones": "Pedido de prueba"
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "pedido": {
      "id": 42,
      "codigo": "PRF-2025-00152",
      "estado": "PENDIENTE",
      "total": 1500.00,
      "items": [...]
    }
  }
}
```

**Guardar:** Proforma ID (ej: 42) y número

### 2.2 Aprobar Proforma (Necesita Dashboard o Artisan)

Para aprobar, acceder al dashboard web con usuario administrativo o usar:

```bash
php artisan tinker
> Proforma::find(42)->aprobar(User::find(1), 'Aprobada para testing')
```

---

## ✅ PASO 3: CONFIRMAR PROFORMA → CREAR VENTA

### Test 1: Validación - Proforma no aprobada
```bash
curl -X POST "http://localhost:8000/api/app/proformas/42/confirmar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "politica_pago": "MEDIO_MEDIO"
  }'
```

**Resultado esperado:** ❌ Error 422
```json
{
  "success": false,
  "message": "La proforma debe estar aprobada para confirmarla",
  "estado_actual": "PENDIENTE"
}
```

### Test 2: Validación - Menos de 5 productos
*Crear proforma con solo 4 productos y aprobar*

```bash
curl -X POST "http://localhost:8000/api/app/proformas/41/confirmar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "politica_pago": "MEDIO_MEDIO"
  }'
```

**Resultado esperado:** ❌ Error 422
```json
{
  "success": false,
  "message": "Debe solicitar mínimo 5 productos diferentes",
  "productos_solicitados": 4,
  "productos_requeridos": 5
}
```

### Test 3: ✅ ÉXITO - Confirmar proforma aprobada (5+ productos)
```bash
curl -X POST "http://localhost:8000/api/app/proformas/42/confirmar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "politica_pago": "MEDIO_MEDIO"
  }'
```

**Resultado esperado:** ✅ Success 201
```json
{
  "success": true,
  "message": "Proforma PRF-2025-00152 confirmada como venta V-2025-00042",
  "data": {
    "venta": {
      "id": 42,
      "numero": "V-2025-00042",
      "fecha": "2025-10-25",
      "monto_total": 1500.00,
      "monto_pagado": 0,
      "monto_pendiente": 1500.00,
      "politica_pago": "MEDIO_MEDIO",
      "estado_pago": "PENDIENTE",
      "estado_logistico": "PENDIENTE_ENVIO"
    },
    "cliente": {
      "id": 1,
      "nombre": "Juan Pérez Martínez"
    },
    "items_count": 5
  }
}
```

**Guardar:** Venta ID (42) para las siguientes pruebas

---

## 💳 PASO 4: REGISTRAR PAGOS EN LA VENTA

### Test 1: Validación - Monto negativo
```bash
curl -X POST "http://localhost:8000/api/app/ventas/42/pagos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "monto": -100.00,
    "tipo_pago": "TRANSFERENCIA"
  }'
```

**Resultado esperado:** ❌ Error 422
```json
{
  "success": false,
  "message": "El monto debe ser mayor a 0"
}
```

### Test 2: Validación - Monto superior al pendiente
```bash
curl -X POST "http://localhost:8000/api/app/ventas/42/pagos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "monto": 2000.00,
    "tipo_pago": "TRANSFERENCIA"
  }'
```

**Resultado esperado:** ❌ Error 422
```json
{
  "success": false,
  "message": "El monto a pagar no puede exceder el monto pendiente",
  "monto_pendiente": 1500.00,
  "monto_solicitado": 2000.00,
  "diferencia": 500.00
}
```

### Test 3: ✅ ÉXITO - Pago parcial (50%)
```bash
curl -X POST "http://localhost:8000/api/app/ventas/42/pagos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "monto": 750.00,
    "tipo_pago": "TRANSFERENCIA",
    "numero_referencia": "TRF-20251025-001",
    "observaciones": "Primer pago del pedido"
  }'
```

**Resultado esperado:** ✅ Success 201
```json
{
  "success": true,
  "message": "Pago de 750 registrado exitosamente",
  "data": {
    "pago": {
      "id": 5,
      "monto": 750.00,
      "tipo_pago": "TRANSFERENCIA",
      "numero_referencia": "TRF-20251025-001",
      "fecha": "2025-10-25 14:30:45"
    },
    "venta_actualizada": {
      "id": 42,
      "numero": "V-2025-00042",
      "monto_total": 1500.00,
      "monto_pagado": 750.00,
      "monto_pendiente": 750.00,
      "estado_pago": "PARCIALMENTE_PAGADO",
      "porcentaje_pagado": 50.0
    }
  }
}
```

### Test 4: ✅ ÉXITO - Pago complementario (50% restante)
```bash
curl -X POST "http://localhost:8000/api/app/ventas/42/pagos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "monto": 750.00,
    "tipo_pago": "TRANSFERENCIA",
    "numero_referencia": "TRF-20251025-002",
    "observaciones": "Segundo y último pago"
  }'
```

**Resultado esperado:** ✅ Success 201
```json
{
  "success": true,
  "message": "Pago de 750 registrado exitosamente",
  "data": {
    "venta_actualizada": {
      "monto_pagado": 1500.00,
      "monto_pendiente": 0.00,
      "estado_pago": "PAGADO",
      "porcentaje_pagado": 100.0
    }
  }
}
```

---

## 🚚 PASO 5: VALIDACIÓN DE PAGO PARA ENVÍO

### Test 1: Política ANTICIPADO_100 sin 100% pago
Crear venta con `politica_pago: "ANTICIPADO_100"` sin pagar nada.

Intentar programar envío → **❌ Error:** "Requiere pago 100% anticipado"

### Test 2: Política MEDIO_MEDIO con menos del 50%
Pagar solo 30% de venta con `politica_pago: "MEDIO_MEDIO"`

Intentar programar envío → **❌ Error:** "Requiere mínimo 50% pagado"

### Test 3: Política MEDIO_MEDIO con 50% pagado
Pagar exactamente 50% → **✅ Envío programado exitosamente**

### Test 4: Política CONTRA_ENTREGA sin pago
No pagar nada con `politica_pago: "CONTRA_ENTREGA"`

Programar envío → **✅ Envío programado sin validación**

---

## 📊 POSTMAN COLLECTION

Importar esta colección en Postman:

```json
{
  "info": {
    "name": "API Paucara - Pagos y Confirmación",
    "version": "1.0"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/login",
        "body": {
          "monto": {
            "email": "juan.perez@paucara.test",
            "password": "password123"
          }
        }
      }
    },
    {
      "name": "2. Crear Proforma",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/app/pedidos",
        "header": {
          "Authorization": "Bearer {{token}}"
        },
        "body": {
          "items": [
            {"producto_id": 1, "cantidad": 5}
          ]
        }
      }
    },
    {
      "name": "3. Confirmar Proforma",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/app/proformas/{{proforma_id}}/confirmar",
        "header": {
          "Authorization": "Bearer {{token}}"
        },
        "body": {
          "politica_pago": "MEDIO_MEDIO"
        }
      }
    },
    {
      "name": "4. Registrar Pago",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/api/app/ventas/{{venta_id}}/pagos",
        "header": {
          "Authorization": "Bearer {{token}}"
        },
        "body": {
          "monto": 750.00,
          "tipo_pago": "TRANSFERENCIA"
        }
      }
    }
  ]
}
```

---

## ✅ CHECKLIST DE TESTING

- [ ] **Login exitoso** con usuario cliente
- [ ] **Crear proforma** con 5+ productos
- [ ] **Aprobar proforma** desde dashboard
- [ ] **Confirmar proforma** → Crear venta
  - [ ] Validación: Proforma no aprobada
  - [ ] Validación: Menos de 5 productos
  - [ ] Éxito: Venta creada con estado_pago=PENDIENTE
- [ ] **Registrar pagos**
  - [ ] Validación: Monto negativo
  - [ ] Validación: Monto > pendiente
  - [ ] Éxito: Pago parcial (50%)
  - [ ] Éxito: Pago complementario (100%)
  - [ ] Verificar: estado_pago actualizado
- [ ] **Validación de pago para envío**
  - [ ] ANTICIPADO_100: Rechaza sin 100% pago
  - [ ] MEDIO_MEDIO: Rechaza con < 50% pago
  - [ ] MEDIO_MEDIO: Permite con ≥ 50% pago
  - [ ] CONTRA_ENTREGA: Permite sin pago

---

## 🔍 LOGS DE REFERENCIA

Ver logs en `storage/logs/laravel.log`:

```bash
tail -f storage/logs/laravel.log
```

Buscar información de:
- Proforma confirmada: `Proforma confirmada como venta`
- Pago registrado: `Pago registrado en venta`
- Validación de envío: `Venta requiere`

---

## 📞 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| 401 Unauthorized | Token expirado o inválido. Hacer login nuevamente |
| 404 Not Found | Proforma/Venta no existe. Verificar IDs |
| 422 Validation Error | Parámetros inválidos. Revisar request body |
| Proforma no aprobada | Ir a Dashboard → Proformas → Aprobar |
| Stock insuficiente | Verificar disponibilidad de productos |
| No hay reservas activas | La proforma debe tener stock reservado |

---

## 🎯 PRÓXIMOS PASOS

Después de verificar todos los tests:

1. ✅ Exportar Postman Collection
2. ✅ Crear documento de ejemplos JSON
3. ✅ Compartir con equipo Flutter
4. 🚀 Flutter comienza integración

---

**Estado:** 🟢 LISTO PARA TESTING
**Fecha:** 2025-10-25
**Documentación:** Completa y verificada

