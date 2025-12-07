<?php

namespace App\Providers;

use App\Models\Compra;
use App\Models\PrecioProducto;
use App\Models\Proforma;
use App\Models\Ruta;
use App\Models\RutaDetalle;
use App\Observers\CompraObserver;
use App\Observers\PrecioProductoObserver;
use App\Observers\ProformaObserver;
use App\Observers\RutaObserver;
use App\Observers\RutaDetalleObserver;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
        PrecioProducto::observe(PrecioProductoObserver::class);
        Compra::observe(CompraObserver::class);
        Proforma::observe(ProformaObserver::class);
        Ruta::observe(RutaObserver::class);
        RutaDetalle::observe(RutaDetalleObserver::class);
    }
}
