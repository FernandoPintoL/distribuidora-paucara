<?php

namespace App\Http\Controllers;

use App\Models\DetalleCompra;
use App\Http\Requests\StoreDetalleCompraRequest;
use App\Http\Requests\UpdateDetalleCompraRequest;
use Illuminate\Http\Response;

class DetalleCompraController extends Controller
{
    public function index()
    {
        $detalles = DetalleCompra::with(['compra', 'producto'])->get();
        return response()->json($detalles);
    }

    public function show($id)
    {
        $detalle = DetalleCompra::with(['compra', 'producto'])->findOrFail($id);
        return response()->json($detalle);
    }

    public function store(StoreDetalleCompraRequest $request)
    {
        $data = $request->validated();
        $detalle = DetalleCompra::create($data);
        return response()->json($detalle->load(['compra', 'producto']), Response::HTTP_CREATED);
    }

    public function update(UpdateDetalleCompraRequest $request, $id)
    {
        $detalle = DetalleCompra::findOrFail($id);
        $data = $request->validated();
        $detalle->update($data);
        return response()->json($detalle->fresh(['compra', 'producto']));
    }

    public function destroy($id)
    {
        $detalle = DetalleCompra::findOrFail($id);
        $detalle->delete();
        return response()->json(['message' => 'Detalle de compra eliminado']);
    }
}
