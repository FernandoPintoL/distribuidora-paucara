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
        $query = $this->getModel()::query();

        if (request('search')) {
            $search = request('search');
            $query->where('codigo', 'like', "%{$search}%")
                  ->orWhere('nombre', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%");
        }

        $items = $query->paginate(10);

        return view($this->getViewPath(), [
            $this->getResourceName() => $items,
            'filters' => request()->all(),
        ]);
    }
}
