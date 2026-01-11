# Configuración de Impresora Térmica ESC/POS en Red

## Descripción General

Este documento explica cómo configurar la impresión automática de tickets en una impresora térmica compartida en red después de crear una venta.

## Requisitos Previos

- ✅ Impresora térmica ESC/POS (Epson, Star, Zebra, etc.)
- ✅ Impresora conectada a la red local (WiFi o Ethernet)
- ✅ IP estática asignada a la impresora (importante para confiabilidad)
- ✅ Puerto 9100 habilitado en la impresora (default para ESC/POS)
- ✅ Acceso a la máquina donde corre Laravel

## Paso 1: Obtener la IP de la Impresora

### Opción A: Desde el Panel de Control de la Impresora
1. En la impresora térmica, busca el menú de **Configuración** o **Setup**
2. Navega a **Información de Red** o **Network Settings**
3. Anota la **Dirección IP** (ej: 192.168.1.100)
4. Anota el **Puertos** disponibles (usualmente 9100)

### Opción B: Desde la Red
```bash
# En Windows (PowerShell)
arp -a | findstr "impresora"

# En Linux/Mac
arp -a | grep impresora
```

### Opción C: Desde el Router
1. Accede al panel del router (usualmente 192.168.1.1)
2. Busca **Dispositivos Conectados** o **DHCP Clients**
3. Identifica la impresora por nombre o marca

## Paso 2: Verificar Conectividad

Antes de configurar, verifica que tu máquina pueda alcanzar la impresora:

```bash
# Ping a la impresora
ping 192.168.1.100

# O en Windows
ping -n 4 192.168.1.100

# Debe responder: "Reply from 192.168.1.100: bytes=32 time=<X>ms"
```

## Paso 3: Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# CONFIGURACIÓN DE IMPRESORA TÉRMICA ESC/POS
# IP/Host de la impresora térmica en red
PRINTER_HOST=192.168.1.100

# Puerto de conexión (default: 9100 para ESC/POS)
PRINTER_PORT=9100

# Ancho del papel: 58 o 80 mm
PRINTER_PAPER_WIDTH=58

# Habilitar impresión automática (true/false)
# false en desarrollo, true en producción
PRINTER_ENABLED=true

# Configuración avanzada
PRINTER_TIMEOUT=5
PRINTER_RETRIES=3
PRINTER_DEBUG=false
PRINTER_AUTO_CUT=true
PRINTER_CUT_TYPE=full
```

### Explicación de Variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PRINTER_HOST` | IP de la impresora en la red | `192.168.1.100` |
| `PRINTER_PORT` | Puerto (9100 es estándar para ESC/POS) | `9100` |
| `PRINTER_PAPER_WIDTH` | Ancho de papel: 58mm o 80mm | `58` |
| `PRINTER_ENABLED` | Activar/desactivar impresión | `true` o `false` |
| `PRINTER_TIMEOUT` | Segundos de timeout de conexión | `5` |
| `PRINTER_RETRIES` | Intentos de reconexión | `3` |
| `PRINTER_AUTO_CUT` | Cortar papel automáticamente | `true` o `false` |

## Paso 4: Probar la Conexión

Desde la terminal/CMD, en la carpeta del proyecto:

```bash
php artisan printer:test
```

Esperado si funciona:
```
✅ ¡Conexión exitosa!
La impresora está configurada correctamente y es accesible en red.
```

Con detalles:
```bash
php artisan printer:test --verbose
```

## Paso 5: Crear una Venta y Probar Impresión

1. Abre la aplicación web en tu navegador
2. Ve a **Ventas → Nueva Venta**
3. Llena los datos:
   - Cliente
   - Productos
   - Cantidad y precios
4. Haz clic en **Guardar**
5. El ticket se imprimirá automáticamente en la térmica

## Solución de Problemas

### ❌ "Error de conexión a la impresora"

**Causa 1: IP incorrecta**
```bash
# Verifica nuevamente:
ping 192.168.1.100

# Si no responde, la IP es incorrecta
# Obtén la IP correcta desde el panel de la impresora
```

**Causa 2: Puerto incorrecto**
- Revisa el panel de la impresora para el puerto correcto
- Algunos puertos alternativos: 515, 631, 8000, 19100

**Causa 3: Firewall bloqueando**
```bash
# En Windows, verifica si el firewall permite conexiones a puerto 9100
netstat -an | findstr ":9100"

# En Linux
netstat -tulpn | grep 9100
```

**Causa 4: Impresora apagada o desconectada**
- Verifica que la impresora esté encendida
- Verifica que esté conectada a la red

### ⚠️ "Impresora deshabilitada en configuración"

Si ves este mensaje:
1. Abre `.env`
2. Asegúrate que `PRINTER_ENABLED=true`
3. Guarda el archivo
4. Reinicia la aplicación si es necesario

### 🔧 El ticket no se imprime pero no hay error

- Verifica que `PRINTER_ENABLED=true`
- Revisa los logs en `storage/logs/laravel.log`
- Ejecuta el comando de prueba: `php artisan printer:test --verbose`

### 📄 El ticket impreso se ve mal

**Texto cortado:**
- Reduce el tamaño de nombres de productos
- Verifica que `PRINTER_PAPER_WIDTH` es correcto (58 o 80)

**Caracteres raros:**
- La impresora necesita reiniciar
- Verifica la codificación en PrinterService (es UTF-8)

**Alineación incorrecta:**
- Edita `app/Services/PrinterService.php`
- Ajusta `setJustification()` en los métodos de impresión

## Cambiar Configuración sin Reiniciar (Desarrollo)

Si cambias `.env` durante desarrollo:

```bash
# Limpia la caché de configuración
php artisan config:cache

# O simplemente reinicia el servidor
php artisan serve
```

## Desactivar Impresión Temporal

Si necesitas desactivar la impresión temporalmente:

```env
PRINTER_ENABLED=false
```

Esto no fallará las ventas, solo saltará la impresión.

## Ejemplos de Configuración por Tipo de Impresora

### Epson TM-T20 (58mm)
```env
PRINTER_HOST=192.168.1.100
PRINTER_PORT=9100
PRINTER_PAPER_WIDTH=58
PRINTER_ENABLED=true
```

### Star Micronics (80mm)
```env
PRINTER_HOST=192.168.1.105
PRINTER_PORT=9100
PRINTER_PAPER_WIDTH=80
PRINTER_ENABLED=true
```

### Zebra ZD410 (Ethernet)
```env
PRINTER_HOST=192.168.1.110
PRINTER_PORT=9100
PRINTER_PAPER_WIDTH=58
PRINTER_ENABLED=true
```

## Personalizar Formato de Ticket

Para modificar el formato del ticket impreso, edita:

**Archivo:** `app/Services/PrinterService.php`

**Métodos principales:**
- `printHeader()` - Encabezado (empresa, número, fecha)
- `printClientInfo()` - Datos del cliente
- `printItems()` - Lista de productos
- `printTotals()` - Subtotal, descuento, total
- `printSeparator()` - Líneas separadoras

**Ejemplo de cambios:**

```php
// En printHeader() - Aumentar tamaño de empresa
$this->printer->setTextSize(3, 2); // De 2, 1 a 3, 2

// En printItems() - Agregar código de barras
$this->printer->barcode($detalle['codigo_barras'] ?? '', Printer::BARCODE_CODE128);

// En printTotals() - Agregar observaciones
$this->printer->text("Obs: {$datos['observaciones'] ?? ''}");
```

## Variables Disponibles en printTicket()

Cuando se crea una venta, estos datos se pasan al servicio:

```php
$datosTicket = [
    'numero' => '001234',              // Número de venta
    'cliente_nombre' => 'Juan Pérez',  // Nombre cliente
    'cliente_nit' => '1234567',        // NIT cliente
    'fecha' => Carbon::now(),          // Fecha/hora
    'detalles' => [                    // Array de items
        [
            'producto' => 'Producto X',
            'cantidad' => 2,
            'precio' => 100.00,
            'subtotal' => 200.00,
        ]
    ],
    'subtotal' => 500.00,
    'descuento' => 50.00,
    'total' => 450.00,
    'tipo_pago' => 'Contado',
];
```

## Verificar Logs

Para diagnosticar problemas, revisa:

```bash
# Ver últimas líneas del log
tail -f storage/logs/laravel.log

# En Windows PowerShell
Get-Content storage/logs/laravel.log -Wait

# Buscar errores de impresora
grep -i "printer" storage/logs/laravel.log
```

## Contacto/Soporte

Si encuentras problemas:

1. Ejecuta: `php artisan printer:test --verbose`
2. Revisa los logs: `storage/logs/laravel.log`
3. Verifica la IP de la impresora
4. Verifica conectividad: `ping <IP_IMPRESORA>`

## Notas Finales

- ✅ La impresión es **asíncrona** - no bloquea la creación de ventas
- ✅ Los **errores de impresión no fallan** la creación de ventas
- ✅ Puedes **desactivar temporalmente** con `PRINTER_ENABLED=false`
- ✅ Los **logs** registran todos los intentos de impresión
- ✅ El **corte de papel** es automático (configurable)

---

**Última actualización:** 2026-01-10
**Versión:** 1.0
