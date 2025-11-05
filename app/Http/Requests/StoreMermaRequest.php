<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMermaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('inventario.mermas.registrar');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'stock_producto_id' => ['required', 'integer', 'exists:stock_productos,id'],
            'cantidad' => ['required', 'integer', 'min:1'],
            'motivo' => ['required', 'string', 'max:500'],
            'fecha_merma' => ['nullable', 'date', 'before_or_equal:today'],
            'tipo_merma_id' => ['nullable', 'integer', 'exists:tipos_merma,id'],
            'estado_merma_id' => ['nullable', 'integer', 'exists:estado_mermas,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'stock_producto_id.required' => 'El producto es requerido',
            'stock_producto_id.exists' => 'El producto seleccionado no existe',
            'cantidad.required' => 'La cantidad es requerida',
            'cantidad.min' => 'La cantidad debe ser al menos 1',
            'motivo.required' => 'El motivo de la merma es requerido',
            'motivo.max' => 'El motivo no puede exceder 500 caracteres',
            'fecha_merma.before_or_equal' => 'La fecha de merma no puede ser futura',
            'tipo_merma_id.exists' => 'El tipo de merma seleccionado no existe',
            'estado_merma_id.exists' => 'El estado de merma seleccionado no existe',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'stock_producto_id' => 'producto',
            'cantidad' => 'cantidad',
            'motivo' => 'motivo',
            'fecha_merma' => 'fecha de merma',
            'tipo_merma_id' => 'tipo de merma',
            'estado_merma_id' => 'estado de merma',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Si no se proporciona fecha_merma, usar la fecha actual
        if (!$this->has('fecha_merma')) {
            $this->merge([
                'fecha_merma' => now()->toDateString(),
            ]);
        }
    }
}
