<?php

namespace App\Providers;

use App\Models\Cliente;
use App\Policies\ClientePolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Mapeo de Models a Policies
     */
    protected $policies = [
        Cliente::class => ClientePolicy::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Registrar todas las policies del mapeo
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }
}
