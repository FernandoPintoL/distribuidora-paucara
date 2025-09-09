// Presentation Layer: Generic form fields component
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BaseFormData, FormField } from '@/domain/generic';

interface GenericFormFieldsProps<F extends BaseFormData> {
  data: F;
  errors: Partial<Record<keyof F, string>>;
  fields: FormField<F>[];
  onChange: (field: keyof F, value: unknown) => void;
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

    // Si el campo tiene un render personalizado, usarlo
    if (typeof field.render === 'function') {
      return field.render({
        value,
        onChange: (v: any) => onChange(field.key, v),
        label: field.label,
        error,
        disabled,
        field,
      });
    }

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

      case 'file':
        {
          const fileValue = value as File | string | null | undefined;
          let previewSrc: string | null = null;
          if (fileValue instanceof File) {
            previewSrc = URL.createObjectURL(fileValue);
          } else if (typeof fileValue === 'string' && fileValue.length > 0) {
            // If it's a stored relative path, prefix with /storage; otherwise assume absolute URL
            previewSrc = fileValue.startsWith('http') || fileValue.startsWith('data:') ? fileValue : `/storage/${fileValue}`;
          }

          return (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 p-4 bg-gray-50/60 dark:bg-neutral-900/40">
              <div className="flex items-center gap-4">
                <label htmlFor={String(field.key)} className="flex-1">
                  <input
                    id={String(field.key)}
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    disabled={disabled}
                    className={`block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
                  />
                </label>
                {fileValue && (
                  <button
                    type="button"
                    onClick={() => onChange(field.key, null)}
                    disabled={disabled}
                    className="text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {previewSrc && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-gray-200 dark:ring-neutral-700 bg-white dark:bg-neutral-800">
                    <img src={previewSrc} alt="Vista previa" className="h-full w-full object-cover" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fileValue instanceof File ? fileValue.name : 'Imagen actual'}
                  </div>
                </div>
              )}

              {!previewSrc && (
                <p className="mt-2 text-xs text-muted-foreground">Formatos aceptados: JPG, PNG, GIF. Tamaño máximo 5MB.</p>
              )}
            </div>
          );
        }

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

  const renderSingleFieldBlock = (field: FormField<F>) => (
    <div key={String(field.key)} className="space-y-2">
      {(!field.render && field.type !== 'boolean') && (
        <Label htmlFor={String(field.key)} className="text-sm font-medium">
          {field.label} {field.required && '*'}
        </Label>
      )}
      {renderField(field)}
      {errors[field.key] && (
        <p className="text-sm text-red-600">{errors[field.key]}</p>
      )}
    </div>
  );

  const rendered: React.ReactNode[] = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const key = String(f.key);
    if (key === 'ci_anverso' && i + 1 < fields.length && String(fields[i + 1].key) === 'ci_reverso') {
      rendered.push(
        <div key="ci-pair" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSingleFieldBlock(f)}
          {renderSingleFieldBlock(fields[i + 1])}
        </div>
      );
      i++;
      continue;
    }
    rendered.push(renderSingleFieldBlock(f));
  }

  return (
    <div className="space-y-6">
      {rendered}
      <p className="text-xs text-muted-foreground">
        * Campos obligatorios
      </p>
    </div>
  );
}
