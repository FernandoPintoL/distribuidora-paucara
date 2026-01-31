# Fase 3: Guía de Implementación Backend - POST /api/precios/actualizar-cascada

## Descripción

Este documento describe cómo implementar el endpoint backend que actualiza la cascada de precios cuando el usuario cambia el costo en una compra.

**Tecnología**: Laravel (basado en la estructura del proyecto)

---

## Endpoint Especificación

### URL
```
POST /api/precios/actualizar-cascada
```

### Headers Requeridos
```
Content-Type: application/json
X-CSRF-TOKEN: {csrf_token}  // Si es aplicable
Authorization: Bearer {token}  // Si usa autenticación
```

### Request Body
```json
{
    "producto_id": 123,
    "precios": [
        {
            "precio_id": 456,
            "precio_nuevo": 100.50,
            "porcentaje_ganancia": 25.5,
            "motivo": "Cambio de costo en compra"
        },
        {
            "precio_id": 457,
            "precio_nuevo": 125.63,
            "porcentaje_ganancia": 25.0,
            "motivo": "Cambio de costo en compra"
        }
    ]
}
```

### Response (Éxito - HTTP 200)
```json
{
    "success": true,
    "mensaje": "2 precios actualizados exitosamente",
    "data": {
        "precios_actualizados": 2,
        "producto_id": 123,
        "timestamp": "2024-01-31T12:34:56Z"
    }
}
```

### Response (Error - HTTP 400/422)
```json
{
    "success": false,
    "mensaje": "El precio debe ser mayor a 0",
    "errors": {
        "precios.0.precio_nuevo": ["Debe ser mayor a 0"]
    }
}
```

---

## Implementación Laravel

### 1. Ruta (routes/api.php)

```php
// En routes/api.php, agregar:
Route::middleware(['auth:api', 'verified'])->group(function () {
    // ... otras rutas ...

    // Precios - Cascada en compras
    Route::post('/precios/actualizar-cascada', [PreciosController::class, 'actualizarCascada']);
    Route::post('/precios/actualizar', [PreciosController::class, 'actualizar']);
    Route::get('/productos/{id}/precios', [ProductosController::class, 'obtenerPrecios']);
    Route::get('/productos/{id}/historial-precios', [ProductosController::class, 'historialPrecios']);
});
```

**Notas**:
- Usar middleware `auth:api` si es necesario
- Ajustar según estructura de autenticación actual

### 2. Controller (app/Http/Controllers/PreciosController.php)

```php
<?php

namespace App\Http\Controllers;

use App\Models\Precio;
use App\Models\Producto;
use App\Models\HistorialPrecio;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use DB;

class PreciosController extends Controller
{
    /**
     * Actualiza la cascada de precios cuando cambia el costo en una compra
     *
     * POST /api/precios/actualizar-cascada
     * Body: {
     *   "producto_id": 123,
     *   "precios": [
     *     {
     *       "precio_id": 456,
     *       "precio_nuevo": 100.50,
     *       "porcentaje_ganancia": 25.5,
     *       "motivo": "Cambio de costo en compra"
     *     }
     *   ]
     * }
     */
    public function actualizarCascada(Request $request)
    {
        // ✅ VALIDAR REQUEST
        $validated = $request->validate([
            'producto_id' => 'required|integer|exists:productos,id',
            'precios' => 'required|array|min:1',
            'precios.*.precio_id' => 'required|integer|exists:precios_productos,id',
            'precios.*.precio_nuevo' => 'required|numeric|min:0.01',
            'precios.*.porcentaje_ganancia' => 'required|numeric|min:0',
            'precios.*.motivo' => 'required|string|max:255',
        ], [
            'precios.*.precio_nuevo.min' => 'El precio debe ser mayor a 0',
            'precios.*.motivo.required' => 'El motivo es obligatorio',
        ]);

        try {
            DB::beginTransaction();

            $producto = Producto::findOrFail($validated['producto_id']);
            $preciosActualizados = 0;
            $ahora = now();
            $usuarioId = auth()->id(); // O null si no hay autenticación

            // ✅ PROCESAR CADA PRECIO
            foreach ($validated['precios'] as $precioData) {
                $precio = Precio::findOrFail($precioData['precio_id']);

                // Validación adicional: precio debe pertenecer al producto
                if ($precio->producto_id !== $producto->id) {
                    throw new \Exception("El precio {$precioData['precio_id']} no pertenece al producto");
                }

                // Guardar precio anterior para auditoría
                $precioAnterior = $precio->precio;
                $gananciaAnterior = $precio->porcentaje_ganancia ?? 0;

                // ✅ ACTUALIZAR PRECIO
                $precio->update([
                    'precio' => $precioData['precio_nuevo'],
                    'porcentaje_ganancia' => $precioData['porcentaje_ganancia'],
                    'updated_at' => $ahora,
                ]);

                // ✅ REGISTRAR EN HISTORIAL (recomendado)
                HistorialPrecio::create([
                    'precio_id' => $precio->id,
                    'producto_id' => $producto->id,
                    'precio_anterior' => $precioAnterior,
                    'precio_nuevo' => $precioData['precio_nuevo'],
                    'ganancia_anterior' => $gananciaAnterior,
                    'ganancia_nueva' => $precioData['porcentaje_ganancia'],
                    'motivo' => $precioData['motivo'],
                    'usuario_id' => $usuarioId,
                    'ip_address' => $request->ip(),
                    'fecha' => $ahora,
                ]);

                $preciosActualizados++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => "{$preciosActualizados} precio(s) actualizado(s) exitosamente",
                'data' => [
                    'precios_actualizados' => $preciosActualizados,
                    'producto_id' => $producto->id,
                    'timestamp' => $ahora->toIso8601String(),
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'mensaje' => 'Producto o precio no encontrado',
                'errors' => ['not_found' => ['El ID no existe en la base de datos']]
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error actualizando cascada de precios:', [
                'error' => $e->getMessage(),
                'stack' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'mensaje' => 'Error al actualizar precios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualiza un precio individual
     * Método auxiliar para futuras mejoras
     */
    public function actualizar(Request $request)
    {
        $validated = $request->validate([
            'precio_id' => 'required|integer|exists:precios_productos,id',
            'precio_nuevo' => 'required|numeric|min:0.01',
            'motivo' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $precio = Precio::findOrFail($validated['precio_id']);
            $precioAnterior = $precio->precio;

            $precio->update([
                'precio' => $validated['precio_nuevo'],
                'updated_at' => now(),
            ]);

            // Registrar en historial
            HistorialPrecio::create([
                'precio_id' => $precio->id,
                'producto_id' => $precio->producto_id,
                'precio_anterior' => $precioAnterior,
                'precio_nuevo' => $validated['precio_nuevo'],
                'motivo' => $validated['motivo'],
                'usuario_id' => auth()->id(),
                'ip_address' => $request->ip(),
                'fecha' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'mensaje' => 'Precio actualizado exitosamente',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'mensaje' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
```

### 3. Modelos

#### Model: Precio (app/Models/Precio.php)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Precio extends Model
{
    protected $table = 'precios_productos';

    protected $fillable = [
        'producto_id',
        'tipo_precio_id',
        'precio',
        'porcentaje_ganancia',
        'updated_at',
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'porcentaje_ganancia' => 'decimal:2',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    public function tipoPrecio()
    {
        return $this->belongsTo(TipoPrecio::class);
    }

    public function historial()
    {
        return $this->hasMany(HistorialPrecio::class);
    }
}
```

#### Model: HistorialPrecio (app/Models/HistorialPrecio.php) - NUEVO

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialPrecio extends Model
{
    public $timestamps = false;

    protected $table = 'historial_precios';

    protected $fillable = [
        'precio_id',
        'producto_id',
        'precio_anterior',
        'precio_nuevo',
        'ganancia_anterior',
        'ganancia_nueva',
        'motivo',
        'usuario_id',
        'ip_address',
        'fecha',
    ];

    protected $casts = [
        'precio_anterior' => 'decimal:2',
        'precio_nuevo' => 'decimal:2',
        'ganancia_anterior' => 'decimal:2',
        'ganancia_nueva' => 'decimal:2',
        'fecha' => 'datetime',
    ];

    public function precio()
    {
        return $this->belongsTo(Precio::class);
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }
}
```

### 4. Migration para Historial (database/migrations/xxxx_create_historial_precios_table.php)

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historial_precios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('precio_id')->constrained('precios_productos')->onDelete('cascade');
            $table->foreignId('producto_id')->constrained('productos')->onDelete('cascade');
            $table->decimal('precio_anterior', 10, 2);
            $table->decimal('precio_nuevo', 10, 2);
            $table->decimal('ganancia_anterior', 5, 2)->nullable();
            $table->decimal('ganancia_nueva', 5, 2)->nullable();
            $table->string('motivo', 255);
            $table->foreignId('usuario_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ip_address')->nullable();
            $table->timestamp('fecha')->useCurrent();

            $table->index(['precio_id', 'fecha']);
            $table->index(['producto_id', 'fecha']);
            $table->index(['usuario_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historial_precios');
    }
};
```

**Ejecutar**:
```bash
php artisan migrate
```

---

## Testing

### Unit Test (tests/Feature/PreciosControllerTest.php)

```php
<?php

namespace Tests\Feature;

use App\Models\Producto;
use App\Models\Precio;
use App\Models\User;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class PreciosControllerTest extends TestCase
{
    public function test_actualizar_cascada_precios_exitoso()
    {
        Sanctum::actingAs(User::factory()->create());

        $producto = Producto::factory()->create();
        $precio1 = Precio::factory()->create(['producto_id' => $producto->id, 'precio' => 100]);
        $precio2 = Precio::factory()->create(['producto_id' => $producto->id, 'precio' => 150]);

        $response = $this->postJson('/api/precios/actualizar-cascada', [
            'producto_id' => $producto->id,
            'precios' => [
                [
                    'precio_id' => $precio1->id,
                    'precio_nuevo' => 110,
                    'porcentaje_ganancia' => 10,
                    'motivo' => 'Test',
                ],
                [
                    'precio_id' => $precio2->id,
                    'precio_nuevo' => 160,
                    'porcentaje_ganancia' => 15,
                    'motivo' => 'Test',
                ],
            ]
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => ['precios_actualizados' => 2]
                 ]);

        $this->assertEquals(110, $precio1->fresh()->precio);
        $this->assertEquals(160, $precio2->fresh()->precio);
    }

    public function test_rechaza_precio_negativo()
    {
        Sanctum::actingAs(User::factory()->create());

        $producto = Producto::factory()->create();
        $precio = Precio::factory()->create(['producto_id' => $producto->id]);

        $response = $this->postJson('/api/precios/actualizar-cascada', [
            'producto_id' => $producto->id,
            'precios' => [
                [
                    'precio_id' => $precio->id,
                    'precio_nuevo' => -10,
                    'porcentaje_ganancia' => 10,
                    'motivo' => 'Test',
                ]
            ]
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('precios.0.precio_nuevo');
    }

    public function test_rechaza_motivo_vacio()
    {
        // Similar al anterior, validar motivo requerido
    }

    public function test_rollback_en_error()
    {
        // Verificar que si un precio falla, los otros no se actualicen
    }
}
```

**Ejecutar tests**:
```bash
php artisan test tests/Feature/PreciosControllerTest.php
```

---

## Consideraciones de Seguridad

### ✅ Validaciones Implementadas
- [x] CSRF token (middleware de Laravel)
- [x] Autenticación requerida
- [x] Validación de IDs (existen en BD)
- [x] Validación de rangos (precio > 0)
- [x] Validación de tipos de dato
- [x] Transacción (rollback si error)
- [x] Log de cambios (auditoría)

### ✅ Auditoría
- [x] Registra usuario que hizo cambio
- [x] Registra IP
- [x] Registra motivo
- [x] Registra valores antes/después
- [x] Timestamp automático

### ⚠️ Mejoras Futuras
- [ ] Rate limiting (evitar spam)
- [ ] Permisos granulares (solo ciertos usuarios)
- [ ] Notificación a otros usuarios
- [ ] Approval workflow (requiere aprobación)

---

## Estructura de la Base de Datos

### Tabla: precios_productos (ya debe existir)
```sql
CREATE TABLE precios_productos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    producto_id BIGINT NOT NULL,
    tipo_precio_id BIGINT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    porcentaje_ganancia DECIMAL(5,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (tipo_precio_id) REFERENCES tipos_precio(id)
);
```

### Tabla: historial_precios (NUEVA - crear con migration)
```sql
CREATE TABLE historial_precios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    precio_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    precio_anterior DECIMAL(10,2) NOT NULL,
    precio_nuevo DECIMAL(10,2) NOT NULL,
    ganancia_anterior DECIMAL(5,2),
    ganancia_nueva DECIMAL(5,2),
    motivo VARCHAR(255) NOT NULL,
    usuario_id BIGINT,
    ip_address VARCHAR(45),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_precio_fecha (precio_id, fecha),
    INDEX idx_producto_fecha (producto_id, fecha),
    INDEX idx_usuario_fecha (usuario_id, fecha),
    FOREIGN KEY (precio_id) REFERENCES precios_productos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (usuario_id) REFERENCES users(id)
);
```

---

## Checklist de Implementación Backend

- [ ] Crear migration historial_precios
- [ ] Ejecutar migration
- [ ] Crear Model HistorialPrecio
- [ ] Crear/actualizar PreciosController
- [ ] Agregar rutas en routes/api.php
- [ ] Implementar validaciones
- [ ] Implementar lógica de actualización
- [ ] Implementar transacciones
- [ ] Agregar logging
- [ ] Crear unit tests
- [ ] Testar manualmente con Postman/cURL
- [ ] Verificar historial se guarda
- [ ] Verificar respuestas de error
- [ ] Testar con ProductosTable frontend

---

## Testar con cURL

```bash
# Test exitoso
curl -X POST http://localhost:8000/api/precios/actualizar-cascada \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "producto_id": 1,
    "precios": [
      {
        "precio_id": 1,
        "precio_nuevo": 100.50,
        "porcentaje_ganancia": 25,
        "motivo": "Cambio de costo en compra"
      }
    ]
  }'

# Test con error (precio negativo)
curl -X POST http://localhost:8000/api/precios/actualizar-cascada \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "producto_id": 1,
    "precios": [
      {
        "precio_id": 1,
        "precio_nuevo": -10,
        "porcentaje_ganancia": 25,
        "motivo": "Cambio de costo en compra"
      }
    ]
  }'
```

---

## Pasos Siguientes

1. **Implementar** este controller y migration
2. **Ejecutar tests** para validar
3. **Testar manualmente** el flujo completo:
   - Abrir ProductosTable
   - Ingresar precio diferente
   - Abrir modal
   - Editar precios
   - Guardar
   - Verificar BD actualizada
   - Verificar historial guardado

4. **Documentar** cualquier cambio adicional necesario

---

## Recursos Adicionales

- Laravel Validation: https://laravel.com/docs/validation
- Eloquent: https://laravel.com/docs/eloquent
- Migrations: https://laravel.com/docs/migrations
- Testing: https://laravel.com/docs/testing

