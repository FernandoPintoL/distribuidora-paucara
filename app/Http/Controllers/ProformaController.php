<?php
namespace App\Http\Controllers;

use App\Models\Proforma;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProformaController extends Controller
{
    public function index(): Response
    {
        $proformas = Proforma::with(['cliente', 'usuarioCreador', 'detalles.producto'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Proformas/Index', [
            'proformas' => $proformas,
        ]);
    }

    public function show(Proforma $proforma): Response
    {
        $proforma->load([
            'cliente',
            'usuarioCreador',
            'detalles.producto.marca',
            'detalles.producto.categoria',
        ]);

        return Inertia::render('Proformas/Show', [
            'proforma' => $proforma,
        ]);
    }

    public function aprobar(Proforma $proforma)
    {
        // Implementar lógica de aprobación
        $proforma->update([
            'estado'               => Proforma::APROBADA,
            'usuario_aprobador_id' => Auth::id(),
            'fecha_aprobacion'     => now(),
        ]);

        return back()->with('success', 'Proforma aprobada exitosamente');
    }

    public function rechazar(Proforma $proforma)
    {
        // Implementar lógica de rechazo
        $proforma->update([
            'estado' => Proforma::RECHAZADA,
        ]);

        return back()->with('success', 'Proforma rechazada');
    }

    public function convertirVenta(Proforma $proforma)
    {
        // Implementar lógica de conversión a venta
        // Esta funcionalidad necesitaría más desarrollo
        return back()->with('info', 'Funcionalidad en desarrollo');
    }
}
