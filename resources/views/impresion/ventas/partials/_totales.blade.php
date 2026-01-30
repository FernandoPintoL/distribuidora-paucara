{{--
    Sección de Totales
    ✅ Muestra subtotal
    ✅ Muestra descuento si existe
    ✅ Muestra monto a pagar
    ✅ Muestra cambio si aplica
    ✅ Muestra total en letras
--}}
<div class="totales text-right">
    <table>
        {{-- Subtotal --}}
        {{-- <tr>
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->subtotal + ($documento->descuento ?? 0), 2) }}</td>
        </tr> --}}

        {{-- Mostrar descuento si existe --}}
        {{-- @if($documento->descuento > 0)
        @endif --}}
        <tr>
            <td><strong>Descuento:</strong></td>
            <td class="text-right">-{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->descuento, 2) }}</td>
        </tr>
        {{-- TOTAL A PAGAR (final) --}}
        <tr class="total-final">
            <td><strong>Total a Pagar:</strong></td>
            <td class="text-right">
                <strong>{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->subtotal, 2) }}</strong>
            </td>
        </tr>
        <tr>
            <td><strong>Cambio:</strong></td>
            <td class="text-right">{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->monto_pagado - $documento->subtotal, 2) }}</td>
        </tr>
    </table>
</div>

{{-- TOTAL EN LETRAS --}}
<div style="margin-top: 10px; padding: 8px; background-color: #f9f9f9; border-radius: 4px; text-align: center; font-size: 10px; font-weight: bold;">
    {{ \App\Helpers\FormatHelper::numeroALetras($documento->subtotal, 'Bolivianos') }} 00/100 Bolivianos
</div>
