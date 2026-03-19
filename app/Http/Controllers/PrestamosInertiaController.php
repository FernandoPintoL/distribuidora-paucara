<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Proveedor;
use App\Models\Prestable;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrestamosInertiaController extends Controller
{
    /**
     * Dashboard principal de préstamos
     */
    public function index(): Response
    {
        return Inertia::render('prestamos/index');
    }

    /**
     * Gestión de prestables (canastillas/embases)
     */
    public function prestables(): Response
    {
        return Inertia::render('prestamos/prestables/index');
    }

    /**
     * Gestión de stock de prestables
     */
    public function stock(): Response
    {
        return Inertia::render('prestamos/stock/index');
    }

    /**
     * Listado de préstamos a clientes
     */
    public function clientesIndex(): Response
    {
        return Inertia::render('prestamos/clientes/index');
    }

    /**
     * Formulario para crear nuevo préstamo a cliente
     */
    public function clientesCrear(): Response
    {
        $clientes = Cliente::where('activo', true)
            ->select('id', 'razon_social', 'nombre')
            ->orderBy('razon_social')
            ->get();

        $choferes = User::role('chofer')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn($user) => ['id' => $user->id, 'nombre' => $user->name]);

        $ventas = \App\Models\Venta::select('id', 'numero', 'cliente_id')
            ->with(['cliente:id,nombre,razon_social'])
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return Inertia::render('prestamos/clientes/crear', [
            'clientes' => $clientes,
            'choferes' => $choferes,
            'ventas' => $ventas,
        ]);
    }

    /**
     * Procesar creación de préstamo a cliente
     * Nota: El procesamiento real se hace vía API /api/prestamos-cliente
     */
    public function clientesStore(Request $request)
    {
        // Redirigir al index después de crear via API
        return redirect()->route('prestamos.clientes.index');
    }

    /**
     * Listado de préstamos a proveedores
     */
    public function proveedoresIndex(): Response
    {
        return Inertia::render('prestamos/proveedores/index');
    }

    /**
     * Formulario para crear nuevo préstamo a proveedor
     */
    public function proveedoresCrear(): Response
    {
        $proveedores = Proveedor::where('activo', true)
            ->select('id', 'nombre')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('prestamos/proveedores/crear', [
            'proveedores' => $proveedores,
        ]);
    }

    /**
     * Procesar creación de préstamo a proveedor
     * Nota: El procesamiento real se hace vía API /api/prestamos-proveedor
     */
    public function proveedoresStore(Request $request)
    {
        // Redirigir al index después de crear via API
        return redirect()->route('prestamos.proveedores.index');
    }

    /**
     * Reportes de préstamos
     */
    public function reportes(): Response
    {
        return Inertia::render('prestamos/reportes/index');
    }
}
