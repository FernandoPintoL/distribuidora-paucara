<?php

namespace App\Models\Traits;

/**
 * HasActiveScope Trait - ÚNICA FUENTE DE VERDAD para scopes de estado activo
 *
 * Consolida el patrón repetido en 13+ modelos.
 * Proporciona scopes estándar para filtrar registros activos/inactivos.
 *
 * MODELOS QUE USAN ESTE TRAIT:
 * - Chofer, CodigoBarra, ConfiguracionGlobal, Empleado, Impuesto
 * - ModuloSidebar, PrecioProducto, Producto, TipoAjusteInventario
 * - TipoDocumento, TipoOperacion, TipoPrecio, Vehiculo
 *
 * USO:
 * ```php
 * use HasActiveScope;
 *
 * $modelos = Modelo::activos()->get();
 * $inactivos = Modelo::inactivos()->get();
 * ```
 */
trait HasActiveScope
{
    /**
     * Obtener el nombre del campo activo (soporta 'activo' y 'activa')
     * Detecta automáticamente el campo correcto
     */
    protected function getActiveField(): string
    {
        // Detectar dinámicamente si el campo es 'activa' o 'activo'
        if (in_array('activa', $this->getFillable())) {
            return 'activa';
        }
        return 'activo';
    }

    /**
     * Scope para obtener solo registros activos
     * Soporta campos: activo, activa
     *
     * Uso: Model::activos()->get()
     */
    public function scopeActivos($query)
    {
        $field = $this->getActiveField();
        return $query->where($this->getTable() . '.' . $field, true);
    }

    /**
     * Scope para obtener solo registros inactivos
     *
     * Uso: Model::inactivos()->get()
     */
    public function scopeInactivos($query)
    {
        $field = $this->getActiveField();
        return $query->where($this->getTable() . '.' . $field, false);
    }

    /**
     * Alias para scopeActivos (compatibilidad con campo 'activa')
     */
    public function scopeActivas($query)
    {
        $field = $this->getActiveField();
        return $query->where($this->getTable() . '.' . $field, true);
    }

    /**
     * Scope alternativo (alias de activos para compatibilidad)
     * Algunos modelos pueden usar 'estado' en lugar de 'activo'
     *
     * Uso: Model::donde_estado_es('activo')->get()
     */
    public function scopeConEstatoActivo($query)
    {
        return $this->scopeActivos($query);
    }

    /**
     * Verificar si el modelo está activo
     */
    public function estaActivo(): bool
    {
        return $this->activo === true;
    }

    /**
     * Verificar si el modelo está inactivo
     */
    public function estaInactivo(): bool
    {
        return $this->activo === false;
    }

    /**
     * Activar modelo
     */
    public function activar(): bool
    {
        $this->activo = true;
        return $this->save();
    }

    /**
     * Desactivar modelo
     */
    public function desactivar(): bool
    {
        $this->activo = false;
        return $this->save();
    }

    /**
     * Alternar estado activo/inactivo
     */
    public function alternarEstado(): bool
    {
        $this->activo = !$this->activo;
        return $this->save();
    }
}
