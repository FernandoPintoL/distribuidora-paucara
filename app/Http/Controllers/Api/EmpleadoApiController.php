<?php
namespace App\Http\Controllers\Api;

use App\Enums\TipoEmpleado;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EmpleadoApiController extends Controller
{
    /**
     * Determina el rol funcional basado en un cargo
     */
    public function determinarRol(Request $request)
    {
        $request->validate([
            'cargo' => 'required|string|max:100',
        ]);

        $cargo = $request->input('cargo');
        $rol   = TipoEmpleado::determinarRolPorCargo($cargo);

        return response()->json([
            'cargo'                    => $cargo,
            'rol'                      => $rol,
            'tiene_campos_adicionales' => TipoEmpleado::requiereCamposAdicionales($rol),
        ]);
    }
}
