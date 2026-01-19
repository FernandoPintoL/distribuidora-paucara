{{-- Código QR con enlace público a la venta --}}
<div class="qr-container">
    @php
        // Obtener token de acceso público
        $accessToken = $documento->accessToken;

        if ($accessToken) {
            // Generar URL compartible para ver la venta
            $shareUrl = route('venta.preview', ['token' => $accessToken->token]);

            // Generar QR con el URL
            $qrImage = \App\Services\QrCodeService::generateDataUri($shareUrl, 1);
        } else {
            $qrImage = null;
        }
    @endphp

    @if($qrImage)
    <div class="qr-box">
        <img src="{{ $qrImage }}" alt="QR Code" class="qr-code">
        <p class="qr-label">{{ $documento->numero }}</p>
    </div>
    @endif
</div>
