<?php

namespace App\Http\Controllers;

use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Http\Requests\StoreCompraRequest;
use App\Http\Requests\UpdateCompraRequest;
use Illuminate\Http\Response;

class CompraController extends Controller
{
    public function index()
    {
        $compras = Compra::with(['proveedor', 'usuario', 'estadoDocumento', 'moneda', 'detalles.producto'])->get();
        return response()->json($compras);
    }

    public function show($id)
    {
        $compra = Compra::with(['proveedor', 'usuario', 'estadoDocumento', 'moneda', 'detalles.producto'])->findOrFail($id);
        return response()->json($compra);
    }

    public function store(StoreCompraRequest $request)
    {
        $data = $request->validated();
        $compra = Compra::create($data);
        foreach ($data['detalles'] as $detalle) {
            $compra->detalles()->create($detalle);
        }
        return response()->json($compra->load(['detalles.producto']), Response::HTTP_CREATED);
    }

    public function update(UpdateCompraRequest $request, $id)
    {
        $compra = Compra::findOrFail($id);
        $data = $request->validated();
        $compra->update($data);
        return response()->json($compra->fresh(['detalles.producto']));
    }

    public function destroy($id)
    {
        $compra = Compra::findOrFail($id);
        $compra->delete();
        return response()->json(['message' => 'Compra eliminada']);
    }
}
