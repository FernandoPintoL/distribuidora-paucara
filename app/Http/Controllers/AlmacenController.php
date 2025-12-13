<?php

namespace App\Http\Controllers;

use App\Http\Traits\SimpleCrudController;
use App\Models\Almacen;

/**
 * AlmacenController - CRUD de Almacenes
 *
 * ✅ CONSOLIDADO: Usa SimpleCrudController trait
 * Reducción: ~80 líneas → 50 líneas (-37%)
 */
class AlmacenController extends Controller
{
    use SimpleCrudController;

    protected function getModel(): string
    {
        return Almacen::class;
    }

    protected function getRouteName(): string
    {
        return 'almacenes';
    }

    protected function getViewPath(): string
    {
        return 'almacenes';
    }

    protected function getResourceName(): string
    {
        return 'almacenes';
    }

    protected function getValidationRules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'responsable' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'activo' => ['boolean'],
        ];
    }
}
