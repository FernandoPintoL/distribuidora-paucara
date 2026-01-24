# 🖨️ Integración: Botón de Impresión para Cada Cuenta

## Descripción

Se ha integrado un botón de impresión compacto en cada fila de la tabla de cuentas por cobrar, permitiendo descargar o previsualizar reportes de crédito para cada cuenta individual.

---

## ✨ Cambios Realizados

### 1. **Nuevo Componente: `ImprimirCuentaButton.tsx`**

**Ubicación**: `resources/js/presentation/components/impresion/ImprimirCuentaButton.tsx`

**Características**:
- Botón compacto con icono de impresora
- Dropdown con opciones de formato y acción
- Soporte para descargar (3 formatos)
- Soporte para vista previa (3 formatos)
- Talla pequeña, ideal para tablas

**Props**:
```tsx
interface ImprimirCuentaButtonProps {
    clienteId: number;              // ID del cliente
    cuentaId: number;               // ID de la cuenta específica
    numeroVenta: string;            // Número de venta (para display)
    size?: 'sm' | 'md' | 'lg';      // Tamaño del botón
    className?: string;             // Clases CSS adicionales
}
```

**Ejemplo de uso**:
```tsx
<ImprimirCuentaButton
    clienteId={27}
    cuentaId={1}
    numeroVenta="VEN20260123-0001"
/>
```

### 2. **Controlador Actualizado**

**Archivo**: `app/Http/Controllers/ClienteController.php`

**Cambios**:
- Agregado parámetro `cuenta_id` a `imprimirCredito()`
- Agregado parámetro `cuenta_id` a `previewCredito()`
- Filtrado automático de cuenta si se especifica `cuenta_id`
- Nueva variable `es_cuenta_individual` para las templates

**Uso**:
```php
// Descargar reporte de cuenta individual
GET /api/clientes/27/credito/imprimir?formato=A4&cuenta_id=1&accion=download

// Vista previa de cuenta individual
GET /api/clientes/27/credito/preview?formato=A4&cuenta_id=1
```

### 3. **Página de Crédito Actualizada**

**Archivo**: `resources/js/presentation/pages/clientes/credito.tsx`

**Cambios**:
- Importación de `ImprimirCuentaButton`
- Nueva columna "Acciones" en la tabla
- Botón de impresión en cada fila
- ColSpan actualizado (de 8 a 9)

**Estructura de tabla**:
```
┌─────┬────────┬────────┬──────────┬────────┬────────┬────────┬──────────┬─────────┐
│ ▶/▼ │ Venta  │ Fecha  │ Original │ Pagado │ Saldo  │ Vence  │  Estado  │Acciones│
├─────┼────────┼────────┼──────────┼────────┼────────┼────────┼──────────┼─────────┤
│  ▶  │#V-001  │01/23   │ 15.00    │ 15.00  │  0.00  │ 01/30  │  Pagado  │ 🖨️    │
│  ▶  │#V-002  │01/23   │ 64.80    │ 15.00  │ 49.80  │ 01/30  │  Al día  │ 🖨️    │
│  ▶  │#V-003  │01/23   │ 55.50    │  0.00  │ 55.50  │ 01/30  │  Al día  │ 🖨️    │
└─────┴────────┴────────┴──────────┴────────┴────────┴────────┴──────────┴─────────┘
```

### 4. **Templates Mejorados**

**Archivo**: `resources/views/impresion/creditos/*.blade.php`

**Cambios**:
- Variable `$es_cuenta_individual` controla el título
- Si es cuenta individual, muestra "COMPROBANTE DE CRÉDITO" en lugar de "REPORTE"
- Las templates filtran automáticamente la cuenta si `cuenta_id` se especifica

---

## 🚀 Cómo Usar

### Para el Usuario Final

1. **Navega a**: Clientes → [Cliente] → Crédito
2. **Busca la tabla** de "Cuentas Por Cobrar"
3. **Última columna**: "Acciones" con un botón de impresora 🖨️
4. **Click en el botón**:
   - Aparece dropdown con opciones
   - **Descargar**: A4, 80mm, 58mm (guarda PDF)
   - **Vista Previa**: A4, 80mm, 58mm (abre en navegador)
5. **¡Listo!** El reporte se descarga o abre

### Para Desarrolladores

#### URL de Descarga (Cuenta Individual)
```
GET /api/clientes/{clienteId}/credito/imprimir?formato=A4&cuenta_id={cuentaId}&accion=download
```

#### URL de Vista Previa (Cuenta Individual)
```
GET /api/clientes/{clienteId}/credito/preview?formato=A4&cuenta_id={cuentaId}
```

#### Parámetros
| Parámetro | Valores | Default | Descripción |
|-----------|---------|---------|-------------|
| `formato` | A4, TICKET_80, TICKET_58 | A4 | Formato del PDF |
| `accion` | download, stream | stream | download = guardar, stream = mostrar |
| `cuenta_id` | número | - | (Opcional) ID de cuenta para filtrar |

---

## 📋 Ejemplos Prácticos

### Descargar A4 de Cuenta Específica
```javascript
// Cliente 27, Cuenta 1, Formato A4
const url = `/api/clientes/27/credito/imprimir?formato=A4&cuenta_id=1&accion=download`;
window.location.href = url;
```

### Vista Previa 80mm
```javascript
// Cliente 27, Cuenta 2, Formato 80mm
const url = `/api/clientes/27/credito/preview?formato=TICKET_80&cuenta_id=2`;
window.open(url, '_blank');
```

### cURL para Descargar
```bash
curl -X GET "http://localhost/api/clientes/27/credito/imprimir?formato=A4&cuenta_id=1" \
  -H "Authorization: Bearer TOKEN" \
  -o cuenta_individual.pdf
```

---

## 🎯 Flujo de Datos

```
Usuario hace click en 🖨️
    ↓
FormatoSelector abre dropdown
    ↓
Usuario selecciona formato + acción
    ↓
URL se genera con clienteId + cuentaId
    ↓
ClienteController::imprimirCredito()
    ├─ Valida parámetros
    ├─ Obtiene datos de crédito del cliente
    ├─ Filtra por cuenta_id si se especifica
    ↓
Template Blade renderiza
    ├─ Si es individual: muestra solo esa cuenta
    ├─ Si es completo: muestra todas las cuentas
    ↓
DomPDF genera PDF
    ↓
Respuesta
    ├─ Download: guarda archivo
    ├─ Stream: muestra en navegador
```

---

## 📊 Estructura de Respuesta

### Cuando se especifica `cuenta_id`

```javascript
{
    cliente: { ... },
    credito: { ... },
    cuentas_pendientes: { ... },
    todas_las_cuentas: [
        {
            id: 1,
            venta_id: 35,
            numero_venta: "VEN20260123-0001",
            fecha_venta: "2026-01-23",
            monto_original: 15.00,
            saldo_pendiente: 0.00,
            pagos: [ ... ]  // Solo pagos de esta cuenta
        }
    ],
    es_cuenta_individual: true  // ← Nueva variable
}
```

---

## 🔧 Configuración

### Tamaño del Botón

Por defecto el botón es pequeño (`sm`), pero se puede cambiar:

```tsx
<ImprimirCuentaButton
    clienteId={27}
    cuentaId={1}
    numeroVenta="VEN20260123-0001"
    size="md"  // sm | md | lg
/>
```

### Clases CSS Personalizadas

```tsx
<ImprimirCuentaButton
    clienteId={27}
    cuentaId={1}
    numeroVenta="VEN20260123-0001"
    className="bg-blue-100 hover:bg-blue-200"
/>
```

---

## ✅ Checklist de Verificación

- ✅ Componente `ImprimirCuentaButton.tsx` creado
- ✅ Exportado en `index.ts`
- ✅ Importado en `credito.tsx`
- ✅ Integrado en tabla (columna "Acciones")
- ✅ Controlador actualizado con `cuenta_id`
- ✅ Templates actualizadas con `es_cuenta_individual`
- ✅ Rutas API funcionales
- ✅ Dropdown con 3 formatos cada uno (descargar + preview)

---

## 🎨 Interfaz Visual

### Botón en Tabla
```
┌──────────────────────────────────────────────────┐
│                    Acciones                      │
├──────────────────────────────────────────────────┤
│ 🖨️ (click aquí)                                 │
└──────────────────────────────────────────────────┘
```

### Dropdown Abierto
```
┌──────────────────────────────┐
│ #VEN20260123-0001            │
├──────────────────────────────┤
│ Descargar                    │
│  📥 A4 (Completo)           │
│  📥 80mm                     │
│  📥 58mm                     │
├──────────────────────────────┤
│ Vista Previa                 │
│  👁️ A4 (Completo)           │
│  👁️ 80mm                     │
│  👁️ 58mm                     │
└──────────────────────────────┘
```

---

## 🐛 Solución de Problemas

### Botón no aparece en tabla

**Causa**: Componente no importado o ColSpan incorrecto

**Solución**:
```tsx
// Verificar en credito.tsx
import { ImprimirCuentaButton } from '@/presentation/components/impresion';

// Verificar colSpan = 9
<td colSpan={9} className="px-6 py-4">
```

### Error 404 al descargar

**Causa**: Ruta no registrada o parámetros incorrectos

**Solución**:
- Verificar que las rutas estén en `routes/api.php`
- Verificar que los parámetros sean válidos: `formato` y `cuenta_id`

### PDF está vacío

**Causa**: Datos no se filtraron correctamente

**Solución**:
- Verificar que `cuenta_id` existe en BD
- Verificar que el cliente tiene cuentas

---

## 📈 Estadísticas

| Métrica | Cantidad |
|---------|----------|
| Componentes creados | 1 |
| Archivos modificados | 4 |
| Parámetros agregados | 2 |
| Líneas de código | ~150+ |
| Endpoints mejorados | 2 |

---

## 🔐 Seguridad

✅ **Autorización**: `$this->authorize('view', $cliente)`
✅ **Validación**: Parámetros validados
✅ **CORS**: Configurado
✅ **Ratas**: Solo usuario autenticado

---

## 🚢 Despliegue

1. ✅ Componente creado
2. ✅ Controlador actualizado
3. ✅ Página integrada
4. ✅ Rutas funcionales
5. ✅ Listo para producción

---

**Versión**: 1.1
**Fecha**: 24 de Enero de 2026
**Estado**: ✅ Implementado y Funcional
