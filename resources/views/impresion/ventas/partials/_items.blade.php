{{--
    Items/Detalles de la venta
    Variables esperadas:
    - $documento: objeto Venta
    - $formato: 'a4', 'ticket-80', 'ticket-58' (opcional)
--}}
@php
    $formato = $formato ?? 'a4';
@endphp

@if($formato === 'a4')
    {{-- FORMATO A4: Tabla completa --}}
    <table class="tabla-productos">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 45%;">Producto</th>
                <th style="width: 10%;">Cant.</th>
                <th style="width: 12%;">P. Unit.</th>
                <th style="width: 10%;">Desc.</th>
                <th style="width: 18%;" class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($documento->detalles as $index => $detalle)
            {{-- ✅ NUEVO: Detectar si es combo --}}
            @php
                $esCombo = $detalle->producto->es_combo === true || $detalle->producto->es_combo === 1;
                $comboItems = $detalle->combo_items_seleccionados ?? [];
                $itemsSeleccionados = array_filter($comboItems, fn($item) => $item['incluido'] ?? false);
            @endphp

            <tr>
                <td>{{ $index + 1 }}</td>
                <td>
                    <strong>@if($esCombo) 📦 @endif {{ $detalle->producto->nombre }}</strong>
                    @if($detalle->producto->codigo)
                        <br><small style="color: #666;">Código: {{ $detalle->producto->codigo }}</small>
                    @endif
                    {{-- ✅ NUEVO: Mostrar items del combo si existen --}}
                    @if($esCombo && count($itemsSeleccionados) > 0)
                        <br><small style="color: #999; margin-top: 4px;">
                            <strong>Items ({{ count($itemsSeleccionados) }}):</strong><br>
                            @foreach($itemsSeleccionados as $item)
                                @php
                                    $itemProducto = $documento->detalles
                                        ->flatMap(fn($d) => $d->producto->comboItems ?? [])
                                        ->firstWhere('producto_id', $item['producto_id'])
                                        ?->producto;
                                @endphp
                                └─ {{ $itemProducto?->nombre ?? 'Producto #' . $item['producto_id'] }}
                                @if($item['cantidad'] ?? false)
                                    ({{ $item['cantidad'] }} u)
                                @endif
                                <br>
                            @endforeach
                        </small>
                    @endif
                </td>
                <td>{{ number_format($detalle->cantidad, 2) }}</td>
                <td>{{ number_format($detalle->precio_unitario, 2) }}</td>
                <td>{{ number_format($detalle->descuento ?? 0, 2) }}</td>
                <td class="text-right"><strong>{{ number_format($detalle->subtotal, 2) }}</strong></td>
            </tr>
            @endforeach
        </tbody>
    </table>

@elseif($formato === 'ticket-80')
    {{-- FORMATO TICKET 80mm: Tabla con columnas: Cantidad | Nombre | Precio Unit. | Subtotal --}}
    <table class="items" style="width: 100%; border-collapse: collapse;">
        {{-- ✅ ENCABEZADO DE LA TABLA --}}
        <thead>
            <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; font-size: 11px;">
                <th style="width: 12%; text-align: center; padding: 2px 0;">CANT.</th>
                <th style="width: 50%; text-align: left; padding: 2px 4px;">NOMBRE</th>
                <th style="width: 18%; text-align: right; padding: 2px 0;">P.UNIT.</th>
                <th style="width: 20%; text-align: right; padding: 2px 2px;">SUBTOTAL</th>
            </tr>
        </thead>

        {{-- ✅ CUERPO DE LA TABLA --}}
        <tbody>
            @foreach($documento->detalles as $detalle)
            {{-- Detectar si es combo --}}
            @php
                $esCombo = $detalle->producto->es_combo === true || $detalle->producto->es_combo === 1;
                $comboItems = $detalle->combo_items_seleccionados ?? [];
                $itemsSeleccionados = array_filter($comboItems, fn($item) => $item['incluido'] ?? false);
            @endphp

            {{-- FILA DE PRODUCTO --}}
            <tr style="border-bottom: 1px dotted #ccc;">
                <td style="width: 12%; text-align: center; padding: 2px 0; font-size: 12px;">
                    {{ number_format($detalle->cantidad, 0) }}
                </td>
                <td style="width: 50%; text-align: left; padding: 2px 4px; font-size: 12px;">
                    <strong>@if($esCombo) 📦 @endif {{ $detalle->producto->nombre }}</strong>
                    @if($detalle->producto->codigo)
                        <br><small style="color: #999; font-size: 8px;">{{ $detalle->producto->codigo }}</small>
                    @endif
                </td>
                <td style="width: 18%; text-align: right; padding: 2px 0; font-size: 12px;">
                    {{ number_format($detalle->precio_unitario, 2) }}
                </td>
                <td style="width: 20%; text-align: right; padding: 2px 2px; font-size: 12px; font-weight: bold;">
                    {{ number_format($detalle->subtotal, 2) }}
                </td>
            </tr>

            {{-- ITEMS DEL COMBO SI EXISTEN --}}
            @if($esCombo && count($itemsSeleccionados) > 0)
                <tr>
                    <td colspan="4" style="padding: 2px 4px; font-size: 12px;">
                        <strong>Componentes ({{ count($itemsSeleccionados) }}):</strong>
                    </td>
                </tr>
                @foreach($itemsSeleccionados as $item)
                    @php
                        $itemProducto = $documento->detalles
                            ->flatMap(fn($d) => $d->producto->comboItems ?? [])
                            ->firstWhere('producto_id', $item['producto_id'])
                            ?->producto;
                    @endphp
                    <tr>
                        <td colspan="4" style="padding: 1px 12px; font-size: 12px;">
                            └─ {{ $itemProducto?->nombre ?? 'Producto #' . $item['producto_id'] }}
                            @if($item['cantidad'] ?? false)
                                ({{ $item['cantidad'] }} u)
                            @endif
                        </td>
                    </tr>
                @endforeach
            @endif

            @endforeach
        </tbody>
    </table>

@elseif($formato === 'ticket-58')
    {{-- FORMATO TICKET 58mm (compacto) --}}
    <table class="items">
        @foreach($documento->detalles as $detalle)
        {{-- ✅ NUEVO: Detectar si es combo --}}
        @php
            $esCombo = $detalle->producto->es_combo === true || $detalle->producto->es_combo === 1;
            $comboItems = $detalle->combo_items_seleccionados ?? [];
            $itemsSeleccionados = array_filter($comboItems, fn($item) => $item['incluido'] ?? false);
        @endphp

        <tr>
            <td colspan="2" style="font-weight: bold;">
                @if($esCombo) 📦 @endif
                {{ Str::limit($detalle->producto->nombre, 25) }}
            </td>
        </tr>
        <tr>
            <td style="width: 60%;">
                {{ number_format($detalle->cantidad, 0) }} x {{ number_format($detalle->precio_unitario, 2) }}
            </td>
            <td style="width: 40%; text-align: right;">
                <strong>{{ number_format($detalle->subtotal, 2) }}</strong>
            </td>
        </tr>

        {{-- ✅ NUEVO: Mostrar items del combo si existen --}}
        @if($esCombo && count($itemsSeleccionados) > 0)
            <tr>
                <td colspan="2" style="padding-left: 8px; font-size: 6px; color: #666;">
                    Items ({{ count($itemsSeleccionados) }}):
                </td>
            </tr>
            @foreach($itemsSeleccionados as $item)
                @php
                    $itemProducto = $documento->detalles
                        ->flatMap(fn($d) => $d->producto->comboItems ?? [])
                        ->firstWhere('producto_id', $item['producto_id'])
                        ?->producto;
                @endphp
                <tr>
                    <td colspan="2" style="padding-left: 14px; font-size: 6px;">
                        └ {{ Str::limit($itemProducto?->nombre ?? 'Producto #' . $item['producto_id'], 20) }}
                    </td>
                </tr>
            @endforeach
        @endif

        <tr><td colspan="2" style="height: 2px;"></td></tr>
        @endforeach
    </table>
@endif
