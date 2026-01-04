# Patrón EmpresaConfiguration

Documento de referencia para implementar nuevas funciones que dependan de configuración por empresa.

## Contexto

Después de la Fase 2 (Enero 2026), la tabla `empresas` ahora tiene referencias directas a almacenes:
- `almacen_id_principal`: Almacén principal de búsqueda (ej: "Almacén Principal")
- `almacen_id_venta`: Almacén de venta (ej: "Sala de Ventas")

## Principios

1. **Cada empresa tiene su configuración**: No usar valores globales (`config()`) para decisiones específicas de empresa
2. **Fallback seguro**: Si no hay empresa en el contexto, usar empresa principal como fallback
3. **Parametrizable desde request**: Permitir sobrescribir desde cliente (para testing, excepciones, etc.)
4. **Auditable**: Dejar trazabilidad de qué empresa se usó

## Patrones de implementación

### Patrón 1: En un Controlador API

```php
use App\Models\Empresa;

class MiController extends Controller
{
    /**
     * Obtener datos según empresa
     *
     * URL: GET /api/datos?empresa_id=1&almacen_id=3
     */
    public function obtenerDatos(Request $request): JsonResponse
    {
        // Paso 1: Obtener empresa del contexto
        $empresa = $this->obtenerEmpresa($request);

        // Paso 2: Usar configuración de la empresa
        $almacenPrincipal = $empresa->getPrincipalAlmacen();

        // Paso 3: Ejecutar lógica con parámetros de la empresa
        $datos = MiModelo::where('almacen_id', $almacenPrincipal->id)->get();

        return ApiResponse::success($datos);
    }

    /**
     * Método helper reutilizable (como en ProductoController)
     */
    private function obtenerEmpresa(Request $request): ?Empresa
    {
        if ($request->has('empresa_id')) {
            return Empresa::find($request->integer('empresa_id'));
        }
        return Empresa::principal();
    }
}
```

### Patrón 2: Crear una Clase de Servicio

```php
namespace App\Services;

use App\Models\Empresa;
use Illuminate\Http\Request;

class EmpresaConfigService
{
    private Empresa $empresa;

    public function __construct(Empresa $empresa)
    {
        $this->empresa = $empresa;
    }

    /**
     * Factory method con fallback
     */
    public static function fromRequest(Request $request): self
    {
        if ($request->has('empresa_id')) {
            $empresa = Empresa::find($request->integer('empresa_id'));
        } else {
            $empresa = Empresa::principal();
        }

        return new self($empresa);
    }

    /**
     * Ejemplo: obtener almacenes permitidos
     */
    public function obtenerAlmacenes()
    {
        return collect([
            $this->empresa->almacen_id_principal,
            $this->empresa->almacen_id_venta,
        ])->filter()->unique();
    }

    /**
     * Ejemplo: obtener configuración de precios
     */
    public function obtenerConfiguracionPrecios()
    {
        // Implementar lógica específica de empresa
        return [
            'margen_minimo' => $this->empresa->configuracion['margen_minimo'] ?? 10,
            'almacen_principal' => $this->empresa->almacen_id_principal,
        ];
    }
}
```

**Uso en controlador:**

```php
public function obtenerDatos(Request $request)
{
    $config = EmpresaConfigService::fromRequest($request);
    $almacenes = $config->obtenerAlmacenes();
    $precios = $config->obtenerConfiguracionPrecios();

    return ApiResponse::success(compact('almacenes', 'precios'));
}
```

### Patrón 3: Usar FormRequest con validación

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ObtenerDatosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'empresa_id' => ['nullable', 'integer', 'exists:empresas,id'],
            'almacen_id' => ['nullable', 'integer', 'exists:almacenes,id'],
        ];
    }

    /**
     * Obtener empresa del request validado
     */
    public function getEmpresa()
    {
        return Empresa::find($this->input('empresa_id')) ?? Empresa::principal();
    }
}
```

**Uso en controlador:**

```php
public function obtenerDatos(ObtenerDatosRequest $request)
{
    $empresa = $request->getEmpresa();
    // ... usar empresa
}
```

## Casos de uso futuros

Según el análisis inicial, estas funciones probablemente necesitarán parametrización por empresa:

### ✓ Stock y Almacenes
- [x] Listado de productos por almacén (indexApi, buscarApi)
- [ ] Transferencias entre almacenes
- [ ] Ajustes de inventario
- [ ] Alertas de stock bajo

### ✓ Precios
- [ ] Precios diferentes por empresa
- [ ] Márgenes de ganancia configurables
- [ ] Descuentos por volumen por empresa

### Documentos
- [ ] Documentos (facturas, boletas) con configuración por empresa
- [ ] Numeración de documentos por empresa
- [ ] Plantillas de impresión por empresa

### Logística
- [ ] Rutas de entrega por empresa
- [ ] Métodos de transporte permitidos
- [ ] Zonas de cobertura

### Usuarios/Permisos
- [ ] Usuarios asignados a empresas específicas
- [ ] Permisos diferenciados por empresa
- [ ] Cajas/puntos de venta por empresa

## Migración desde config()

Si encontramos código que usa `config('inventario.almacen_principal_id')`:

**Antes:**
```php
$almacenId = config('inventario.almacen_principal_id', 1);
```

**Después:**
```php
$empresa = $this->obtenerEmpresa($request);
$almacenId = $empresa?->almacen_id_principal ?? config('inventario.almacen_principal_id', 1);
```

## Testing

### Test unitario para validar obtención de empresa

```php
public function test_obtener_empresa_desde_request()
{
    $empresa = Empresa::first();
    $request = Request::create('/', 'GET', ['empresa_id' => $empresa->id]);

    $resultado = $this->controller->obtenerEmpresa($request);

    $this->assertEquals($empresa->id, $resultado->id);
}

public function test_obtener_empresa_fallback_a_principal()
{
    $request = Request::create('/', 'GET', []);

    $resultado = $this->controller->obtenerEmpresa($request);

    $this->assertEquals(Empresa::principal()->id, $resultado->id);
}
```

## Seguridad

### Validaciones importantes

1. **El usuario puede acceder a esta empresa?**
   - Si hay autenticación específica por empresa, validar en middleware
   - Actualmente: cualquiera puede solicitar cualquier empresa (OK para multi-tenant)

2. **El almacén pertenece a la empresa?**
   - Usar el FormRequest `ValidarAlmacenEmpresaRequest`
   - Ampliar con validación many-to-many cuando sea necesario

3. **Registrar auditoría**
   - Considerar logging de qué empresa se usó en operaciones críticas

## Referencias

- **Modelo Empresa**: `app/Models/Empresa.php`
- **Controlador ejemplo**: `app/Http/Controllers/ProductoController.php` (métodos indexApi, buscarApi)
- **FormRequest ejemplo**: `app/Http/Requests/ValidarAlmacenEmpresaRequest.php`
- **Seeder**: `database/seeders/AssignAlmacenesToEmpresasSeeder.php`

## Changelog

- **2026-01-04**: Documento creado. Patrón inicial basado en refactorización de ProductoController.
