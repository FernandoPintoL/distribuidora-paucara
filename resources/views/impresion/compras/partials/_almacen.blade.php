{{-- Información del Almacén donde se recibe la compra --}}
@if($compra->almacen)
<div style="margin-top: 20px; padding: 15px; border: 2px solid #ddd; border-radius: 5px;">
    <h3 style="margin-top: 0; color: #333;">📦 Almacén Destino</h3>
    <p><strong>Almacén:</strong> {{ $compra->almacen->nombre }}</p>
    @if($compra->almacen->ubicacion)
        <p><strong>Ubicación:</strong> {{ $compra->almacen->ubicacion }}</p>
    @endif
    @if($compra->almacen->direccion)
        <p><strong>Dirección:</strong> {{ $compra->almacen->direccion }}</p>
    @endif
</div>
@endif
