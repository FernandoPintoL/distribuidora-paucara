# 📊 Documentación: ReportService - Servicio Centralizado de Reportes

**Fecha:** 2025-10-25
**Versión:** 1.0.0
**Estado:** ✅ IMPLEMENTADO Y OPERATIVO

---

## 🎯 Objetivo

Proporcionar una interfaz centralizada y reutilizable para generar reportes en múltiples formatos (PDF y Excel) con un sistema modular, escalable y consistente.

---

## 📁 Archivos Involucrados

### Nuevos Archivos Creados:

1. **`app/Services/ReportService.php`** - Servicio centralizado
2. **`app/Exports/EntregasRechazadasExport.php`** - Export de entregas rechazadas
3. **`DOCUMENTACION_REPORT_SERVICE.md`** - Esta documentación

### Archivos Modificados:

1. **`app/Http/Controllers/EnvioController.php`**
   - Importa `ReportService`
   - Métodos `exportPdf()` y `exportExcel()` ahora usan el servicio
   - Nuevo método: `exportEntregasRechazadas()`

2. **`app/Exports/EnviosExport.php`** - Sin cambios (ya existía)

3. **`routes/web.php`**
   - Ruta: `GET /envios/export/pdf`
   - Ruta: `GET /envios/export/excel`
   - Ruta: `GET /envios/export/rechazadas` ✅ NUEVA

4. **`routes/api.php`** - Sin cambios

---

## 🏗️ Arquitectura del ReportService

### Estructura Jerárquica:

```
ReportService (Servicio Central)
├── Métodos de Exportación
│   ├── exportarEnviosPdf()
│   ├── exportarEnviosExcel()
│   └── exportarEntregasRechazadasExcel()
│
├── Métodos de Consulta
│   ├── obtenerEnviosRechazados()
│   ├── estadisticasEntregasRechazadas()
│   ├── enviosPorEstado()
│   └── topChoforesRechazos()
│
└── Métodos Generales
    └── generarReporteCompleto()
```

---

## 📝 Métodos Disponibles

### 1. Exportación a PDF

```php
$reportService = app(ReportService::class);

// Obtener envíos con filtros
$envios = Envio::where(...)->get();

// Exportar a PDF
return $reportService->exportarEnviosPdf(
    $envios,
    [
        'estado' => 'EN_RUTA',
        'fecha_desde' => '2025-10-01',
        'fecha_hasta' => '2025-10-31',
    ]
);
```

**Parámetros:**
- `$envios` (Collection) - Colección de envios a exportar
- `$filtros` (array) - Filtros aplicados (opcional)

**Retorna:** PDF descargable

---

### 2. Exportación a Excel

```php
// Exportar envios a Excel
return $reportService->exportarEnviosExcel($envios);
```

**Parámetros:**
- `$envios` (Collection) - Colección de envios

**Retorna:** Archivo Excel descargable

---

### 3. Exportación de Entregas Rechazadas

```php
// Exportar solo entregas con problemas
return $reportService->exportarEntregasRechazadasExcel($envios);
```

**Características:**
- Solo incluye envios con `estado_entrega != null`
- Muestra cantidad de fotos adjuntas
- Color rojo en headers (para distinguir de otros reportes)
- Filtros incluidos en headers

---

### 4. Obtener Envios Rechazados

```php
$filtros = [
    'fecha_desde' => '2025-10-01',
    'fecha_hasta' => '2025-10-31',
    'tipo_rechazo' => 'CLIENTE_AUSENTE',
    'chofer_id' => 5,
    'search' => 'ENV-20251024',
];

$envios = $reportService->obtenerEnviosRechazados($filtros);
```

**Filtros Disponibles:**
- `fecha_desde` (date) - Filtro de fecha inicio
- `fecha_hasta` (date) - Filtro de fecha fin
- `tipo_rechazo` (string) - Tipo específico de rechazo
- `chofer_id` (int) - ID del chofer
- `search` (string) - Búsqueda en número o cliente

**Retorna:** Collection de envios rechazados

---

### 5. Estadísticas de Entregas Rechazadas

```php
$stats = $reportService->estadisticasEntregasRechazadas();

// Resultado:
[
    'total_rechazadas' => 45,
    'cliente_ausente' => 20,
    'tienda_cerrada' => 15,
    'otro_problema' => 10,
    'tasa_rechazo_porcentaje' => 12.5,
    'ultimas_24_horas' => 3,
]
```

---

### 6. Envios Agrupados por Estado

```php
$porEstado = $reportService->enviosPorEstado();

// Resultado:
[
    'programados' => 50,
    'en_preparacion' => 25,
    'en_ruta' => 15,
    'entregados' => 100,
    'rechazados' => 45,
    'cancelados' => 5,
]
```

---

### 7. Top Choferes con Rechazos

```php
$top = $reportService->topChoforesRechazos(5); // Top 5

// Retorna Collection con:
// - chofer_id
// - chofer_nombre
// - total_rechazos
```

---

### 8. Reporte Completo

```php
$reporte = $reportService->generarReporteCompleto([
    'fecha_desde' => '2025-10-01',
    'fecha_hasta' => '2025-10-31',
]);

// Estructura:
[
    'estadisticas' => [...], // De estadisticasEntregasRechazadas()
    'por_estado' => [...],    // De enviosPorEstado()
    'top_choferes' => [...],  // De topChoforesRechazos()
    'envios' => [...],         // Collection de envios
    'fecha_generacion' => ..., // DateTime
]
```

---

## 🔌 Integración en Controladores

### Ejemplo: EnvioController

```php
use App\Services\ReportService;

class EnvioController extends Controller
{
    public function exportPdf(Request $request)
    {
        $reportService = app(ReportService::class);
        $envios = $this->obtenerEnvios($request);

        return $reportService->exportarEnviosPdf(
            $envios,
            $request->all()
        );
    }

    public function exportExcel(Request $request)
    {
        $reportService = app(ReportService::class);
        $envios = $this->obtenerEnvios($request);

        return $reportService->exportarEnviosExcel($envios);
    }

    public function exportEntregasRechazadas(Request $request)
    {
        $reportService = app(ReportService::class);

        $filtros = [
            'fecha_desde' => $request->input('fecha_desde'),
            'fecha_hasta' => $request->input('fecha_hasta'),
            'tipo_rechazo' => $request->input('tipo_rechazo'),
            'chofer_id' => $request->input('chofer_id'),
        ];

        $envios = $reportService->obtenerEnviosRechazados($filtros);
        return $reportService->exportarEntregasRechazadasExcel($envios);
    }
}
```

---

## 📋 Extensión para Otros Módulos

### Patrón para Reutilizar

Para agregar reportes a otro módulo, sigue estos pasos:

#### 1. Crear Export Class

```php
// app/Exports/MiModuloExport.php
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

class MiModuloExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    // ... implementar métodos
}
```

#### 2. Agregar Métodos al ReportService

```php
// En app/Services/ReportService.php

public function exportarMiModuloExcel(Collection $datos): Response
{
    return Excel::download(
        new MiModuloExport($datos),
        'mi-modulo_' . now()->format('Y-m-d_His') . '.xlsx'
    );
}

public function obtenerMiModuloPorFiltros(array $filtros): Collection
{
    // ... lógica de filtrado
}
```

#### 3. Usar en Controlador

```php
// En tu controlador
public function exportar(Request $request)
{
    $reportService = app(ReportService::class);
    $datos = $this->obtenerDatos($request);

    return $reportService->exportarMiModuloExcel($datos);
}
```

---

## 🚀 Rutas Disponibles

### Envios

```
GET  /envios/export/pdf           envios.export-pdf       Exportar envios a PDF
GET  /envios/export/excel         envios.export-excel     Exportar envios a Excel
GET  /envios/export/rechazadas    envios.export-rechazadas Exportar entregas rechazadas
```

### Uso desde Frontend

```html
<!-- Link para descargar PDF -->
<a href="{{ route('envios.export-pdf', ['estado' => 'EN_RUTA']) }}" class="btn btn-primary">
    Descargar PDF
</a>

<!-- Link para descargar Excel -->
<a href="{{ route('envios.export-excel') }}" class="btn btn-success">
    Descargar Excel
</a>

<!-- Link para entregas rechazadas -->
<a href="{{ route('envios.export-rechazadas', ['fecha_desde' => '2025-10-01']) }}" class="btn btn-danger">
    Descargar Rechazadas
</a>
```

---

## 🎨 Características de Exportación

### Excel: EnviosExport
- **Headers:** 13 columnas
- **Color:** Azul (#4F81BD)
- **Anchos:** Optimizados por columna
- **Emojis:** Estados con iconos

### Excel: EntregasRechazadasExport
- **Headers:** 10 columnas especializadas
- **Color:** Rojo (#C0504D) - para distinguir
- **Datos:** Tipo rechazo, motivo, fotos, chofer
- **Filtros:** Mostrados en datos

### PDF: envios-pdf.blade.php
- **Header:** Título y fecha generación
- **Filtros:** Muestra filtros aplicados
- **Datos:** Tabla principal
- **Summary:** Grid con estadísticas
- **Footer:** Numeración de páginas

---

## 🔍 Testing

### Testear Exportación PDF

```bash
# Desde terminal
curl -o envios.pdf http://localhost:8000/envios/export/pdf

# Con filtros
curl -o envios.pdf "http://localhost:8000/envios/export/pdf?estado=EN_RUTA&fecha_desde=2025-10-01"
```

### Testear Exportación Excel

```bash
curl -o envios.xlsx http://localhost:8000/envios/export/excel
```

### Testear Entregas Rechazadas

```bash
curl -o rechazadas.xlsx "http://localhost:8000/envios/export/rechazadas?tipo_rechazo=CLIENTE_AUSENTE"
```

---

## 📊 Casos de Uso

### 1. Generar Reporte Mensual de Entregas

```php
$reportService = app(ReportService::class);

$filtros = [
    'fecha_desde' => '2025-10-01',
    'fecha_hasta' => '2025-10-31',
];

$reporte = $reportService->generarReporteCompleto($filtros);

// Guardar en base de datos o enviar por email
return view('reportes.entrega-mensual', $reporte);
```

### 2. Monitorear Choferes con Problemas

```php
$topChoferes = $reportService->topChoforesRechazos(10);

foreach ($topChoferes as $chofer) {
    if ($chofer->total_rechazos > 5) {
        // Enviar alerta al supervisor
        notificarSupervisor($chofer);
    }
}
```

### 3. Análisis de Entregas Fallidas

```php
$estadisticas = $reportService->estadisticasEntregasRechazadas();
$tasa = $estadisticas['tasa_rechazo_porcentaje'];

if ($tasa > 10) {
    // Análisis de problema
    logearAlerta("Tasa de rechazo alta: {$tasa}%");
}
```

---

## 🐛 Troubleshooting

### Excel no se descarga

**Problema:** El archivo no se descarga
**Solución:**
1. Verificar que `Maatwebsite/Excel` está instalado: `composer require maatwebsite/excel`
2. Limpiar caché: `php artisan cache:clear`
3. Verificar storage: `php artisan storage:link`

### PDF vacío o mal formateado

**Problema:** PDF se genera pero sin datos
**Solución:**
1. Verificar que la vista existe: `resources/views/exports/envios-pdf.blade.php`
2. Instalar dompdf: `composer require barryvdh/laravel-dompdf`
3. Revisar formato de datos en la vista

### Error de permisos

**Problema:** Error al guardar archivos
**Solución:**
```bash
chmod -R 755 storage/
php artisan storage:link
```

---

## 📈 Mejoras Futuras

1. **Más formatos:** CSV, JSON, XML
2. **Reportes programados:** Generar automáticamente
3. **Email:** Enviar reportes por correo
4. **API:** Endpoints para reportes
5. **Dashboard:** Visualización interactiva
6. **Caché:** Cache de reportes frecuentes

---

## 📞 Soporte

Para problemas o sugerencias sobre el ReportService:

1. Revisar este documento
2. Consultar el código comentado en `app/Services/ReportService.php`
3. Revisar ejemplos en `app/Http/Controllers/EnvioController.php`
4. Consultar logs: `storage/logs/laravel.log`

---

**Última Actualización:** 2025-10-25
**Mantenedor:** Sistema Automático
**Estado:** ✅ Producción
