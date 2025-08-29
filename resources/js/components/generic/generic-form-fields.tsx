// Presentation Layer: Generic form fields component
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BaseFormData, FormField } from '@/domain/generic';

interface GenericFormFieldsProps<F extends BaseFormData> {
  data: F;
  errors: Partial<Record<keyof F, string>>;
  fields: FormField<F>[];
  onChange: (field: keyof F, value: any) => void;
  disabled?: boolean;
}

export default function GenericFormFields<F extends BaseFormData>({
  data,
  errors,
  fields,
  onChange,
  disabled = false
}: GenericFormFieldsProps<F>) {
  const renderField = (field: FormField<F>) => {
    const value = data[field.key];
    const error = errors[field.key];

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={String(field.key)}
            value={String(value || '')}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
          />
        );

      case 'number':
        return (
          <Input
            id={String(field.key)}
            type="number"
            value={value || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={String(field.key)}
              checked={Boolean(value)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor={String(field.key)} className="text-sm font-medium">
              {field.label}
            </Label>
          </div>
        );

      case 'select':
        return (
          <select
            id={String(field.key)}
            value={String(value || '')}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(field.key, e.target.value)}
            disabled={disabled}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default: // text
        return (
          <Input
            id={String(field.key)}
            value={String(value || '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <div key={String(field.key)} className="space-y-2">
          {field.type !== 'boolean' && (
            <Label htmlFor={String(field.key)} className="text-sm font-medium">
              {field.label} {field.required && '*'}
            </Label>
          )}
          {renderField(field)}
          {errors[field.key] && (
            <p className="text-sm text-red-600">{errors[field.key]}</p>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        * Campos obligatorios
      </p>
    </div>
  );
}
