// Presentation Layer: Generic table component - Enhanced UI
import { Button } from '@/components/ui/button';
import type { BaseEntity, TableColumn } from '@/domain/generic';

interface GenericTableProps<T extends BaseEntity> {
  entities: T[];
  columns: TableColumn<T>[];
  onEdit: (entity: T) => void;
  onDelete: (entity: T) => void;
  entityName: string;
  isLoading?: boolean;
}

export default function GenericTable<T extends BaseEntity>({
  entities,
  columns,
  onEdit,
  onDelete,
  entityName,
  isLoading = false
}: GenericTableProps<T>) {
  if (entities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 mb-4 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay {entityName}s registrados</h3>
        <p className="text-muted-foreground mb-4">Comienza agregando tu primer {entityName}.</p>
        <div className="flex justify-center">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo {entityName}
          </Button>
        </div>
      </div>
    );
  }

  const renderCellValue = (column: TableColumn<T>, entity: T) => {
    const value = entity[column.key];

    if (column.render) {
      return column.render(value, entity);
    }

    switch (column.type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            value
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              value ? 'bg-emerald-500' : 'bg-red-500'
            }`}></span>
            {value ? 'Activo' : 'Inactivo'}
          </span>
        );
      case 'date':
        return value ? (
          <span className="text-foreground font-medium">
            {new Date(value).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        ) : (
          <span className="text-muted-foreground italic">Sin fecha</span>
        );
      case 'number':
        return typeof value === 'number' ? (
          <span className="font-mono text-foreground font-medium">
            {value.toLocaleString('es-ES')}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      default:
        // Manejar objetos de relación como {id, nombre}
        if (value && typeof value === 'object' && 'nombre' in value) {
          return <span className="text-foreground">{value.nombre || '-'}</span>;
        }
        // Manejar objetos de relación como {id, codigo, nombre} para unidades
        if (value && typeof value === 'object' && 'codigo' in value && 'nombre' in value) {
          return (
            <span className="text-foreground">
              <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded mr-2">
                {value.codigo}
              </span>
              {value.nombre}
            </span>
          );
        }
        return value ? (
          <span className="text-gray-700">{value}</span>
        ) : (
          <span className="text-gray-400 italic">-</span>
        );
    }
  };

  return (
    <div className="bg-card text-foreground rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {entities.map((entity, index) => (
              <tr
                key={entity.id}
                className={`transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-card' : 'bg-secondary/40'
                } hover:bg-muted/60`}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
                    {column.key === 'id' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
                        #{entity.id}
                      </span>
                    ) : (
                      <div className={`${column.key === columns[1]?.key ? 'font-medium text-foreground' : ''}`}>
                        {renderCellValue(column, entity)}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(entity)}
                      disabled={isLoading}
                      className="bg-card hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:border-blue-300 transition-all duration-150"
                      title={`Editar ${entityName}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(entity)}
                      disabled={isLoading}
                      className="bg-card hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:border-red-300 transition-all duration-150"
                      title={`Eliminar ${entityName}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
