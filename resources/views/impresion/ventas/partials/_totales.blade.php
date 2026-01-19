{{--
    Sección de Totales
    ✅ Usa SOLO subtotal (sin impuestos)
    ✅ Muestra descuento si existe
--}}
<div class="totales">
    <table>
        {{-- Mostrar subtotal si hay descuento --}}
        @if($documento->descuento > 0)
        <tr>
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->subtotal + $documento->descuento, 2) }}</td>
        </tr>
        <tr>
            <td><strong>Descuento:</strong></td>
            <td class="text-right">-{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->descuento, 2) }}</td>
        </tr>
        @endif

        {{-- TOTAL FINAL (siempre subtotal, NUNCA con impuesto) --}}
        <tr class="total-final">
            <td><strong>TOTAL:</strong></td>
            <td class="text-right">
                <strong>{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->subtotal, 2) }}</strong>
            </td>
        </tr>
    </table>
</div>
