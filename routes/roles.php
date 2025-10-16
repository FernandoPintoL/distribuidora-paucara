<?php
// routes/roles.php

use App\Http\Controllers\RolController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {

    // Rutas de gestión de roles
    Route::resource('roles', RolController::class);

    // Ruta adicional para crear funcionalidad (trait) para un rol existente
    Route::post('roles/{role}/crear-funcionalidad', [RolController::class, 'crearFuncionalidad'])
        ->name('roles.crear-funcionalidad')
        ->middleware('permission:roles.edit');

});
