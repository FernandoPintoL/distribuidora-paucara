<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Basic catalogs: monedas, categorias, marcas, almacenes, clientes, proveedores
        Schema::create('monedas', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 3)->unique(); // USD, EUR, ARS, etc.
            $table->string('nombre', 50)->unique();
            $table->string('simbolo', 5);                             // $, €, etc.
            $table->decimal('tasa_cambio', 15, 6)->default(1.000000); // Tasa de cambio respecto a moneda base
            $table->integer('decimales')->default(2);
            $table->boolean('es_moneda_base')->default(false); // Solo una puede ser true
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamp('fecha_creacion')->useCurrent();
        });

        Schema::create('marcas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamp('fecha_creacion')->useCurrent();
        });

        Schema::create('almacenes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->string('direccion')->nullable();
            $table->string('responsable')->nullable();
            $table->string('telefono')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->double('peso')->default(0);
            $table->string('codigo_barras')->nullable()->index();
            $table->string('codigo_qr')->nullable();
            $table->unsignedInteger('stock_minimo')->default(0);
            $table->unsignedInteger('stock_maximo')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->boolean('es_alquilable')->default(false);
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
        });

        Schema::create('imagenes_producto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->string('url');
            $table->boolean('es_principal')->default(false);
            $table->unsignedInteger('orden')->default(0);
            $table->timestamps();
        });

        Schema::create('precios_producto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->decimal('precio', 18, 2);
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->boolean('activo')->default(true);
            $table->string('tipo_cliente')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('almacen_id')->constrained('almacenes')->cascadeOnDelete();
            $table->integer('cantidad')->default(0);
            $table->timestamp('fecha_actualizacion')->useCurrent();
            $table->string('lote')->nullable();
            $table->date('fecha_vencimiento')->nullable();
            $table->unique(['producto_id', 'almacen_id', 'lote'], 'uq_stock_producto_lote');
        });

        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('razon_social')->nullable();
            $table->string('nit')->nullable()->index();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamp('fecha_registro')->useCurrent();
            $table->string('foto_perfil')->nullable();
            $table->string('ci_anverso')->nullable();
            $table->string('ci_reverso')->nullable();
            $table->decimal('limite_credito', 18, 2)->default(0);
        });

        Schema::create('direcciones_cliente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete();
            $table->string('direccion');
            $table->double('latitud')->nullable();
            $table->double('longitud')->nullable();
            $table->boolean('es_principal')->default(false);
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        Schema::create('fotos_lugar_cliente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cliente_id')->constrained('clientes')->cascadeOnDelete();
            $table->foreignId('direccion_cliente_id')->nullable()->constrained('direcciones_cliente')->nullOnDelete();
            $table->string('url');
            $table->string('descripcion')->nullable();
            $table->timestamp('fecha_captura')->useCurrent();
        });

        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('razon_social')->nullable();
            $table->string('nit')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->string('contacto')->nullable();
            $table->boolean('activo')->default(true);
            $table->string('foto_perfil')->nullable();
            $table->string('ci_anverso')->nullable();
            $table->string('ci_reverso')->nullable();
            $table->timestamp('fecha_registro')->useCurrent();
        });

        // Tipos y estados básicos
        Schema::create('estados_documento', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 10)->unique();
            $table->string('nombre', 100);
            $table->string('descripcion')->nullable();
            $table->string('color', 7)->default('#6B7280'); // Color hexadecimal para UI
            $table->boolean('permite_edicion')->default(true);
            $table->boolean('permite_anulacion')->default(true);
            $table->boolean('es_estado_final')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();

        });

        Schema::create('tipos_documento', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 10)->unique(); // Ej: FAC, BOL, REC, NOT
            $table->string('nombre', 100);          // Factura, Boleta, Recibo, Nota de Crédito
            $table->string('descripcion')->nullable();
            $table->boolean('genera_inventario')->default(true);      // Si afecta inventario
            $table->boolean('requiere_autorizacion')->default(false); // Para facturación electrónica
            $table->string('formato_numeracion')->nullable();         // Ej: FAC-{YYYY}-{####}
            $table->integer('siguiente_numero')->default(1);          // Para auto-numeración
            $table->boolean('activo')->default(true);
            $table->timestamps();

            // Índices
            $table->index(['codigo', 'activo']);
        });

        Schema::create('tipos_pago', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
        });

        Schema::create('tipo_operacion_caja', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
        });

        Schema::create('estados_pedido', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
        });

        // Cajas
        Schema::create('cajas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('ubicacion')->nullable();
            $table->decimal('monto_inicial_dia', 18, 2)->default(0);
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        Schema::create('movimientos_caja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caja_id')->constrained('cajas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('fecha')->useCurrent();
            $table->decimal('monto', 18, 2);
            $table->string('observaciones')->nullable();
            $table->string('numero_documento')->nullable();
            $table->foreignId('tipo_operacion_id')->constrained('tipo_operacion_caja');
        });

        // Pedidos y delivery mínimos
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('cliente_id')->constrained('clientes');
            $table->timestamp('fecha_pedido')->useCurrent();
            $table->date('fecha_entrega_requerida')->nullable();
            $table->timestamp('fecha_entrega_real')->nullable();
            $table->decimal('subtotal', 18, 2)->default(0);
            $table->decimal('total', 18, 2)->default(0);
            $table->string('observaciones')->nullable();
            $table->string('direccion_entrega')->nullable();
            $table->double('latitud_entrega')->nullable();
            $table->double('longitud_entrega')->nullable();
            $table->foreignId('estado_id')->nullable()->constrained('estados_pedido');
            $table->timestamps();
        });

        Schema::create('detalles_pedido', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 18, 2);
            $table->decimal('subtotal', 18, 2);
            $table->timestamps();
        });

        // Movimiento de inventario básico
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_producto_id')->constrained('stock_productos');
            $table->integer('cantidad');
            $table->timestamp('fecha')->useCurrent();
            $table->string('observacion')->nullable();
            $table->string('numero_documento')->nullable();
            $table->integer('cantidad_anterior')->nullable();
            $table->integer('cantidad_posterior')->nullable();
            $table->string('tipo')->index(); // ENTRADA_*, SALIDA_* etc.
            $table->foreignId('user_id')->constrained('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
        Schema::dropIfExists('detalles_pedido');
        Schema::dropIfExists('pedidos');
        Schema::dropIfExists('movimientos_caja');
        Schema::dropIfExists('cajas');
        Schema::dropIfExists('estados_pedido');
        Schema::dropIfExists('tipo_operacion_caja');
        Schema::dropIfExists('tipos_pago');
        Schema::dropIfExists('estados_documento');
        Schema::dropIfExists('tipos_documento');
        Schema::dropIfExists('proveedores');
        Schema::dropIfExists('fotos_lugar_cliente');
        Schema::dropIfExists('direcciones_cliente');
        Schema::dropIfExists('clientes');
        Schema::dropIfExists('stock_productos');
        Schema::dropIfExists('precios_producto');
        Schema::dropIfExists('imagenes_producto');
        Schema::dropIfExists('productos');
        Schema::dropIfExists('almacenes');
        Schema::dropIfExists('marcas');
        Schema::dropIfExists('categorias');
        Schema::dropIfExists('monedas');
    }
};
