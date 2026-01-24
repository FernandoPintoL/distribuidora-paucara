# 📋 Guía de Impresión de Reportes de Créditos

## Descripción

Sistema completo de impresión para reportes de créditos con soporte para tres formatos: A4, 80mm y 58mm.

---

## ✨ Características

✅ **Tres Formatos de Impresión**:
- **A4**: Reporte completo en hoja tamaño carta
- **80mm**: Recibo de crédito para impresoras térmicas anchas
- **58mm**: Recibo de crédito para impresoras térmicas compactas

✅ **Funcionalidades**:
- Descarga de PDF
- Vista previa en navegador
- Impresión directa
- Integración con FormatoSelector

✅ **Información Incluida**:
- Datos del cliente
- Resumen de límite de crédito
- Lista de todas las cuentas por cobrar
- Historial de pagos
- Alertas de vencimiento

---

## 📁 Archivos Creados

### Backend

#### **Controlador**: `app/Http/Controllers/ClienteController.php`
Nuevos métodos:
- `imprimirCredito()` - Genera PDF descargable
- `previewCredito()` - Vista previa HTML
- `aplicarConfiguracionFormato()` - Configuración de DomPDF

#### **Vistas Blade**: `resources/views/impresion/creditos/`

```
creditos/
├── hoja-completa.blade.php    (A4 - Reporte completo)
├── ticket-80.blade.php        (80mm - Recibo ancho)
└── ticket-58.blade.php        (58mm - Recibo compacto)
```

#### **Rutas**: `routes/api.php`

```php
GET  /api/clientes/{id}/credito/imprimir    // Descargar PDF
GET  /api/clientes/{id}/credito/preview     // Vista previa
```

### Frontend

#### **Componente**: `resources/js/presentation/components/impresion/FormatoSelector.tsx`

Actualización:
- Soporte para tipo de documento `'credito'`
- Generación de URLs para endpoints de crédito

#### **Página**: `resources/js/presentation/pages/clientes/credito.tsx`

Cambios:
- Importación de `FormatoSelector`
- Botón de impresión en el header
- Integración con datos de crédito

---

## 🚀 Cómo Usar

### Para Usuario Final

1. **Navegar a Cliente**:
   ```
   Clientes → Seleccionar Cliente → Crédito
   ```

2. **Seleccionar Formato**:
   - Click en botón verde "Imprimir"
   - Elegir formato:
     - 📄 Hoja Completa (A4)
     - 🧾 Ticket 80mm
     - 🧾 Ticket 58mm

3. **Acciones**:
   - **Descargar**: Guarda PDF en tu computadora
   - **Vista Previa**: Abre en nueva ventana
   - **Imprimir**: Abre diálogo de impresión del navegador

### API Endpoints

#### Descargar PDF (Descarga automática)
```bash
GET /api/clientes/{clienteId}/credito/imprimir?formato=A4&accion=download
```

#### Stream PDF (Vista en navegador)
```bash
GET /api/clientes/{clienteId}/credito/imprimir?formato=A4&accion=stream
```

#### Vista Previa HTML
```bash
GET /api/clientes/{clienteId}/credito/preview?formato=A4
```

**Parámetros**:
- `formato`: `'A4'` | `'TICKET_80'` | `'TICKET_58'` (default: A4)
- `accion`: `'download'` | `'stream'` (default: stream)

---

## 📋 Estructura de Datos Enviada a Plantillas

```php
[
    'cliente' => [
        'id' => int,
        'nombre' => string,
        'codigo_cliente' => string,
        'nit' => string,
        'email' => string,
        'telefono' => string,
    ],
    'credito' => [
        'limite_credito' => float,
        'saldo_utilizado' => float,
        'saldo_disponible' => float,
        'porcentaje_utilizacion' => float,
        'estado' => 'normal|critico|excedido|vencido',
    ],
    'cuentas_pendientes' => [
        'total' => int,
        'monto_total' => float,
        'cuentas_vencidas' => int,
        'dias_maximo_vencido' => int,
    ],
    'todas_las_cuentas' => [
        [
            'id' => int,
            'venta_id' => int,
            'numero_venta' => string,
            'fecha_venta' => date,
            'monto_original' => float,
            'saldo_pendiente' => float,
            'fecha_vencimiento' => date,
            'dias_vencido' => int,
            'estado' => string,
            'pagos' => [
                [
                    'id' => int,
                    'monto' => float,
                    'fecha_pago' => datetime,
                    'tipo_pago' => string,
                    'numero_recibo' => string|null,
                    'usuario' => string,
                    'observaciones' => string|null,
                ]
            ],
        ]
    ],
    'fecha_impresion' => datetime,
    'usuario' => string,
    'empresa' => Empresa,
]
```

---

## 🎨 Formato A4 (hoja-completa.blade.php)

### Contenido:
- ✅ Encabezado con información del cliente
- ✅ Resumen de crédito (límite, utilizado, disponible, utilización %)
- ✅ Tabla de TODAS las cuentas por cobrar
- ✅ Tabla de últimos 10 pagos registrados
- ✅ Alertas de vencimiento y exceso de crédito
- ✅ Pie de página con metadata

### Dimensiones:
- **Papel**: A4 (210mm × 297mm)
- **Márgenes**: 10mm en todos los lados
- **Fuente**: Arial 10px
- **Orientación**: Vertical

### Uso:
- Archivos completos
- Envío a clientes
- Reportes administrativos
- Impresión en oficina

---

## 🧾 Formato TICKET 80mm (ticket-80.blade.php)

### Contenido:
- ✅ Título: "REPORTE DE CRÉDITO"
- ✅ Resumen compacto de crédito
- ✅ Estadísticas de cuentas pendientes
- ✅ Últimas 5 cuentas con detalles
- ✅ Indicador visual de estado (vencidas/al día)

### Dimensiones:
- **Papel**: 80mm de ancho × altura dinámica
- **Márgenes**: 2mm
- **Fuente**: Courier New 8px (monoespaciada)
- **Orientación**: Vertical

### Uso:
- Impresoras térmicas Epson/Star 80mm
- Punto de venta
- Tickets de confirmación
- Validaciones de crédito

---

## 🧾 Formato TICKET 58mm (ticket-58.blade.php)

### Contenido:
- ✅ Título compacto: "CRÉDITO"
- ✅ Nombre del cliente y NIT
- ✅ Tabla resumen ultra compacta
- ✅ Contadores de cuentas pendientes
- ✅ Últimas 3 cuentas (info mínima)
- ✅ Indicador de estado

### Dimensiones:
- **Papel**: 58mm de ancho × altura dinámica
- **Márgenes**: 2mm
- **Fuente**: Courier New 6-8px (monoespaciada)
- **Orientación**: Vertical

### Uso:
- Impresoras térmicas compactas 58mm
- Recibos pequeños
- Tickets portátiles
- Validaciones rápidas de crédito

---

## 🔧 Configuración de Impresora

### Windows

1. **Impresora Térmica 80mm**:
   - Tamaño personalizado: 80mm × 200mm
   - Márgenes: 2-5mm
   - Escala: 100%

2. **Impresora Térmica 58mm**:
   - Tamaño personalizado: 58mm × 150mm
   - Márgenes: 2mm
   - Escala: 100%

### Mac

```bash
# Crear tamaño personalizado en System Preferences
# Printer: Epson TM-T20
# Width: 80mm / Height: 200mm
```

### Linux

```bash
# Modificar /etc/cups/ppd/impresora.ppd
# PaperDimension 80mm 200mm
```

---

## 📊 Parámetros de Configuración

En `Empresa` modelo (si se necesita personalizar):

```php
$empresa->configuracion_impresion = [
    'fuente_hoja' => 'Arial',              // Font para A4
    'tamaño_fuente_hoja' => '10px',        // Size A4
    'margen_hoja' => '10mm',               // Margins A4
    'tamaño_fuente_ticket' => '8px',       // Size tickets
    'margen_ticket' => '2mm',              // Margins tickets
    'ancho_ticket_custom' => 80,           // Custom width
];
```

---

## ✅ Ejemplos de Uso

### JavaScript - Descargar PDF A4

```javascript
// URL de descarga
const url = `/api/clientes/27/credito/imprimir?formato=A4&accion=download`;
window.location.href = url;
```

### JavaScript - Vista Previa

```javascript
// Abrir en nueva ventana
const url = `/api/clientes/27/credito/preview?formato=TICKET_80`;
window.open(url, '_blank');
```

### cURL - Descargar PDF

```bash
curl -X GET "http://localhost/api/clientes/27/credito/imprimir?formato=A4" \
  -H "Authorization: Bearer TOKEN" \
  -o credito_cliente.pdf
```

---

## 🐛 Solución de Problemas

### PDF no se descarga

**Solución**:
- Verificar que DomPDF esté instalado: `composer show barryvdh/laravel-dompdf`
- Verificar permisos de carpeta `storage/`
- Revisar logs: `storage/logs/laravel.log`

### Formato incorrecto

**Solución**:
- Verificar que el parámetro `formato` sea válido: `A4`, `TICKET_80`, `TICKET_58`
- Revisar configuración de papel en `aplicarConfiguracionFormato()`

### Datos no se muestran

**Solución**:
- Verificar que el cliente existe y tenga crédito
- Revisar respuesta de `obtenerDetallesCreditoApi()`
- Verificar que las vistas Blade tengan permisos de lectura

### Estilos no se aplican

**Solución**:
- CSS inline está incluido en templates
- DomPDF tiene limitaciones con algunas propiedades CSS
- Usar estilos simples: `color`, `background`, `border`, etc.

---

## 📚 Archivos de Referencia

| Archivo | Línea | Descripción |
|---------|-------|-------------|
| `ClienteController.php` | 1615+ | Métodos de impresión |
| `api.php` | 490+ | Rutas de impresión |
| `FormatoSelector.tsx` | 21 | Tipo de documento |
| `credito.tsx` | 8 | Importación de componente |

---

## 🔐 Seguridad

✅ **Autorización**: Validación con `$this->authorize('view', $cliente)`
✅ **Autenticación**: Requiere usuario autenticado
✅ **Validación de Formato**: Solo acepta formatos registrados
✅ **CORS**: Configurado en `config/cors.php`

---

## 🚢 Despliegue

1. ✅ Templates Blade creados
2. ✅ Controlador actualizado
3. ✅ Rutas agregadas
4. ✅ Componente React actualizado
5. ✅ Página de crédito integrada

**Verificación**:
```bash
# Verificar que las rutas existan
php artisan route:list | grep credito

# Verificar que DomPDF funciona
php artisan tinker
> PDF::loadHtml('<h1>Test</h1>')->stream();
```

---

## 📞 Soporte

Para reportar problemas o sugerencias:
1. Revisar este documento
2. Consultar logs de Laravel
3. Verificar configuración de DomPDF
4. Contactar al equipo de desarrollo

---

**Versión**: 1.0
**Fecha**: 24 de Enero de 2026
**Estado**: ✅ Implementado y Funcional
