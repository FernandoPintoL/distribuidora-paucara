<?php

namespace App\Http\Requests;

use App\Models\TipoPrecio;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // TODO: Implementar autorización con permisos
        return true;
    }

    /**
     * Prepare the data for validation
     */
    protected function prepareForValidation(): void
    {
        // ✨ NUEVO: Convertir limite_venta vacío a null para permitir guardarlo sin límite
        if ($this->has('limite_venta')) {
            $limitVenta = $this->input('limite_venta');
            // Si es cadena vacía o "0", convertir a null (sin límite)
            if ($limitVenta === '' || $limitVenta === '0' || $limitVenta === 0) {
                $this->merge(['limite_venta' => null]);
            }
        }

        // Manejo simplificado y robusto de códigos
        if ($this->has('codigos')) {
            $codigosLimpios = [];

            // Si no es array, convertir a array
            if (!is_array($this->codigos)) {
                $this->merge(['codigos' => []]);
                return;
            }

            foreach ($this->codigos as $item) {
                $codigoString = '';

                // Extraer string del código independientemente del formato
                if (is_string($item)) {
                    $codigoString = trim($item);
                } elseif (is_array($item)) {
                    // Si es array, buscar la clave 'codigo' o tomar el primer valor válido
                    if (isset($item['codigo']) && is_string($item['codigo'])) {
                        $codigoString = trim($item['codigo']);
                    } elseif (!empty($item)) {
                        // Tomar el primer valor que sea string
                        foreach ($item as $value) {
                            if (is_string($value) && !empty(trim($value))) {
                                $codigoString = trim($value);
                                break;
                            }
                        }
                    }
                } else {
                    // Si es otro tipo, intentar convertir a string
                    $codigoString = (string) $item;
                }

                // Solo agregar si no está vacío
                if (!empty($codigoString)) {
                    $codigosLimpios[] = $codigoString;
                }
            }

            $this->merge(['codigos' => $codigosLimpios]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $producto = $this->route('producto');

        // 🔍 DEBUG: Verificar que el producto existe
        if (!$producto || !$producto->id) {
            \Log::error('⚠️ UpdateProductoRequest: $producto no válido o sin ID', [
                'producto' => $producto,
                'ruta' => $this->route(),
                'url' => $this->url(),
            ]);
        } else {
            \Log::info('✅ UpdateProductoRequest: Actualizando producto ID ' . $producto->id);
        }

        $tiposPrecios = TipoPrecio::activos()->pluck('id')->toArray();

        return [
            'nombre'                   => ['required', 'string', 'max:255'],
            'sku'                      => ['nullable', 'string', 'max:20', Rule::unique('productos', 'sku')->ignore($producto?->id)],
            'descripcion'              => ['nullable', 'string'],
            'peso'                     => ['nullable', 'numeric', 'min:0'],
            'unidad_medida_id'         => ['nullable', 'exists:unidades_medida,id'],
            'numero'                   => ['nullable', 'string', 'max:255'],
            'fecha_vencimiento'        => ['nullable', 'date'],
            'categoria_id'             => ['nullable', 'exists:categorias,id'],
            'marca_id'                 => ['nullable', 'exists:marcas,id'],
            'proveedor_id'             => ['nullable', 'exists:proveedores,id'],
            'stock_minimo'             => ['nullable', 'integer', 'min:0'],
            'stock_maximo'             => ['nullable', 'integer', 'min:0'],
            'limite_venta'             => ['nullable', 'integer', 'min:1'], // ✨ NUEVO

            // Precios
            'precios'                  => ['nullable', 'array'],
            'precios.*.monto'          => ['required_with:precios.*', 'numeric', 'min:0'],
            'precios.*.tipo_precio_id' => ['sometimes', 'integer', 'in:' . implode(',', $tiposPrecios)],
            'precios.*.unidad_medida_id' => ['nullable', 'integer', 'exists:unidades_medida,id'],

            // Códigos
            'codigos'                  => ['nullable', 'array'],
            'codigos.*'                => ['nullable', 'string', 'max:255'],

            // Imágenes
            'perfil'                   => ['nullable', 'file', 'image', 'max:4096'],
            'galeria'                  => ['nullable', 'array'],
            'galeria.*'                => ['file', 'image', 'max:4096'],
            'galeria_eliminar'         => ['sometimes', 'array'],
            'galeria_eliminar.*'       => ['integer', 'exists:imagenes_productos,id'],
            'remove_perfil'            => ['sometimes', 'boolean'],

            // Productos fraccionados
            'es_fraccionado'           => ['nullable', 'boolean'],
            'conversiones'             => ['nullable', 'array'],
            'conversiones.*.unidad_base_id' => ['required_with:conversiones', 'integer', 'exists:unidades_medida,id'],
            'conversiones.*.unidad_destino_id' => ['required_with:conversiones', 'integer', 'exists:unidades_medida,id', 'different:conversiones.*.unidad_base_id'],
            'conversiones.*.factor_conversion' => ['required_with:conversiones', 'numeric', 'gt:0'],
            'conversiones.*.activo'    => ['nullable', 'boolean'],
            'conversiones.*.es_conversion_principal' => ['nullable', 'boolean'],

            // Campos de medicamentos (para farmacias)
            'principio_activo'         => ['nullable', 'string', 'max:255'], // ✨ NUEVO
            'uso_de_medicacion'        => ['nullable', 'string'], // ✨ NUEVO

            'activo'                   => ['nullable', 'boolean'],
        ];
    }

    /**
     * Custom validation messages
     */
    public function messages(): array
    {
        return [
            'nombre.required'                          => 'El nombre del producto es obligatorio.',
            'nombre.string'                            => 'El nombre debe ser texto.',
            'nombre.max'                               => 'El nombre no puede exceder 255 caracteres.',

            'sku.string'                               => 'El SKU debe ser texto.',
            'sku.max'                                  => 'El SKU no puede exceder 20 caracteres.',
            'sku.unique'                               => 'El SKU ya está en uso por otro producto.',

            'descripcion.string'                       => 'La descripción debe ser texto.',

            'peso.numeric'                             => 'El peso debe ser un número.',
            'peso.min'                                 => 'El peso no puede ser negativo.',

            'numero.string'                            => 'El número debe ser texto.',
            'numero.max'                               => 'El número no puede exceder 255 caracteres.',

            'fecha_vencimiento.date'                   => 'La fecha de vencimiento debe ser una fecha válida.',

            'unidad_medida_id.exists'                  => 'La unidad de medida seleccionada no existe.',
            'categoria_id.exists'                      => 'La categoría seleccionada no existe.',
            'marca_id.exists'                          => 'La marca seleccionada no existe.',
            'proveedor_id.exists'                      => 'El proveedor seleccionado no existe.',

            'stock_minimo.integer'                     => 'El stock mínimo debe ser un número entero.',
            'stock_minimo.min'                         => 'El stock mínimo no puede ser negativo.',

            'stock_maximo.integer'                     => 'El stock máximo debe ser un número entero.',
            'stock_maximo.min'                         => 'El stock máximo no puede ser negativo.',

            'limite_venta.integer'                     => 'El límite de venta debe ser un número entero.', // ✨ NUEVO
            'limite_venta.min'                         => 'El límite de venta debe ser mayor que 0.',       // ✨ NUEVO

            'precios.array'                            => 'Los precios deben ser un arreglo.',
            'precios.*.monto.required_with'            => 'El monto del precio es obligatorio.',
            'precios.*.monto.numeric'                  => 'El monto del precio debe ser un número.',
            'precios.*.monto.min'                      => 'El monto del precio no puede ser negativo.',
            'precios.*.tipo_precio_id.integer'         => 'El tipo de precio debe ser un ID numérico.',
            'precios.*.tipo_precio_id.in'              => 'El tipo de precio seleccionado no existe o no está activo.',
            'precios.*.unidad_medida_id.integer'       => 'El ID de la unidad de medida debe ser un número entero.',
            'precios.*.unidad_medida_id.exists'        => 'La unidad de medida seleccionada no existe.',

            'codigos.array'                            => 'Los códigos deben ser un arreglo.',
            'codigos.*.string'                         => 'Cada código debe ser texto.',
            'codigos.*.max'                            => 'Cada código no puede exceder 255 caracteres.',

            'perfil.file'                              => 'La foto de perfil debe ser un archivo válido.',
            'perfil.image'                             => 'La foto de perfil debe ser una imagen válida.',
            'perfil.max'                               => 'La foto de perfil no puede exceder 4MB.',

            'galeria.array'                            => 'La galería debe ser un arreglo.',
            'galeria.*.file'                           => 'Cada imagen de la galería debe ser un archivo válido.',
            'galeria.*.image'                          => 'Cada imagen de la galería debe ser una imagen válida.',
            'galeria.*.max'                            => 'Cada imagen de la galería no puede exceder 4MB.',

            'galeria_eliminar.array'                   => 'Las imágenes a eliminar deben ser un arreglo.',
            'galeria_eliminar.*.integer'               => 'Cada ID de imagen debe ser un número entero.',
            'galeria_eliminar.*.exists'                => 'Una de las imágenes seleccionadas no existe.',

            'remove_perfil.boolean'                    => 'El indicador de eliminar perfil debe ser verdadero o falso.',

            'es_fraccionado.boolean'                   => 'El campo fraccionado debe ser verdadero o falso.',
            'conversiones.array'                       => 'Las conversiones deben ser un arreglo.',
            'conversiones.*.unidad_base_id.required_with' => 'La unidad base es obligatoria en cada conversión.',
            'conversiones.*.unidad_base_id.integer'    => 'La unidad base debe ser un ID numérico.',
            'conversiones.*.unidad_base_id.exists'     => 'La unidad base seleccionada no existe.',
            'conversiones.*.unidad_destino_id.required_with' => 'La unidad destino es obligatoria en cada conversión.',
            'conversiones.*.unidad_destino_id.integer' => 'La unidad destino debe ser un ID numérico.',
            'conversiones.*.unidad_destino_id.exists'  => 'La unidad destino seleccionada no existe.',
            'conversiones.*.unidad_destino_id.different' => 'La unidad destino no puede ser igual a la unidad base.',
            'conversiones.*.factor_conversion.required_with' => 'El factor de conversión es obligatorio en cada conversión.',
            'conversiones.*.factor_conversion.numeric' => 'El factor de conversión debe ser un número.',
            'conversiones.*.factor_conversion.gt'      => 'El factor de conversión debe ser mayor que 0.',
            'conversiones.*.activo.boolean'            => 'El estado activo debe ser verdadero o falso.',
            'conversiones.*.es_conversion_principal.boolean' => 'El estado de conversión principal debe ser verdadero o falso.',

            'principio_activo.string'                  => 'El principio activo debe ser texto.',
            'principio_activo.max'                     => 'El principio activo no puede exceder 255 caracteres.',
            'uso_de_medicacion.string'                 => 'El uso de medicación debe ser texto.',

            'activo.boolean'                           => 'El estado activo debe ser verdadero o falso.',
        ];
    }

    /**
     * Custom attribute names for better error messages
     */
    public function attributes(): array
    {
        return [
            'nombre'            => 'nombre del producto',
            'sku'               => 'SKU',
            'descripcion'       => 'descripción',
            'peso'              => 'peso',
            'unidad_medida_id'  => 'unidad de medida',
            'numero'            => 'número',
            'fecha_vencimiento' => 'fecha de vencimiento',
            'categoria_id'      => 'categoría',
            'marca_id'          => 'marca',
            'proveedor_id'      => 'proveedor',
            'stock_minimo'      => 'stock mínimo',
            'stock_maximo'      => 'stock máximo',
            'limite_venta'      => 'límite de venta', // ✨ NUEVO

            'precios'           => 'precios',
            'precios.*.monto'   => 'monto del precio',
            'precios.*.tipo_precio_id' => 'tipo de precio',

            'codigos'           => 'códigos',

            'perfil'            => 'foto de perfil',
            'galeria'           => 'galería de imágenes',
            'galeria_eliminar'  => 'imágenes a eliminar',
            'remove_perfil'     => 'eliminar foto de perfil',

            'es_fraccionado'    => 'producto fraccionado',
            'conversiones'      => 'conversiones de unidad',
            'conversiones.*.unidad_base_id' => 'unidad base de conversión',
            'conversiones.*.unidad_destino_id' => 'unidad destino de conversión',
            'conversiones.*.factor_conversion' => 'factor de conversión',
            'conversiones.*.activo' => 'estado de conversión',
            'conversiones.*.es_conversion_principal' => 'conversión principal',

            'principio_activo'  => 'principio activo',
            'uso_de_medicacion' => 'uso de medicación',

            'activo'            => 'estado activo',
        ];
    }

    /**
     * Add custom validation logic after Laravel validation
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validarCodigosDuplicados($validator);
            $this->validarPrecioBase($validator);
            $this->validarCoherenciaPrecios($validator);
            $this->validarProveedorActivo($validator);
            $this->validarMarcaActiva($validator);
            $this->validarCategoriaActiva($validator);
            $this->validarConversiones($validator);
        });
    }

    /**
     * Validar que exista al menos un precio base
     */
    private function validarPrecioBase(Validator $validator): void
    {
        $precios = $this->input('precios', []);

        if (empty($precios)) {
            return;
        }

        $tienePrecioBase = false;

        foreach ($precios as $precio) {
            if (!is_array($precio)) {
                continue;
            }

            $tipoPrecioId = $precio['tipo_precio_id'] ?? null;

            if ($tipoPrecioId) {
                $tipoPrecio = TipoPrecio::find($tipoPrecioId);

                if ($tipoPrecio && $tipoPrecio->es_precio_base) {
                    $tienePrecioBase = true;
                    break;
                }
            }
        }

        if (!$tienePrecioBase && !empty($precios)) {
            $validator->errors()->add('precios',
                'Debe definir un precio base (costo) para el producto.'
            );
        }
    }

    /**
     * Validar que los precios de venta sean mayores al precio base
     * ✅ IMPORTANTE: Solo valida precios de unidad base (unidad_medida_id = NULL)
     * Los precios fraccionados se comparan con su precio base fraccionado, no con el precio base del paquete
     */
    private function validarCoherenciaPrecios(Validator $validator): void
    {
        $precios = $this->input('precios', []);

        if (empty($precios)) {
            return;
        }

        // Obtener precio base de la UNIDAD BASE (unidad_medida_id = NULL)
        $precioBase = 0;

        foreach ($precios as $precio) {
            if (!is_array($precio)) {
                continue;
            }

            // ✅ Solo considerar precios de unidad base
            $unidadMedidaId = $precio['unidad_medida_id'] ?? null;
            if ($unidadMedidaId !== null) {
                continue; // Skip precios de unidades fraccionadas
            }

            $tipoPrecioId = $precio['tipo_precio_id'] ?? null;
            $monto = (float) ($precio['monto'] ?? 0);

            if ($tipoPrecioId) {
                $tipoPrecio = TipoPrecio::find($tipoPrecioId);

                if ($tipoPrecio && $tipoPrecio->es_precio_base) {
                    $precioBase = $monto;
                    break;
                }
            }
        }

        // Validar coherencia de precios (SOLO de unidad base)
        foreach ($precios as $index => $precio) {
            if (!is_array($precio)) {
                continue;
            }

            // ✅ Solo validar precios de unidad base
            $unidadMedidaId = $precio['unidad_medida_id'] ?? null;
            if ($unidadMedidaId !== null) {
                continue; // Skip precios de unidades fraccionadas
            }

            $tipoPrecioId = $precio['tipo_precio_id'] ?? null;
            $monto = (float) ($precio['monto'] ?? 0);

            if ($tipoPrecioId) {
                $tipoPrecio = TipoPrecio::find($tipoPrecioId);

                if ($tipoPrecio && !$tipoPrecio->es_precio_base && $monto < $precioBase) {
                    $validator->errors()->add("precios.{$index}.monto",
                        "El precio de {$tipoPrecio->nombre} ({$monto}) no puede ser menor al precio base ({$precioBase})."
                    );
                }
            }
        }
    }

    /**
     * Validar que el proveedor esté activo
     */
    private function validarProveedorActivo(Validator $validator): void
    {
        $proveedorId = $this->input('proveedor_id');

        if ($proveedorId) {
            $proveedor = \App\Models\Proveedor::find($proveedorId);

            if ($proveedor && !$proveedor->activo) {
                $validator->errors()->add('proveedor_id',
                    "El proveedor '{$proveedor->nombre}' está desactivado. Active el proveedor antes de continuar."
                );
            }
        }
    }

    /**
     * Validar que la marca esté activa
     */
    private function validarMarcaActiva(Validator $validator): void
    {
        $marcaId = $this->input('marca_id');

        if ($marcaId) {
            $marca = \App\Models\Marca::find($marcaId);

            if ($marca && !$marca->activo) {
                $validator->errors()->add('marca_id',
                    "La marca '{$marca->nombre}' está desactivada."
                );
            }
        }
    }

    /**
     * Validar que la categoría esté activa
     */
    private function validarCategoriaActiva(Validator $validator): void
    {
        $categoriaId = $this->input('categoria_id');

        if ($categoriaId) {
            $categoria = \App\Models\Categoria::find($categoriaId);

            if ($categoria && !$categoria->activo) {
                $validator->errors()->add('categoria_id',
                    "La categoría '{$categoria->nombre}' está desactivada."
                );
            }
        }
    }

    /**
     * Validar conversiones de unidad para productos fraccionados
     */
    private function validarConversiones(Validator $validator): void
    {
        $esFraccionado = $this->boolean('es_fraccionado');
        $conversiones = $this->input('conversiones', []);

        // Si es fraccionado, debe tener al menos 1 conversión
        if ($esFraccionado && empty($conversiones)) {
            $validator->errors()->add('conversiones',
                'Un producto fraccionado debe tener al menos una conversión de unidad.'
            );
            return;
        }

        if (empty($conversiones)) {
            return;
        }

        // Validar que solo haya 1 conversión principal
        $principalesCount = 0;

        foreach ($conversiones as $index => $conversion) {
            if (!is_array($conversion)) {
                continue;
            }

            if (!empty($conversion['es_conversion_principal'])) {
                $principalesCount++;
            }
        }

        if ($principalesCount > 1) {
            $validator->errors()->add('conversiones',
                'Solo puede existir una conversión principal.'
            );
        }
    }

    /**
     * ✅ NUEVO: Validar que no haya códigos duplicados (excluyendo el producto actual)
     */
    private function validarCodigosDuplicados(Validator $validator): void
    {
        $codigos = $this->input('codigos', []);
        $productoId = $this->route('producto')?->id; // Obtener ID del producto siendo editado

        if (empty($codigos) || !is_array($codigos) || !$productoId) {
            return;
        }

        // Filtrar códigos válidos
        $codigosValidos = array_filter(array_map(function ($c) {
            if (is_string($c)) {
                return trim($c);
            }
            if (is_array($c) && isset($c['codigo'])) {
                return trim($c['codigo']);
            }
            return null;
        }, $codigos));

        if (empty($codigosValidos)) {
            return;
        }

        // Buscar códigos duplicados en la BD (EXCLUYENDO el producto actual)
        $codigosDuplicados = \App\Models\CodigoBarra::whereIn('codigo', $codigosValidos)
            ->where('activo', true)
            ->where('producto_id', '!=', $productoId) // ✅ Excluir este producto
            ->pluck('codigo')
            ->toArray();

        if (!empty($codigosDuplicados)) {
            $codigosStr = implode(', ', $codigosDuplicados);
            $validator->errors()->add('codigos',
                "❌ El código de barra '{$codigosStr}' ya existe en otro producto. Por favor, usa un código único."
            );
        }
    }
}
