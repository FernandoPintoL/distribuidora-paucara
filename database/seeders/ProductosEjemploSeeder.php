<?php
namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Categoria;
use App\Models\CodigoBarra;
use App\Models\Marca;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\TipoPrecio;
use App\Models\UnidadMedida;
use Illuminate\Database\Seeder;

class ProductosEjemploSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Primero creamos las categorías específicas para distribuidora
        $categorias = $this->crearCategorias();

        // Creamos marcas conocidas
        $marcas = $this->crearMarcas();

        // Creamos unidades de medida estándar
        $unidadesMedida = $this->crearUnidadesMedida();

        // Creamos almacenes básicos
        $almacenes = $this->crearAlmacenes();

        // Creamos tipos de precio
        $tiposPrecios = $this->crearTiposPrecios();

        // Creamos productos por categoría
        $this->crearProductosAlimentos($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
        $this->crearProductosBebidas($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
        $this->crearProductosLimpieza($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
        $this->crearProductosLacteos($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
        $this->crearProductosCarnes($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
    }

    private function crearCategorias(): array
    {
        $categorias = [
            'Alimentos Básicos'     => 'Productos alimenticios de primera necesidad',
            'Bebidas'               => 'Bebidas alcohólicas y no alcohólicas',
            'Productos de Limpieza' => 'Productos para limpieza del hogar',
            'Lácteos'               => 'Productos lácteos y derivados',
            'Carnes y Embutidos'    => 'Carnes frescas y productos cárnicos',
            'Frutas y Verduras'     => 'Productos frescos del campo',
            'Panadería'             => 'Pan y productos de panadería',
            'Abarrotes'             => 'Productos secos y enlatados',
        ];

        $categoriasCreadas = [];
        foreach ($categorias as $nombre => $descripcion) {
            $categoriasCreadas[$nombre] = Categoria::firstOrCreate(
                ['nombre' => $nombre],
                [
                    'descripcion'    => $descripcion,
                    'activo'         => true,
                    'fecha_creacion' => now(),
                ]
            );
        }

        return $categoriasCreadas;
    }

    private function crearMarcas(): array
    {
        $marcas = [
            'Coca Cola', 'Pepsi', 'Nestle', 'Unilever', 'Procter & Gamble',
            'Kellogg\'s', 'Heinz', 'Del Monte', 'Maggi', 'Ace',
            'Ariel', 'Tide', 'Downy', 'Pringles', 'Lay\'s',
            'Doritos', 'Oreo', 'Ritz', 'Nescafe', 'Lipton',
            'Colgate', 'Gillette', 'Head & Shoulders', 'Pantene', 'Herbal Essences',
        ];

        $marcasCreadas = [];
        foreach ($marcas as $marca) {
            $marcasCreadas[$marca] = Marca::firstOrCreate(
                ['nombre' => $marca],
                [
                    'descripcion' => "Marca reconocida internacionalmente - {$marca}",
                    'activo'         => true,
                    'fecha_creacion' => now(),
                ]
            );
        }

        return $marcasCreadas;
    }

    private function crearUnidadesMedida(): array
    {
        $unidades = [
            'UN' => 'Unidad',
            'KG' => 'Kilogramo',
            'GR' => 'Gramo',
            'LT' => 'Litro',
            'ML' => 'Mililitro',
            'MT' => 'Metro',
            'CM' => 'Centímetro',
            'PZ' => 'Pieza',
            'CJ' => 'Caja',
            'PC' => 'Paquete',
        ];

        $unidadesCreadas = [];
        foreach ($unidades as $codigo => $nombre) {
            $unidadesCreadas[$codigo] = UnidadMedida::firstOrCreate(
                ['codigo' => $codigo],
                [
                    'nombre' => $nombre,
                    'activo' => true,
                ]
            );
        }

        return $unidadesCreadas;
    }

    private function crearAlmacenes(): array
    {
        $almacenes = [
            'Almacén Principal'  => [
                'direccion'   => 'Av. Principal 123, La Paz',
                'responsable' => 'Juan Pérez',
                'telefono'    => '2-2345678',
            ],
            'Almacén Secundario' => [
                'direccion'   => 'Calle Comercio 456, El Alto',
                'responsable' => 'María García',
                'telefono'    => '2-2876543',
            ],
        ];

        $almacenesCreados = [];
        foreach ($almacenes as $nombre => $datos) {
            $almacenesCreados[$nombre] = Almacen::firstOrCreate(
                ['nombre' => $nombre],
                [
                    'direccion'   => $datos['direccion'],
                    'responsable' => $datos['responsable'],
                    'telefono'    => $datos['telefono'],
                    'activo'      => true,
                ]
            );
        }

        return $almacenesCreados;
    }

    private function crearTiposPrecios(): array
    {
        $tipos = [
            'COSTO'         => [
                'nombre'              => 'Precio de Costo',
                'descripcion'         => 'Precio al que se adquiere el producto',
                'porcentaje_ganancia' => 0.00,
                'es_precio_base'      => true,
                'es_ganancia'         => false,
            ],
            'VENTA_PUBLICO' => [
                'nombre'              => 'Venta al Público',
                'descripcion'         => 'Precio de venta al consumidor final',
                'porcentaje_ganancia' => 35.00,
                'es_precio_base'      => false,
                'es_ganancia'         => true,
            ],
            'MAYORISTA'     => [
                'nombre'              => 'Precio Mayorista',
                'descripcion'         => 'Precio para ventas al por mayor',
                'porcentaje_ganancia' => 20.00,
                'es_precio_base'      => false,
                'es_ganancia'         => true,
            ],
        ];

        $tiposCreados = [];
        $orden        = 1;
        foreach ($tipos as $codigo => $datos) {
            $tiposCreados[$codigo] = TipoPrecio::firstOrCreate(
                ['codigo' => $codigo],
                [
                    'nombre'              => $datos['nombre'],
                    'descripcion'         => $datos['descripcion'],
                    'porcentaje_ganancia' => $datos['porcentaje_ganancia'],
                    'color'               => $codigo === 'COSTO' ? '#dc3545' : ($codigo === 'VENTA_PUBLICO' ? '#28a745' : '#17a2b8'),
                    'es_ganancia'         => $datos['es_ganancia'],
                    'es_precio_base'      => $datos['es_precio_base'],
                    'orden'               => $orden,
                    'activo'              => true,
                    'es_sistema'          => true,
                ]
            );
            $orden++;
        }

        return $tiposCreados;
    }

    private function crearProductosAlimentos($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios): void
    {
        $productos = [
            [
                'nombre'       => 'Arroz Blanco Premium',
                'descripcion'  => 'Arroz blanco de grano largo, primera calidad',
                'peso'         => 1.0,
                'marca'        => 'Nestle',
                'unidad'       => 'KG',
                'precio_costo' => 12.50,
                'stock_minimo' => 50,
                'stock_maximo' => 500,
            ],
            [
                'nombre'       => 'Azúcar Blanca Refinada',
                'descripcion'  => 'Azúcar blanca refinada especial',
                'peso'         => 1.0,
                'marca'        => 'Del Monte',
                'unidad'       => 'KG',
                'precio_costo' => 8.50,
                'stock_minimo' => 100,
                'stock_maximo' => 1000,
            ],
            [
                'nombre'       => 'Aceite Vegetal',
                'descripcion'  => 'Aceite vegetal 100% puro',
                'peso'         => 1.0,
                'marca'        => 'Unilever',
                'unidad'       => 'LT',
                'precio_costo' => 15.00,
                'stock_minimo' => 30,
                'stock_maximo' => 300,
            ],
            [
                'nombre'       => 'Sal de Mesa',
                'descripcion'  => 'Sal de mesa refinada yodada',
                'peso'         => 1.0,
                'marca'        => 'Ace',
                'unidad'       => 'KG',
                'precio_costo' => 3.50,
                'stock_minimo' => 20,
                'stock_maximo' => 200,
            ],
        ];

        $this->crearProductosConDatos($productos, $categorias['Alimentos Básicos'], $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
    }

    private function crearProductosBebidas($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios): void
    {
        $productos = [
            [
                'nombre'       => 'Coca Cola 2L',
                'descripcion'  => 'Gaseosa Coca Cola botella 2 litros',
                'peso'         => 2.1,
                'marca'        => 'Coca Cola',
                'unidad'       => 'UN',
                'precio_costo' => 8.50,
                'stock_minimo' => 24,
                'stock_maximo' => 240,
            ],
            [
                'nombre'       => 'Agua Mineral 500ml',
                'descripcion'  => 'Agua mineral natural embotellada',
                'peso'         => 0.5,
                'marca'        => 'Nestle',
                'unidad'       => 'UN',
                'precio_costo' => 2.00,
                'stock_minimo' => 100,
                'stock_maximo' => 1000,
            ],
            [
                'nombre'       => 'Jugo de Naranja 1L',
                'descripcion'  => 'Jugo de naranja 100% natural',
                'peso'         => 1.0,
                'marca'        => 'Del Monte',
                'unidad'       => 'UN',
                'precio_costo' => 6.50,
                'stock_minimo' => 48,
                'stock_maximo' => 480,
            ],
        ];

        $this->crearProductosConDatos($productos, $categorias['Bebidas'], $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
    }

    private function crearProductosLimpieza($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios): void
    {
        $productos = [
            [
                'nombre'       => 'Detergente en Polvo',
                'descripcion'  => 'Detergente en polvo para ropa',
                'peso'         => 1.0,
                'marca'        => 'Ariel',
                'unidad'       => 'KG',
                'precio_costo' => 18.50,
                'stock_minimo' => 20,
                'stock_maximo' => 200,
            ],
            [
                'nombre'       => 'Suavizante de Ropa',
                'descripcion'  => 'Suavizante concentrado para ropa',
                'peso'         => 1.0,
                'marca'        => 'Downy',
                'unidad'       => 'LT',
                'precio_costo' => 12.00,
                'stock_minimo' => 15,
                'stock_maximo' => 150,
            ],
            [
                'nombre'       => 'Limpiador Multiusos',
                'descripcion'  => 'Limpiador multiusos desinfectante',
                'peso'         => 1.0,
                'marca'        => 'Unilever',
                'unidad'       => 'LT',
                'precio_costo' => 15.50,
                'stock_minimo' => 25,
                'stock_maximo' => 250,
            ],
        ];

        $this->crearProductosConDatos($productos, $categorias['Productos de Limpieza'], $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
    }

    private function crearProductosLacteos($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios): void
    {
        $productos = [
            [
                'nombre'       => 'Leche Entera UHT',
                'descripcion'  => 'Leche entera ultra pasteurizada',
                'peso'         => 1.0,
                'marca'        => 'Nestle',
                'unidad'       => 'LT',
                'precio_costo' => 7.50,
                'stock_minimo' => 48,
                'stock_maximo' => 480,
            ],
            [
                'nombre'       => 'Queso Fresco',
                'descripcion'  => 'Queso fresco artesanal',
                'peso'         => 0.5,
                'marca'        => 'Nestle',
                'unidad'       => 'KG',
                'precio_costo' => 25.00,
                'stock_minimo' => 10,
                'stock_maximo' => 100,
            ],
            [
                'nombre'       => 'Yogurt Natural',
                'descripcion'  => 'Yogurt natural sin azúcar',
                'peso'         => 1.0,
                'marca'        => 'Nestle',
                'unidad'       => 'LT',
                'precio_costo' => 8.50,
                'stock_minimo' => 24,
                'stock_maximo' => 240,
            ],
        ];

        $this->crearProductosConDatos($productos, $categorias['Lácteos'], $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
    }

    private function crearProductosCarnes($categorias, $marcas, $unidadesMedida, $almacenes, $tiposPrecios): void
    {
        $productos = [
            [
                'nombre'       => 'Pollo Entero Fresco',
                'descripcion'  => 'Pollo entero fresco de granja',
                'peso'         => 2.5,
                'marca'        => 'Ace', // Marca genérica para productos frescos
                'unidad'       => 'KG',
                'precio_costo' => 18.00,
                'stock_minimo' => 20,
                'stock_maximo' => 100,
            ],
            [
                'nombre'       => 'Carne de Res',
                'descripcion'  => 'Carne de res premium corte especial',
                'peso'         => 1.0,
                'marca'        => 'Ace',
                'unidad'       => 'KG',
                'precio_costo' => 45.00,
                'stock_minimo' => 15,
                'stock_maximo' => 75,
            ],
            [
                'nombre'       => 'Salchicha Premium',
                'descripcion'  => 'Salchicha premium de cerdo y res',
                'peso'         => 0.5,
                'marca'        => 'Heinz',
                'unidad'       => 'KG',
                'precio_costo' => 28.00,
                'stock_minimo' => 20,
                'stock_maximo' => 200,
            ],
        ];

        $this->crearProductosConDatos($productos, $categorias['Carnes y Embutidos'], $marcas, $unidadesMedida, $almacenes, $tiposPrecios);
    }

    private function crearProductosConDatos($productos, $categoria, $marcas, $unidadesMedida, $almacenes, $tiposPrecios): void
    {
        foreach ($productos as $productoData) {
            // Crear producto
            $producto = Producto::create([
                'nombre'                   => $productoData['nombre'],
                'descripcion'              => $productoData['descripcion'],
                'peso'                     => $productoData['peso'],
                'codigo_barras'            => fake()->ean13(),
                'codigo_qr'                => fake()->uuid(),
                'stock_minimo'             => $productoData['stock_minimo'],
                'stock_maximo'             => $productoData['stock_maximo'],
                'activo'                   => true,
                'fecha_creacion'           => now(),
                'es_alquilable'            => false,
                'categoria_id'             => $categoria->id,
                'marca_id'                 => $marcas[$productoData['marca']]->id,
                'unidad_medida_id'         => $unidadesMedida[$productoData['unidad']]->id,
                'controlar_stock'          => true,
                'permitir_venta_sin_stock' => false,
            ]);

            // Crear precios
            $precioCosto = $productoData['precio_costo'];
            foreach ($tiposPrecios as $codigo => $tipoPrecio) {
                $precio = $precioCosto;
                if ($codigo !== 'COSTO') {
                    $precio = $precioCosto * (1 + ($tipoPrecio->porcentaje_ganancia / 100));
                }

                PrecioProducto::create([
                    'producto_id'         => $producto->id,
                    'tipo_precio_id'      => $tipoPrecio->id,
                    'nombre'              => $tipoPrecio->nombre,
                    'precio'              => round($precio, 2),
                    'margen_ganancia'     => $codigo === 'COSTO' ? 0 : round($precio - $precioCosto, 2),
                    'porcentaje_ganancia' => $tipoPrecio->porcentaje_ganancia,
                    'es_precio_base'      => $tipoPrecio->es_precio_base,
                    'fecha_inicio'        => now(),
                    'activo'              => true,
                    'tipo_cliente'        => $codigo === 'MAYORISTA' ? 'mayorista' : 'general',
                ]);
            }

            // Crear stock en almacenes
            foreach ($almacenes as $nombreAlmacen => $almacen) {
                $cantidadStock = fake()->numberBetween(
                    $productoData['stock_minimo'] + 10,
                    $productoData['stock_maximo'] - 50
                );

                StockProducto::create([
                    'producto_id'         => $producto->id,
                    'almacen_id'          => $almacen->id,
                    'cantidad'            => $cantidadStock,
                    'fecha_actualizacion' => now(),
                    'lote'                => 'L' . now()->format('Ymd') . '-' . str_pad($producto->id, 4, '0', STR_PAD_LEFT),
                    'fecha_vencimiento'   => fake()->dateTimeBetween('+6 months', '+2 years')->format('Y-m-d'),
                    'cantidad_reservada'  => 0,
                    'cantidad_disponible' => $cantidadStock,
                ]);
            }

            // Crear código de barras adicional
            CodigoBarra::create([
                'producto_id'  => $producto->id,
                'codigo'       => $producto->codigo_barras,
                'tipo'         => 'EAN13',
                'es_principal' => true,
                'activo'       => true,
            ]);

            $this->command->info("Producto creado: {$producto->nombre}");
        }
    }
}
