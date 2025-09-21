// Presentation Layer: Generic form fields component
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import SearchSelect from '@/components/ui/search-select';
import type { BaseFormData, FormField } from '@/domain/generic';

interface GenericFormFieldsProps<F extends BaseFormData> {
  data: F;
  errors: Partial<Record<keyof F, string>>;
  fields: FormField<F>[];
  onChange: (field: keyof F, value: unknown) => void;
  disabled?: boolean;
  loadOptions?: (fieldKey: string) => Promise<Array<{ value: string | number; label: string }>>;
  extraData?: Record<string, unknown>;
}

export default function GenericFormFields<F extends BaseFormData>({
  data,
  errors,
  fields,
  onChange,
  disabled = false,
  loadOptions,
  extraData
}: GenericFormFieldsProps<F>) {
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, Array<{ value: string | number; label: string }>>>({});

  // Cargar opciones dinámicas cuando sea necesario
  useEffect(() => {
    const loadDynamicOptions = async () => {
      if (!loadOptions) return;

      const newOptions: Record<string, Array<{ value: string | number; label: string }>> = {};

      for (const field of fields) {
        if (field.type === 'select' && field.options && field.options.length === 0) {
          try {
            const options = await loadOptions(String(field.key));
            newOptions[String(field.key)] = options;
          } catch (error) {
            console.error(`Error loading options for ${String(field.key)}:`, error);
            newOptions[String(field.key)] = [];
          }
        }
      }

      setDynamicOptions(newOptions);
    };

    loadDynamicOptions();
  }, [fields, loadOptions]);

  const renderField = (field: FormField<F>) => {
    const value = data[field.key];
    const error = errors[field.key];

    // Si el campo tiene un render personalizado, usarlo
    if (typeof field.render === 'function') {
      return field.render({
        value,
        onChange: (v: unknown) => onChange(field.key, v),
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
            value={value ? String(value) : ''}
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
            value={value ? String(value) : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field.key, e.target.value === '' ? null : parseFloat(e.target.value))}
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

      case 'select': {
        const fieldKey = String(field.key);
        const options = dynamicOptions[fieldKey] || field.options || [];

        // Use SearchSelect if field has extraDataKey (for dynamic data like localidades)
        if (field.extraDataKey && extraData?.[field.extraDataKey]) {
          const extraOptions = extraData[field.extraDataKey] as Array<{ id: number; nombre: string; codigo?: string }>;
          const searchSelectOptions = extraOptions.map(opt => ({
            value: opt.id,
            label: opt.codigo ? `${opt.nombre} (${opt.codigo})` : opt.nombre
          }));

          return (
            <SearchSelect
              id={fieldKey}
              placeholder={field.placeholder || 'Seleccionar...'}
              value={value ? String(value) : ''}
              options={searchSelectOptions}
              onChange={(val) => onChange(field.key, val === '' ? null : Number(val))}
              disabled={disabled}
              required={field.required}
              error={error}
              allowClear={!field.required}
            />
          );
        }

        // Use SearchSelect for dynamic options loaded via loadOptions
        if (field.extraDataKey && options.length > 0) {
          return (
            <SearchSelect
              id={fieldKey}
              placeholder={field.placeholder || 'Seleccionar...'}
              value={value ? String(value) : ''}
              options={options.map(opt => ({
                value: String(opt.value),
                label: opt.label
              }))}
              onChange={(val) => onChange(field.key, val === '' ? null : val)}
              disabled={disabled}
              required={field.required}
              error={error}
              allowClear={!field.required}
            />
          );
        }

        // Use regular select for static options
        return (
          <select
            id={fieldKey}
            value={value ? String(value) : ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(field.key, e.target.value === '' ? null : e.target.value)}
            disabled={disabled}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
          >
            <option value="">Seleccionar...</option>
            {options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

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
            value={value ? String(value) : ''}
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
