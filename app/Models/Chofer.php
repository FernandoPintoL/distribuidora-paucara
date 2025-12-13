<?php
namespace App\Models;

use App\Models\Traits\HasActiveScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chofer extends Model
{
    use HasFactory, HasActiveScope;
    protected $table = "choferes_legacy";

    protected $fillable = [
        'user_id',
        'licencia',
        'telefono',
        'fecha_vencimiento_licencia',
        'activo',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_vencimiento_licencia' => 'date',
            'activo'                     => 'boolean',
        ];
    }

    /**
     * Usuario asociado al chofer
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Transferencias asignadas a este chofer
     */
    public function transferencias(): HasMany
    {
        return $this->hasMany(TransferenciaInventario::class);
    }

    /**
     * Entregas asignadas a este chofer
     */
    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class);
    }

    /**
     * Verificar si la licencia está vigente
     */
    public function licenciaVigente(): bool
    {
        return $this->fecha_vencimiento_licencia &&
        $this->fecha_vencimiento_licencia->isFuture();
    }

    /**
     * Choferes activos
     */
}
