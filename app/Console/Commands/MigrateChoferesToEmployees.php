<?php
namespace App\Console\Commands;

use App\Models\Chofer;
use App\Models\Empleado;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class MigrateChoferesToEmployees extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-choferes-to-employees';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrar los datos de choferes a la tabla empleados con el rol Chofer';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando migración de choferes a empleados...');

        // Verificar si existe el rol Chofer
        $choferRole = Role::where('name', 'Chofer')->first();
        if (! $choferRole) {
            $this->info('Creando rol Chofer...');
            $choferRole = Role::create(['name' => 'Chofer', 'guard_name' => 'web']);
        }

        // Obtener todos los choferes
        $choferes = Chofer::with('user')->get();
        $this->info("Se encontraron {$choferes->count()} choferes para migrar.");

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($choferes as $chofer) {
                $user = $chofer->user;

                if (! $user) {
                    $this->warn("Chofer ID {$chofer->id} no tiene usuario asociado. Creando uno...");
                    // Crear un usuario para el chofer si no existe
                    $user = User::create([
                        'name' => "Chofer {$chofer->id}",
                        'usernick' => "chofer{$chofer->id}",
                        'email' => "chofer{$chofer->id}@example.com", // Email temporal
                        'password' => bcrypt('password123'),          // Contraseña temporal
                        'activo'   => $chofer->activo,
                    ]);
                }

                // Buscar si este usuario ya tiene un empleado asociado
                $empleado = Empleado::where('user_id', $user->id)->first();

                if ($empleado) {
                    $this->info("Actualizando empleado existente para chofer {$chofer->id}...");
                    // Actualizar el empleado con los datos de chofer
                    $empleado->update([
                        'licencia'                   => $chofer->licencia,
                        'fecha_vencimiento_licencia' => $chofer->fecha_vencimiento_licencia,
                        'estado'                     => $chofer->activo ? 'activo' : 'inactivo',
                        'telefono'                   => $chofer->telefono ?: $empleado->telefono,
                        'observaciones'              => $empleado->observaciones
                            ? $empleado->observaciones . "\n\nDatos migrados desde Chofer ID {$chofer->id}"
                            : "Datos migrados desde Chofer ID {$chofer->id}",
                        'datos_rol' => array_merge($empleado->datos_rol ?: [], [
                            'chofer_original_id'   => $chofer->id,
                            'observaciones_chofer' => $chofer->observaciones,
                        ])
                    ]);
                } else {
                    $this->info("Creando nuevo empleado para chofer {$chofer->id}...");
                    // Crear un nuevo empleado con los datos del chofer
                    $empleado = Empleado::create([
                        'user_id'                    => $user->id,
                        'codigo_empleado'            => 'CH' . str_pad($chofer->id, 4, '0', STR_PAD_LEFT),
                        'licencia'                   => $chofer->licencia,
                        'fecha_vencimiento_licencia' => $chofer->fecha_vencimiento_licencia,
                        'telefono'                   => $chofer->telefono,
                        'cargo'                      => 'Chofer',
                        'departamento'               => 'Logística',
                        'estado'                     => $chofer->activo ? 'activo' : 'inactivo',
                        'puede_acceder_sistema'      => true,
                        'fecha_ingreso'              => now(),
                        'tipo_contrato'              => 'indefinido',
                        'observaciones'              => "Datos migrados desde Chofer ID {$chofer->id}",
                        'datos_rol' => [
                            'chofer_original_id'   => $chofer->id,
                            'observaciones_chofer' => $chofer->observaciones,
                        ],
                    ]);
                }

                // Asignar rol de Chofer al usuario
                if (! $user->hasRole('Chofer')) {
                    $user->assignRole('Chofer');
                }

                $count++;
            }

            DB::commit();
            $this->info("Migración completada. {$count} choferes migrados exitosamente.");

            // Preguntar si se quiere eliminar la tabla de choferes
            if ($this->confirm('¿Desea eliminar la tabla de choferes? Esta acción no se puede deshacer.', false)) {
                $this->warn('Esta funcionalidad es solo para ejemplo y no se implementará aquí para evitar pérdida de datos.');
                $this->warn('Para eliminar la tabla de choferes, cree una migración específica después de validar que todo funcione correctamente.');
            }

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Error durante la migración: {$e->getMessage()}");
            $this->error($e->getTraceAsString());
        }
    }
}
