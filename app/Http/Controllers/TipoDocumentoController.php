<?php

namespace App\Http\Controllers;

use App\Http\Traits\SimpleCrudController;
use App\Models\TipoDocumento;
use Illuminate\Http\Request;

class TipoDocumentoController extends Controller
{
    use SimpleCrudController;

    public function getModel(): string
    {
        return TipoDocumento::class;
    }

    public function getRouteName(): string
    {
        return 'tipos-documento';
    }

    public function getViewPath(): string
    {
        return 'tipos-documento.index';
    }

    public function getResourceName(): string
    {
        return 'tipoDocumento';
    }

    public function getValidationRules(): array
    {
        return [
            'codigo' => 'required|string|max:10|unique:tipos_documento,codigo,' . ($this->getModel() ?? 0),
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string|max:255',
            'genera_inventario' => 'sometimes|boolean',
            'requiere_autorizacion' => 'sometimes|boolean',
            'formato_numeracion' => 'nullable|string|max:50',
            'siguiente_numero' => 'nullable|integer|min:1',
            'activo' => 'sometimes|boolean',
        ];
    }

    public function index()
    {
        $modelClass = $this->getModel();
        $q = request()->string('q');

        // Construir query con búsqueda opcional
        $items = $modelClass::query()
            ->when($q, function ($query) use ($q) {
                return $query->where('codigo', 'like', "%{$q}%")
                           ->orWhere('nombre', 'like', "%{$q}%")
                           ->orWhere('descripcion', 'like', "%{$q}%");
            })
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        return inertia($this->getViewPath() . '/index', [
            $this->getResourceName() => $items,
            'filters' => ['q' => $q],
        ]);
    }
}
