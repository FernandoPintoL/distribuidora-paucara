<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelarEnvioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motivo_cancelacion' => 'required|string|min:10|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'motivo_cancelacion.required' => 'El motivo de cancelación es requerido.',
            'motivo_cancelacion.min'      => 'El motivo debe tener al menos 10 caracteres.',
            'motivo_cancelacion.max'      => 'El motivo no puede exceder 500 caracteres.',
        ];
    }
}
