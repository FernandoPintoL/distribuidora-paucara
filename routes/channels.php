<?php

use App\Models\Proforma;
use App\Models\Entrega;
use App\Models\Chofer;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Auth;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// ==========================================
// 📦 CANALES PARA LOGÍSTICA
// ==========================================

/**
 * Canal para cliente: seguimiento de pedido
 * pedido.{proformaId}
 */
Broadcast::channel('pedido.{proformaId}', function ($user, $proformaId) {
    if (!Auth::check()) {
        return false;
    }

    try {
        $proforma = Proforma::find($proformaId);
        if (!$proforma) {
            return false;
        }

        // El usuario es cliente de la proforma O es admin/encargado
        return $user->id === $proforma->cliente->user_id || $user->hasRole(['admin', 'encargado']);
    } catch (\Exception $e) {
        return false;
    }
});

/**
 * Canal para seguimiento de entrega
 * entrega.{entregaId}
 */
Broadcast::channel('entrega.{entregaId}', function ($user, $entregaId) {
    if (!Auth::check()) {
        return false;
    }

    try {
        $entrega = Entrega::with('proforma')->find($entregaId);
        if (!$entrega) {
            return false;
        }

        // El usuario es cliente de la proforma, chofer asignado, O admin/encargado
        return $user->id === $entrega->proforma->cliente->user_id ||
               ($entrega->chofer && $user->id === $entrega->chofer->user_id) ||
               $user->hasRole(['admin', 'encargado']);
    } catch (\Exception $e) {
        return false;
    }
});

/**
 * Canal para chofer
 * chofer.{choferId}
 */
Broadcast::channel('chofer.{choferId}', function ($user, $choferId) {
    if (!Auth::check()) {
        return false;
    }

    try {
        $chofer = Chofer::find($choferId);
        if (!$chofer) {
            return false;
        }

        // El usuario es el chofer O es admin/encargado
        return $user->id === $chofer->user_id || $user->hasRole(['admin', 'encargado']);
    } catch (\Exception $e) {
        return false;
    }
});

/**
 * Canal para admin: todas las órdenes
 * admin.pedidos
 */
Broadcast::channel('admin.pedidos', function ($user) {
    if (!Auth::check()) {
        return false;
    }

    return $user->hasRole(['admin', 'encargado']);
});
