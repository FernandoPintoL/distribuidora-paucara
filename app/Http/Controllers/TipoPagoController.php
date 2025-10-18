<?php

namespace App\Http\Controllers;

use App\Models\TipoPago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TipoPagoController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->string('q');

        $items = TipoPago::query()
            ->when($q, function ($query) use ($q) {
                $searchLower = strtolower($q);
                return $query->where(function ($sub) use ($searchLower) {
                    $sub->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(codigo) like ?', ["%$searchLower%"]);
                });
            })
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('tipos-pago/index', [
            'tiposPago' => $items,
            'filters' => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('tipos-pago/form', [
            'tipoPago' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'codigo' => ['required', 'string', 'max:255', 'unique:tipos_pago,codigo'],
            'nombre' => ['required', 'string', 'max:255'],
        ]);

        TipoPago::create($data);

        return redirect()->route('tipos-pago.index')->with('success', 'Tipo de pago creado');
    }

    public function edit(TipoPago $tipoPago): Response
    {
        return Inertia::render('tipos-pago/form', [
            'tipoPago' => $tipoPago,
        ]);
    }

    public function update(Request $request, TipoPago $tipoPago): RedirectResponse
    {
        $data = $request->validate([
            'codigo' => ['required', 'string', 'max:255', 'unique:tipos_pago,codigo,'.$tipoPago->id],
            'nombre' => ['required', 'string', 'max:255'],
        ]);

        $tipoPago->update($data);

        return redirect()->route('tipos-pago.index')->with('success', 'Tipo de pago actualizado');
    }

    public function destroy(TipoPago $tipoPago): RedirectResponse
    {
        $tipoPago->delete();

        return redirect()->route('tipos-pago.index')->with('success', 'Tipo de pago eliminado');
    }
}
