# Setup y Pruebas: Precios por Rangos de Cantidad

## ✅ Checklist de Instalación

- [x] Migración creada: `2026_01_04_000100_create_precio_rango_cantidad_producto_table.php`
- [x] Migración ejecutada ✅
- [x] Modelo `PrecioRangoCantidadProducto` creado
- [x] Relaciones en `Producto` agregadas
- [x] Servicio `PrecioRangoProductoService` creado
- [x] Controller API `PrecioRangoProductoController` creado
- [x] Form Requests de validación creados
- [x] Rutas API agregadas a `routes/api.php`
- [x] Integración en `ApiProformaController`
- [x] Documentación API creada

## Bases de Datos

### Verificar que la tabla se creó correctamente

```bash
cd D:\paucara\distribuidora-paucara-web

# Ver estado de migraciones
php artisan migrate:status

# Si necesitas rollback
php artisan migrate:rollback

# Re-ejecutar
php artisan migrate
```

### Verificar estructura de tabla

```sql
SELECT * FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'precio_rango_cantidad_producto';
```

## Pruebas Manuales

### 1. Crear un Producto de Prueba

```bash
php artisan tinker
```

```php
$producto = App\Models\Producto::create([
    'nombre' => 'PEPSI 250ML TEST',
    'sku' => 'PEPSI-250-TEST-' . date('Ymd'),
    'categoria_id' => 1,
    'unidad_medida_id' => 1,
    'stock_minimo' => 0,
    'stock_maximo' => 1000,
    'activo' => true
]);

echo "Producto creado con ID: {$producto->id}";
```

### 2. Crear Precios

```php
// Obtener tipos de precio
$tipoNormal = App\Models\TipoPrecio::where('codigo', 'VENTA_NORMAL')->first();
$tipoDescuento = App\Models\TipoPrecio::where('codigo', 'DESCUENTO')->first();
$tipoEspecial = App\Models\TipoPrecio::where('codigo', 'ESPECIAL')->first();

// Si no existen, crearlos
if (!$tipoNormal) {
    $tipoNormal = App\Models\TipoPrecio::create([
        'codigo' => 'VENTA_NORMAL',
        'nombre' => 'Venta Normal',
        'es_ganancia' => true,
        'porcentaje_ganancia' => 0,
        'orden' => 1,
        'activo' => true
    ]);
}

if (!$tipoDescuento) {
    $tipoDescuento = App\Models\TipoPrecio::create([
        'codigo' => 'DESCUENTO',
        'nombre' => 'Descuento',
        'es_ganancia' => true,
        'porcentaje_ganancia' => 0,
        'orden' => 2,
        'activo' => true
    ]);
}

if (!$tipoEspecial) {
    $tipoEspecial = App\Models\TipoPrecio::create([
        'codigo' => 'ESPECIAL',
        'nombre' => 'Especial',
        'es_ganancia' => true,
        'porcentaje_ganancia' => 0,
        'orden' => 3,
        'activo' => true
    ]);
}

// Agregar precios al producto
$producto->agregarPrecio('Precio Normal', 10.00, $tipoNormal);
$producto->agregarPrecio('Precio Descuento', 8.50, $tipoDescuento);
$producto->agregarPrecio('Precio Especial', 7.00, $tipoEspecial);

echo "Precios creados exitosamente";
```

### 3. Crear Rangos

```php
// Rango 1-9
$rango1 = App\Models\PrecioRangoCantidadProducto::create([
    'empresa_id' => 1,
    'producto_id' => $producto->id,
    'tipo_precio_id' => $tipoNormal->id,
    'cantidad_minima' => 1,
    'cantidad_maxima' => 9,
    'activo' => true,
    'orden' => 0
]);

// Rango 10-49
$rango2 = App\Models\PrecioRangoCantidadProducto::create([
    'empresa_id' => 1,
    'producto_id' => $producto->id,
    'tipo_precio_id' => $tipoDescuento->id,
    'cantidad_minima' => 10,
    'cantidad_maxima' => 49,
    'activo' => true,
    'orden' => 1
]);

// Rango 50+
$rango3 = App\Models\PrecioRangoCantidadProducto::create([
    'empresa_id' => 1,
    'producto_id' => $producto->id,
    'tipo_precio_id' => $tipoEspecial->id,
    'cantidad_minima' => 50,
    'cantidad_maxima' => null,
    'activo' => true,
    'orden' => 2
]);

echo "Rangos creados: {$rango1->id}, {$rango2->id}, {$rango3->id}";
```

### 4. Probar Cálculos de Precio

```php
// Test 1: Cantidad 5 (rango 1-9)
$precio5 = $producto->obtenerPrecioConRango(5, 1);
echo "Precio para 5 unidades: Bs. {$precio5}\n";  // Espera: 10.00

// Test 2: Cantidad 15 (rango 10-49)
$precio15 = $producto->obtenerPrecioConRango(15, 1);
echo "Precio para 15 unidades: Bs. {$precio15}\n";  // Espera: 8.50

// Test 3: Cantidad 75 (rango 50+)
$precio75 = $producto->obtenerPrecioConRango(75, 1);
echo "Precio para 75 unidades: Bs. {$precio75}\n";  // Espera: 7.00

// Test 4: Detalles completos
$detalles15 = $producto->obtenerPrecioConDetallesRango(15, 1);
echo "\n=== DETALLES PARA 15 UNIDADES ===\n";
echo "Precio unitario: Bs. {$detalles15['precio_unitario']}\n";
echo "Subtotal: Bs. {$detalles15['subtotal']}\n";
echo "Rango aplicado: {$detalles15['rango_aplicado']['cantidad_minima']}-{$detalles15['rango_aplicado']['cantidad_maxima']}\n";
echo "Próximo rango: Desde {$detalles15['proximo_rango']['cantidad_minima']} unidades\n";
echo "Falta: {$detalles15['proximo_rango']['falta_cantidad']} unidades para siguiente rango\n";
echo "Ahorro si agrega hasta siguiente rango: Bs. {$detalles15['ahorro_proximo']}\n";

// Test 5: Obtener rangos activos
$rangos = $producto->obtenerRangosActivos(1);
echo "\n=== RANGOS CONFIGURADOS ===\n";
foreach ($rangos as $rango) {
    $desde = $rango->cantidad_minima;
    $hasta = $rango->cantidad_maxima ? $rango->cantidad_maxima : '∞';
    echo "- [{$desde}-{$hasta}] → {$rango->tipoPrecio->nombre}\n";
}
```

### 5. Validar Integridad

```php
$servicio = app(App\Services\Venta\PrecioRangoProductoService::class);
$validacion = $servicio->validarIntegridad($producto, 1);

echo "\n=== VALIDACIÓN DE INTEGRIDAD ===\n";
echo "Es válido: " . ($validacion['es_valido'] ? 'SÍ' : 'NO') . "\n";
echo "Cantidad de rangos: {$validacion['cantidad_rangos']}\n";
if (!empty($validacion['problemas'])) {
    echo "Problemas encontrados:\n";
    foreach ($validacion['problemas'] as $problema) {
        echo "  - {$problema}\n";
    }
}
```

### 6. Probar Servicio de Carrito

```php
// Simular carrito
$carrito = [
    ['producto_id' => $producto->id, 'cantidad' => 5],
    ['producto_id' => $producto->id, 'cantidad' => 15],
    ['producto_id' => $producto->id, 'cantidad' => 75],
];

$resultado = $servicio->calcularCarrito($carrito, 1);

echo "\n=== CÁLCULO DE CARRITO ===\n";
echo "Total items: {$resultado['cantidad_items']}\n";
echo "Total general: Bs. {$resultado['total']}\n\n";

foreach ($resultado['detalles'] as $i => $detalle) {
    $num = $i + 1;
    echo "{$num}. {$detalle['producto_nombre']} x{$detalle['cantidad']}\n";
    echo "   Precio unitario: Bs. {$detalle['precio_unitario']}\n";
    echo "   Subtotal: Bs. {$detalle['subtotal']}\n";
    if ($detalle['proximo_rango']) {
        echo "   Falta {$detalle['proximo_rango']['falta_cantidad']} para ahorrar Bs. {$detalle['ahorro_proximo']}\n";
    }
    echo "\n";
}
```

## Pruebas API con cURL

### 1. Obtener rangos

```bash
curl -X GET "http://localhost/api/productos/1/rangos-precio" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Crear rango

```bash
curl -X POST "http://localhost/api/productos/1/rangos-precio" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad_minima": 10,
    "cantidad_maxima": 49,
    "tipo_precio_id": 2
  }'
```

### 3. Calcular precio

```bash
curl -X POST "http://localhost/api/productos/1/calcular-precio" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cantidad": 15}'
```

### 4. Calcular carrito

```bash
curl -X POST "http://localhost/api/carrito/calcular" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"producto_id": 1, "cantidad": 15},
      {"producto_id": 2, "cantidad": 75}
    ]
  }'
```

## Tests Unitarios

Crear archivo: `tests/Unit/PrecioRangoProductoTest.php`

```php
<?php

namespace Tests\Unit;

use App\Models\Producto;
use App\Models\PrecioRangoCantidadProducto;
use App\Models\TipoPrecio;
use App\Services\Venta\PrecioRangoProductoService;
use Tests\TestCase;

class PrecioRangoProductoTest extends TestCase
{
    protected $producto;
    protected $tipoNormal;
    protected $tipoDescuento;
    protected $tipoEspecial;
    protected $servicio;
    protected $empresaId = 1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->servicio = app(PrecioRangoProductoService::class);

        // Crear tipos de precio
        $this->tipoNormal = TipoPrecio::firstOrCreate(
            ['codigo' => 'VENTA_NORMAL'],
            ['nombre' => 'Venta Normal', 'es_ganancia' => true, 'orden' => 1, 'activo' => true]
        );

        $this->tipoDescuento = TipoPrecio::firstOrCreate(
            ['codigo' => 'DESCUENTO'],
            ['nombre' => 'Descuento', 'es_ganancia' => true, 'orden' => 2, 'activo' => true]
        );

        $this->tipoEspecial = TipoPrecio::firstOrCreate(
            ['codigo' => 'ESPECIAL'],
            ['nombre' => 'Especial', 'es_ganancia' => true, 'orden' => 3, 'activo' => true]
        );

        // Crear producto
        $this->producto = Producto::create([
            'nombre' => 'TEST PRODUCT',
            'sku' => 'TEST-' . time(),
            'categoria_id' => 1,
            'activo' => true
        ]);

        // Crear precios
        $this->producto->agregarPrecio('Normal', 10.00, $this->tipoNormal);
        $this->producto->agregarPrecio('Descuento', 8.50, $this->tipoDescuento);
        $this->producto->agregarPrecio('Especial', 7.00, $this->tipoEspecial);

        // Crear rangos
        PrecioRangoCantidadProducto::create([
            'empresa_id' => $this->empresaId,
            'producto_id' => $this->producto->id,
            'tipo_precio_id' => $this->tipoNormal->id,
            'cantidad_minima' => 1,
            'cantidad_maxima' => 9,
        ]);

        PrecioRangoCantidadProducto::create([
            'empresa_id' => $this->empresaId,
            'producto_id' => $this->producto->id,
            'tipo_precio_id' => $this->tipoDescuento->id,
            'cantidad_minima' => 10,
            'cantidad_maxima' => 49,
        ]);

        PrecioRangoCantidadProducto::create([
            'empresa_id' => $this->empresaId,
            'producto_id' => $this->producto->id,
            'tipo_precio_id' => $this->tipoEspecial->id,
            'cantidad_minima' => 50,
            'cantidad_maxima' => null,
        ]);
    }

    public function test_precio_rango_1_a_9()
    {
        $precio = $this->producto->obtenerPrecioConRango(5, $this->empresaId);
        $this->assertEquals(10.00, $precio);
    }

    public function test_precio_rango_10_a_49()
    {
        $precio = $this->producto->obtenerPrecioConRango(15, $this->empresaId);
        $this->assertEquals(8.50, $precio);
    }

    public function test_precio_rango_50_mas()
    {
        $precio = $this->producto->obtenerPrecioConRango(75, $this->empresaId);
        $this->assertEquals(7.00, $precio);
    }

    public function test_detalles_con_proximo_rango()
    {
        $detalles = $this->producto->obtenerPrecioConDetallesRango(15, $this->empresaId);

        $this->assertEquals(8.50, $detalles['precio_unitario']);
        $this->assertEquals(127.50, $detalles['subtotal']);
        $this->assertNotNull($detalles['proximo_rango']);
        $this->assertEquals(50, $detalles['proximo_rango']['cantidad_minima']);
        $this->assertEquals(35, $detalles['proximo_rango']['falta_cantidad']);
        $this->assertEquals(75.00, $detalles['ahorro_proximo']);
    }

    public function test_validar_integridad()
    {
        $validacion = $this->servicio->validarIntegridad($this->producto, $this->empresaId);

        $this->assertTrue($validacion['es_valido']);
        $this->assertEmpty($validacion['problemas']);
        $this->assertEquals(3, $validacion['cantidad_rangos']);
    }

    public function test_calcular_carrito()
    {
        $carrito = [
            ['producto_id' => $this->producto->id, 'cantidad' => 5],
            ['producto_id' => $this->producto->id, 'cantidad' => 15],
            ['producto_id' => $this->producto->id, 'cantidad' => 75],
        ];

        $resultado = $this->servicio->calcularCarrito($carrito, $this->empresaId);

        // 5*10 + 15*8.5 + 75*7 = 50 + 127.5 + 525 = 702.5
        $this->assertEquals(702.50, $resultado['total']);
        $this->assertEquals(3, $resultado['cantidad_items']);
    }
}
```

Ejecutar tests:

```bash
php artisan test tests/Unit/PrecioRangoProductoTest.php
```

## Troubleshooting

### Error: "Table 'precio_rango_cantidad_producto' doesn't exist"

```bash
# Ejecutar migraciones
php artisan migrate

# O solo la nueva migración
php artisan migrate --path=database/migrations/2026_01_04_000100_create_precio_rango_cantidad_producto_table.php
```

### Error: "No existe relación rangosPrecios en Producto"

Verificar que el método `rangosPrecios()` está en el modelo Producto (línea ~124).

### Error: "PrecioRangoProductoService not found"

```bash
# Regenerar autoloader de Composer
composer dump-autoload
```

### Error en ApiProformaController: "obtenerPrecioConRango not found"

Verificar que los métodos están en Producto.php (agregados en línea ~236).

## Performance Notes

La funcionalidad está optimizada para:
- **Consultas rápidas:** Índices en `(empresa_id, producto_id, activo)`
- **Escalabilidad:** Hasta 100+ productos × 10+ rangos por empresa
- **Caché potencial:** Rangos cambian raramente, pueden ser cacheados

## Próximos Pasos

1. Crear UI en React para gestionar rangos (modal de edición)
2. Mostrar ahorros en carrito del cliente
3. Importación masiva de rangos (CSV)
4. Análisis de elasticidad precio-demanda
