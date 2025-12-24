# 📋 Nivel 3 - Plan de Implementación Completo

## Descripción General

El Nivel 3 implementa validaciones avanzadas para consultar disponibilidad del chofer, horarios de operación y calendario de festivos. Esto mejora significativamente la precisión del sistema de entregas al:

- Prevenir asignación de entregas a choferes no disponibles
- Respetar horarios de operación de la empresa
- Evitar entregas en días festivos

---

## 1. ARQUITECTURA Y COMPONENTES

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TypeScript)              │
├─────────────────────────────────────────────────────────────┤
│ use-simple-entrega-form.ts (Hook)                           │
│ ├─ Valida disponibilidad del chofer                         │
│ ├─ Valida horarios de operación                             │
│ └─ Valida festivos                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP Calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             BACKEND (Laravel/PHP)                            │
├─────────────────────────────────────────────────────────────┤
│ Controllers:                                                │
│ ├─ ChoferAvailabilityController                            │
│ │  ├─ checkAvailability($fechaId, $chofer_id)            │
│ │  ├─ getWorkingHours()                                  │
│ │  └─ isHoliday($fecha)                                  │
│                                                             │
│ Models & Services:                                         │
│ ├─ Festivo (Model + Migration)                           │
│ ├─ HorarioOperacion (Model + Migration)                 │
│ ├─ Empleado (Enhanced with methods)                       │
│ └─ AvailabilityService                                   │
│                                                             │
│ Routes:                                                    │
│ ├─ GET /api/chofer/{id}/availability/{fecha}           │
│ ├─ GET /api/horarios-operacion                           │
│ └─ GET /api/festivos/{fecha}                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                         │
├─────────────────────────────────────────────────────────────┤
│ festivos (Tabla nueva)                                      │
│ horarios_operacion (Tabla nueva)                           │
│ empleados (Tabla existente - se integra)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. MODELOS Y MIGRACIONES

### 2.1 Modelo: Festivo

**Archivo:** `app/Models/Festivo.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para gestionar días festivos y no laborables
 *
 * Soporta:
 * - Festivos fijos (ej: 25 de diciembre siempre es Navidad)
 * - Festivos variables (ej: Lunes de Pascua)
 * - Días no laborables por la empresa
 */
class Festivo extends Model
{
    protected $table = 'festivos';
    protected $fillable = [
        'fecha',           // YYYY-MM-DD
        'nombre',          // Ej: "Navidad", "Año Nuevo"
        'tipo',            // 'NACIONAL' | 'EMPRESA' | 'REGIONAL'
        'es_fijo',         // true = recurrente cada año, false = único
        'mes',             // Para festivos fijos: mes (1-12)
        'dia',             // Para festivos fijos: día (1-31)
        'descripcion',     // Descripción opcional
        'activo',          // Si está vigente
    ];

    protected $dates = ['fecha'];
    protected $casts = [
        'es_fijo' => 'boolean',
        'activo' => 'boolean',
    ];

    /**
     * Scope: obtener festivos activos
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Scope: obtener festivos para una fecha específica
     */
    public function scopeParaFecha($query, string $fecha)
    {
        $date = \Carbon\Carbon::parse($fecha);

        return $query->activos()
            ->where(function($q) use ($date) {
                // Festivos fijos (recurrentes cada año)
                $q->where([
                    ['es_fijo', true],
                    ['mes', $date->month],
                    ['dia', $date->day],
                ])
                // O festivos específicos para esa fecha
                ->orWhere('fecha', $date->format('Y-m-d'));
            });
    }

    /**
     * Verificar si una fecha es festivo
     */
    public static function esFestivo(string $fecha): bool
    {
        return self::paraFecha($fecha)->exists();
    }

    /**
     * Obtener información del festivo para una fecha
     */
    public static function obtenerFestivo(string $fecha)
    {
        return self::paraFecha($fecha)->first();
    }
}
```

**Migración:** `database/migrations/[timestamp]_create_festivos_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('festivos', function (Blueprint $table) {
            $table->id();

            // Fecha del festivo
            $table->date('fecha')->unique()->nullable(); // NULL si es fijo

            // Información
            $table->string('nombre'); // Ej: "Navidad"
            $table->string('tipo')->default('NACIONAL'); // NACIONAL | EMPRESA | REGIONAL
            $table->text('descripcion')->nullable();

            // Control de recurrencia
            $table->boolean('es_fijo')->default(false);
            $table->unsignedSmallInteger('mes')->nullable(); // 1-12
            $table->unsignedSmallInteger('dia')->nullable(); // 1-31

            // Estado
            $table->boolean('activo')->default(true);

            // Timestamps
            $table->timestamps();

            // Índices
            $table->index('fecha');
            $table->index('mes');
            $table->index('dia');
            $table->index(['es_fijo', 'mes', 'dia']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('festivos');
    }
};
```

---

### 2.2 Modelo: HorarioOperacion

**Archivo:** `app/Models/HorarioOperacion.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo para gestionar horarios de operación
 *
 * Soporta:
 * - Horarios de la empresa (empresa_id = null)
 * - Horarios por chofer
 * - Diferentes horarios para diferentes días de la semana
 */
class HorarioOperacion extends Model
{
    protected $table = 'horarios_operacion';
    protected $fillable = [
        'empleado_id',      // NULL = horario de empresa
        'dia_semana',       // 0=Domingo, 1=Lunes, ..., 6=Sábado
        'hora_inicio',      // HH:mm (formato 24 horas)
        'hora_fin',         // HH:mm (formato 24 horas)
        'incluir_almuerzo',    // true = hay break de almuerzo
        'hora_almuerzo_inicio',// HH:mm
        'hora_almuerzo_fin',   // HH:mm
        'activo',
    ];

    protected $casts = [
        'incluir_almuerzo' => 'boolean',
        'activo' => 'boolean',
    ];

    /**
     * Relación con Empleado (chofer)
     */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    /**
     * Scope: horarios de la empresa (sin empleado_id)
     */
    public function scopeDelEmpresa($query)
    {
        return $query->whereNull('empleado_id');
    }

    /**
     * Scope: horarios para un chofer específico
     */
    public function scopeDelChofer($query, int $empleadoId)
    {
        return $query->where('empleado_id', $empleadoId);
    }

    /**
     * Scope: horarios para un día específico
     */
    public function scopeParaDia($query, int $diaSemana)
    {
        return $query->where('dia_semana', $diaSemana)
                     ->where('activo', true);
    }

    /**
     * Obtener horario para un día específico
     * Prioridad: horario del chofer > horario de empresa
     */
    public static function obtenerHorario(int $empleadoId, int $diaSemana)
    {
        // Intentar obtener horario del chofer
        $horario = self::delChofer($empleadoId)
                      ->paraDia($diaSemana)
                      ->first();

        // Si no existe, obtener horario de la empresa
        if (!$horario) {
            $horario = self::delEmpresa()
                          ->paraDia($diaSemana)
                          ->first();
        }

        return $horario;
    }

    /**
     * Verificar si una hora está dentro del horario de operación
     */
    public function estaEnHorario(string $hora): bool
    {
        // Formato: HH:mm
        if ($this->incluir_almuerzo) {
            return ($hora >= $this->hora_inicio && $hora < $this->hora_almuerzo_inicio) ||
                   ($hora >= $this->hora_almuerzo_fin && $hora < $this->hora_fin);
        }

        return $hora >= $this->hora_inicio && $hora < $this->hora_fin;
    }
}
```

**Migración:** `database/migrations/[timestamp]_create_horarios_operacion_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios_operacion', function (Blueprint $table) {
            $table->id();

            // Relación con empleado (NULL = horario de empresa)
            $table->foreignId('empleado_id')
                  ->nullable()
                  ->constrained('empleados')
                  ->onDelete('cascade');

            // Día de la semana
            $table->unsignedSmallInteger('dia_semana'); // 0-6

            // Horarios
            $table->time('hora_inicio');    // HH:mm
            $table->time('hora_fin');       // HH:mm

            // Almuerzo (opcional)
            $table->boolean('incluir_almuerzo')->default(false);
            $table->time('hora_almuerzo_inicio')->nullable();
            $table->time('hora_almuerzo_fin')->nullable();

            // Estado
            $table->boolean('activo')->default(true);

            // Timestamps
            $table->timestamps();

            // Índices
            $table->index('empleado_id');
            $table->index('dia_semana');
            $table->index(['empleado_id', 'dia_semana']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horarios_operacion');
    }
};
```

---

## 3. SERVICIOS (Backend)

### 3.1 AvailabilityService

**Archivo:** `app/Services/Logistica/AvailabilityService.php`

```php
<?php

namespace App\Services\Logistica;

use App\Models\Empleado;
use App\Models\Vehiculo;
use App\Models\Festivo;
use App\Models\HorarioOperacion;
use Carbon\Carbon;

/**
 * Servicio centralizado para validar disponibilidad
 * Consulta: chofer disponible, horarios, festivos, etc.
 */
class AvailabilityService
{
    /**
     * Validación completa de disponibilidad
     */
    public function esDisponible(
        int $choferId,
        string $fecha,
        string $hora = '09:00'
    ): array {
        $chofer = Empleado::findOrFail($choferId);
        $fechaCarbon = Carbon::parse($fecha);

        $resultados = [
            'disponible' => true,
            'errores' => [],
            'advertencias' => [],
        ];

        // 1. Validar que el chofer existe y está activo
        if ($chofer->estado !== 'activo') {
            $resultados['disponible'] = false;
            $resultados['errores'][] = "El chofer no está activo (Estado: {$chofer->estado})";
        }

        // 2. Validar licencia vigente
        if (!$chofer->tieneLicenciaVigente()) {
            $resultados['disponible'] = false;
            $resultados['errores'][] = "La licencia del chofer ha expirado";
        }

        // 3. Validar que no es domingo (ya se hace en frontend, pero doble validación)
        if ($fechaCarbon->dayOfWeek === 0) {
            $resultados['disponible'] = false;
            $resultados['errores'][] = "No se pueden programar entregas para domingo";
        }

        // 4. Validar festivo
        if (Festivo::esFestivo($fecha)) {
            $festivo = Festivo::obtenerFestivo($fecha);
            $resultados['disponible'] = false;
            $resultados['errores'][] = "No se puede entregar en {$festivo->nombre} (Festivo)";
        }

        // 5. Validar horarios de operación
        $horarioValido = $this->validarHorario($choferId, $fechaCarbon, $hora);
        if (!$horarioValido['valido']) {
            $resultados['disponible'] = false;
            $resultados['errores'][] = $horarioValido['mensaje'];
        }

        // 6. Validar que no tiene ruta activa en esa fecha
        if (!$chofer->estaDisponiblePara($fecha)) {
            $resultados['disponible'] = false;
            $resultados['errores'][] = "El chofer ya tiene ruta asignada para esta fecha";
        }

        return $resultados;
    }

    /**
     * Validar si la hora está dentro de horarios de operación
     */
    private function validarHorario(
        int $choferId,
        Carbon $fecha,
        string $hora
    ): array {
        $horario = HorarioOperacion::obtenerHorario(
            $choferId,
            $fecha->dayOfWeek
        );

        if (!$horario) {
            return [
                'valido' => false,
                'mensaje' => "No hay horario definido para este día de la semana"
            ];
        }

        if (!$horario->estaEnHorario($hora)) {
            $mensaje = "La hora {$hora} está fuera del horario de operación ({$horario->hora_inicio} - {$horario->hora_fin})";
            if ($horario->incluir_almuerzo) {
                $mensaje .= " (Almuerzo: {$horario->hora_almuerzo_inicio} - {$horario->hora_almuerzo_fin})";
            }
            return ['valido' => false, 'mensaje' => $mensaje];
        }

        return ['valido' => true, 'mensaje' => 'OK'];
    }

    /**
     * Obtener horarios de operación para un chofer
     */
    public function obtenerHorarios(int $choferId): array
    {
        $horarios = [];

        for ($dia = 0; $dia < 7; $dia++) {
            $horario = HorarioOperacion::obtenerHorario($choferId, $dia);

            $dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

            if ($horario) {
                $horarios[$dias[$dia]] = [
                    'inicio' => $horario->hora_inicio,
                    'fin' => $horario->hora_fin,
                    'almuerzo' => $horario->incluir_almuerzo ? [
                        'inicio' => $horario->hora_almuerzo_inicio,
                        'fin' => $horario->hora_almuerzo_fin,
                    ] : null,
                ];
            }
        }

        return $horarios;
    }

    /**
     * Obtener próximo día disponible a partir de una fecha
     */
    public function obtenerProximoDiaDisponible(
        int $choferId,
        string $fechaInicio = null
    ): ?string {
        $fecha = Carbon::parse($fechaInicio ?? now())->startOfDay();

        // Buscar en los próximos 30 días
        for ($i = 0; $i < 30; $i++) {
            $fechaActual = $fecha->copy()->addDays($i);

            // Saltar domingos
            if ($fechaActual->dayOfWeek === 0) continue;

            // Saltar festivos
            if (Festivo::esFestivo($fechaActual->format('Y-m-d'))) continue;

            // Verificar disponibilidad del chofer
            if ($this->esDisponible($choferId, $fechaActual->format('Y-m-d'))['disponible']) {
                return $fechaActual->format('Y-m-d');
            }
        }

        return null;
    }
}
```

---

## 4. CONTROLLERS (Backend)

### 4.1 ChoferAvailabilityController

**Archivo:** `app/Http/Controllers/Api/ChoferAvailabilityController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Logistica\AvailabilityService;
use App\Models\Festivo;
use Illuminate\Http\Request;

/**
 * API endpoints para consultar disponibilidad
 */
class ChoferAvailabilityController extends Controller
{
    protected AvailabilityService $availabilityService;

    public function __construct(AvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    /**
     * GET /api/chofer/{id}/availability/{fecha}?hora=09:00
     *
     * Verificar disponibilidad de chofer para una fecha/hora específica
     */
    public function checkAvailability(int $id, string $fecha, Request $request)
    {
        $request->validate([
            'hora' => 'nullable|date_format:H:i',
        ]);

        $hora = $request->query('hora', '09:00');

        $resultado = $this->availabilityService->esDisponible($id, $fecha, $hora);

        return response()->json($resultado);
    }

    /**
     * GET /api/chofer/{id}/horarios
     *
     * Obtener horarios de operación para un chofer
     */
    public function getHorarios(int $id)
    {
        $horarios = $this->availabilityService->obtenerHorarios($id);

        return response()->json([
            'chofer_id' => $id,
            'horarios' => $horarios,
        ]);
    }

    /**
     * GET /api/chofer/{id}/proximo-dia-disponible?desde=2025-12-25
     *
     * Obtener próximo día disponible para un chofer
     */
    public function proximoDiaDisponible(int $id, Request $request)
    {
        $desde = $request->query('desde');

        $proximoDia = $this->availabilityService->obtenerProximoDiaDisponible(
            $id,
            $desde
        );

        return response()->json([
            'chofer_id' => $id,
            'proximo_dia_disponible' => $proximoDia,
        ]);
    }

    /**
     * GET /api/festivos?fecha=2025-12-25
     *
     * Verificar si una fecha es festivo
     */
    public function verificarFestivo(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date_format:Y-m-d',
        ]);

        $fecha = $request->query('fecha');
        $festivo = Festivo::obtenerFestivo($fecha);

        return response()->json([
            'es_festivo' => $festivo !== null,
            'festivo' => $festivo,
        ]);
    }

    /**
     * GET /api/festivos
     *
     * Listar todos los festivos activos del año
     */
    public function listarFestivos()
    {
        $festivos = Festivo::activos()
                          ->orderBy('fecha')
                          ->get();

        return response()->json(['festivos' => $festivos]);
    }
}
```

---

## 5. RUTAS (Routes)

**Archivo:** `routes/api.php` (agregar estas rutas)

```php
// Disponibilidad de choferes
Route::prefix('chofer')->group(function () {
    Route::get('{id}/availability/{fecha}', 'Api\ChoferAvailabilityController@checkAvailability');
    Route::get('{id}/horarios', 'Api\ChoferAvailabilityController@getHorarios');
    Route::get('{id}/proximo-dia-disponible', 'Api\ChoferAvailabilityController@proximoDiaDisponible');
});

// Festivos
Route::prefix('festivos')->group(function () {
    Route::get('/', 'Api\ChoferAvailabilityController@listarFestivos');
    Route::get('verificar', 'Api\ChoferAvailabilityController@verificarFestivo');
});
```

---

## 6. FRONTEND - SERVICES

### 6.1 AvailabilityService (Frontend)

**Archivo:** `resources/js/infrastructure/services/availability.service.ts`

```typescript
import type { Id } from '@/domain/entities/shared';

export interface AvailabilityCheckResponse {
    disponible: boolean;
    errores: string[];
    advertencias: string[];
}

export interface HorarioInfo {
    inicio: string;
    fin: string;
    almuerzo: {
        inicio: string;
        fin: string;
    } | null;
}

export interface HorariosResponse {
    chofer_id: Id;
    horarios: Record<string, HorarioInfo>;
}

export interface FestivoInfo {
    id: number;
    fecha: string;
    nombre: string;
    tipo: string;
    descripcion?: string;
}

export interface FestivoCheckResponse {
    es_festivo: boolean;
    festivo: FestivoInfo | null;
}

/**
 * Servicio para consultar disponibilidad, horarios y festivos
 */
export const availabilityService = {
    /**
     * Verificar disponibilidad de chofer para fecha/hora
     */
    checkAvailability: async (
        choferId: Id,
        fecha: string,
        hora: string = '09:00'
    ): Promise<AvailabilityCheckResponse> => {
        const response = await fetch(
            `/api/chofer/${choferId}/availability/${fecha}?hora=${hora}`
        );

        if (!response.ok) {
            throw new Error('Error checking availability');
        }

        return response.json();
    },

    /**
     * Obtener horarios de operación para un chofer
     */
    getHorarios: async (choferId: Id): Promise<HorariosResponse> => {
        const response = await fetch(`/api/chofer/${choferId}/horarios`);

        if (!response.ok) {
            throw new Error('Error fetching horarios');
        }

        return response.json();
    },

    /**
     * Obtener próximo día disponible para un chofer
     */
    getProximoDiaDisponible: async (
        choferId: Id,
        desde?: string
    ): Promise<{ proximo_dia_disponible: string | null }> => {
        const params = new URLSearchParams();
        if (desde) params.append('desde', desde);

        const response = await fetch(
            `/api/chofer/${choferId}/proximo-dia-disponible?${params}`
        );

        if (!response.ok) {
            throw new Error('Error fetching próximo día disponible');
        }

        return response.json();
    },

    /**
     * Verificar si una fecha es festivo
     */
    verificarFestivo: async (fecha: string): Promise<FestivoCheckResponse> => {
        const response = await fetch(
            `/api/festivos/verificar?fecha=${fecha}`
        );

        if (!response.ok) {
            throw new Error('Error checking festivo');
        }

        return response.json();
    },

    /**
     * Listar todos los festivos del año
     */
    listarFestivos: async (): Promise<{ festivos: FestivoInfo[] }> => {
        const response = await fetch('/api/festivos');

        if (!response.ok) {
            throw new Error('Error fetching festivos');
        }

        return response.json();
    },
};
```

---

## 7. FRONTEND - HOOK ACTUALIZADO

### 7.1 use-simple-entrega-form.ts (Nivel 3)

**Archivo:** `resources/js/application/hooks/use-simple-entrega-form.ts` (actualizar)

```typescript
// Agregar estas importaciones
import { availabilityService } from '@/infrastructure/services/availability.service';
import { useState, useCallback } from 'react';

// En el hook, agregar nuevo estado
const [availabilityErrors, setAvailabilityErrors] = useState<Record<string, string>>({});
const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

// Agregar función para validar disponibilidad del chofer
const checkChoferAvailability = useCallback(async (
    choferId: Id | undefined,
    fechaProgramada: string
) => {
    if (!choferId || !fechaProgramada) return;

    setIsCheckingAvailability(true);
    try {
        const [fecha, hora] = fechaProgramada.split('T');
        const result = await availabilityService.checkAvailability(
            choferId,
            fecha,
            hora || '09:00'
        );

        if (!result.disponible) {
            setAvailabilityErrors({
                chofer: result.errores.join('; '),
            });
        } else {
            setAvailabilityErrors({});
        }
    } catch (error) {
        console.error('Error checking chofer availability:', error);
        setAvailabilityErrors({
            chofer: 'Error al verificar disponibilidad del chofer',
        });
    } finally {
        setIsCheckingAvailability(false);
    }
}, []);

// Actualizar handleChoferSelect para validar disponibilidad
const handleChoferSelect = (value: Id | '') => {
    handleFieldChange('chofer_id', value || undefined);

    // Validar disponibilidad del chofer si se selecciona uno
    if (value && formData.fecha_programada) {
        checkChoferAvailability(value, formData.fecha_programada);
    }
};

// Actualizar handleFieldChange para validar cuando cambia la fecha
const handleFieldChange = (field: keyof EntregaFormData, value: any) => {
    setFormData((prev) => ({
        ...prev,
        [field]: value,
    }));

    // Si cambia la fecha y hay chofer seleccionado, revalidar
    if (field === 'fecha_programada' && formData.chofer_id && value) {
        checkChoferAvailability(formData.chofer_id, value);
    }

    // Limpiar error del campo cuando el usuario edita
    if (errors[field]) {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }
};

// Actualizar isFormValid para incluir validaciones de disponibilidad
const isFormValid = useMemo(() => {
    return (
        !!formData.vehiculo_id &&
        !!formData.chofer_id &&
        !!formData.fecha_programada &&
        !!formData.direccion_entrega?.trim() &&
        !capacidadInsuficiente &&
        !availabilityErrors.chofer // Agregar esta validación
    );
}, [formData, capacidadInsuficiente, availabilityErrors]);

// Actualizar el return para incluir nuevos estados
return {
    // ... estados previos ...
    availabilityErrors,
    isCheckingAvailability,
    checkChoferAvailability,
    // ...
};
```

---

## 8. FRONTEND - COMPONENTE ACTUALIZADO

### 8.1 SimpleEntregaForm.tsx (Nivel 3)

**Archivo:** `resources/js/presentation/pages/logistica/entregas/components/SimpleEntregaForm.tsx` (actualizar)

```typescript
// Destructurar nuevos valores del hook
const {
    // ... valores previos ...
    availabilityErrors,
    isCheckingAvailability,
} = useSimpleEntregaForm(venta, vehiculos, choferes);

// Agregar advertencia de disponibilidad si hay errores
{availabilityErrors.chofer && (
    <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Advertencia de disponibilidad</p>
            <p className="text-xs mt-1">{availabilityErrors.chofer}</p>
        </div>
    </div>
)}

// Agregar loading state en botón
<Button
    type="submit"
    disabled={isLoading || !isFormValid || isCheckingAvailability}
    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400..."
>
    {isLoading ? 'Creando entrega...' : (isCheckingAvailability ? 'Verificando disponibilidad...' : 'Crear Entrega')}
</Button>
```

---

## 9. DATOS DE SEED (Iniciales)

### 9.1 Seed para Festivos

**Archivo:** `database/seeders/FestivosSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\Festivo;
use Illuminate\Database\Seeder;

class FestivosSeeder extends Seeder
{
    public function run(): void
    {
        $festivos = [
            // Festivos fijos nacionales
            ['nombre' => 'Año Nuevo', 'tipo' => 'NACIONAL', 'es_fijo' => true, 'mes' => 1, 'dia' => 1],
            ['nombre' => 'Día del Trabajador', 'tipo' => 'NACIONAL', 'es_fijo' => true, 'mes' => 5, 'dia' => 1],
            ['nombre' => 'Día de la Independencia', 'tipo' => 'NACIONAL', 'es_fijo' => true, 'mes' => 8, 'dia' => 6],
            ['nombre' => 'Navidad', 'tipo' => 'NACIONAL', 'es_fijo' => true, 'mes' => 12, 'dia' => 25],

            // Ejemplos de festivos específicos de año
            ['nombre' => 'Año Nuevo 2026', 'tipo' => 'NACIONAL', 'es_fijo' => false, 'fecha' => '2026-01-01'],
        ];

        foreach ($festivos as $festivo) {
            Festivo::create(array_merge($festivo, ['activo' => true]));
        }
    }
}
```

### 9.2 Seed para Horarios de Operación

**Archivo:** `database/seeders/HorariosOperacionSeeder.php`

```php
<?php

namespace Database\Seeders;

use App\Models\HorarioOperacion;
use Illuminate\Database\Seeder;

class HorariosOperacionSeeder extends Seeder
{
    public function run(): void
    {
        // Horarios de la empresa (empleado_id = null)
        $horariosEmpresa = [
            // Lunes a Viernes
            ['dia_semana' => 1, 'hora_inicio' => '08:00', 'hora_fin' => '18:00', 'incluir_almuerzo' => true, 'hora_almuerzo_inicio' => '12:00', 'hora_almuerzo_fin' => '13:00'],
            ['dia_semana' => 2, 'hora_inicio' => '08:00', 'hora_fin' => '18:00', 'incluir_almuerzo' => true, 'hora_almuerzo_inicio' => '12:00', 'hora_almuerzo_fin' => '13:00'],
            ['dia_semana' => 3, 'hora_inicio' => '08:00', 'hora_fin' => '18:00', 'incluir_almuerzo' => true, 'hora_almuerzo_inicio' => '12:00', 'hora_almuerzo_fin' => '13:00'],
            ['dia_semana' => 4, 'hora_inicio' => '08:00', 'hora_fin' => '18:00', 'incluir_almuerzo' => true, 'hora_almuerzo_inicio' => '12:00', 'hora_almuerzo_fin' => '13:00'],
            ['dia_semana' => 5, 'hora_inicio' => '08:00', 'hora_fin' => '18:00', 'incluir_almuerzo' => true, 'hora_almuerzo_inicio' => '12:00', 'hora_almuerzo_fin' => '13:00'],
            // Sábado (horario reducido)
            ['dia_semana' => 6, 'hora_inicio' => '08:00', 'hora_fin' => '14:00', 'incluir_almuerzo' => false],
            // Domingo (cerrado)
            // No se agrega entrada para dia_semana = 0
        ];

        foreach ($horariosEmpresa as $horario) {
            HorarioOperacion::create(array_merge(
                $horario,
                ['empleado_id' => null, 'activo' => true]
            ));
        }
    }
}
```

---

## 10. CHECKLIST DE IMPLEMENTACIÓN

- [ ] **Backend**
  - [ ] Crear modelo `Festivo` y migración
  - [ ] Crear modelo `HorarioOperacion` y migración
  - [ ] Crear `AvailabilityService`
  - [ ] Crear `ChoferAvailabilityController`
  - [ ] Agregar rutas en `routes/api.php`
  - [ ] Ejecutar migraciones
  - [ ] Crear y ejecutar seeders de festivos y horarios
  - [ ] Probar endpoints con Postman/Insomnia

- [ ] **Frontend**
  - [ ] Crear `availability.service.ts`
  - [ ] Actualizar `use-simple-entrega-form.ts` con validaciones
  - [ ] Actualizar `SimpleEntregaForm.tsx` para mostrar errores
  - [ ] Agregar loading state en UI
  - [ ] Probar en navegador

- [ ] **Testing**
  - [ ] Ejecutar `npm run types` (verificar tipos)
  - [ ] Verificar que no hay errores de compilación
  - [ ] Probar flujo completo end-to-end
  - [ ] Validar respuestas del API

---

## 11. NOTAS Y CONSIDERACIONES

### Performance
- Cachear horarios de operación en Redis si es necesario
- Usar índices en fechas para consultas rápidas de festivos

### Seguridad
- Validar permisos: solo admin puede crear/editar festivos y horarios
- Usar policy de Laravel para autorización

### UX
- Mostrar próximos días disponibles si la fecha seleccionada no es válida
- Permitir que admin agregue festivos desde la UI (crear CRUD)
- Mostrar horarios disponibles en el selector de hora

### Futuras Mejoras
- Diferente configuración de horarios por zona
- Horarios especiales para épocas de alta demanda
- Integración con calendario de eventos externos
- Notificaciones cuando chofer es asignado fuera de horario

---

## 12. REFERENCIAS Y EJEMPLOS

### Ejemplo de Respuesta del API

```json
{
  "disponible": false,
  "errores": [
    "La licencia del chofer ha expirado",
    "El 25 de diciembre es Navidad (Festivo)"
  ],
  "advertencias": []
}
```

### Horarios Ejemplo

```json
{
  "chofer_id": 5,
  "horarios": {
    "Lunes": {
      "inicio": "08:00",
      "fin": "18:00",
      "almuerzo": {
        "inicio": "12:00",
        "fin": "13:00"
      }
    },
    "Sábado": {
      "inicio": "08:00",
      "fin": "14:00",
      "almuerzo": null
    }
  }
}
```

---

**Documento creado:** 2025-12-22
**Versión:** 1.0
**Estado:** Listo para implementación
