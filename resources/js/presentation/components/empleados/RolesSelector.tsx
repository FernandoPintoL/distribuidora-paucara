import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import { Button } from '@/presentation/components/ui/button';
import { AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import axios from 'axios';

interface RoleOption {
  value: string;
  label: string;
  description: string;
  permisosCount: number;
  permisos: string[];
  capabilities: Record<string, boolean>;
}

interface RolesSelectorProps {
  value: string[] | undefined;
  onChange: (roles: string[]) => void;
  disabled?: boolean;
  cargo?: string;
  puedeAccederSistema?: boolean;
  label?: string;
  error?: string;
}

export default function RolesSelector({
  value = [],
  onChange,
  disabled = false,
  cargo,
  puedeAccederSistema = false,
  label = 'Roles de Sistema',
  error
}: RolesSelectorProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolSugerido, setRolSugerido] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(value || []);

  // Cargar roles disponibles
  useEffect(() => {
    const cargarRoles = async () => {
      try {
        const response = await axios.get('/empleados-data/roles');
        setRoles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error cargando roles:', err);
        setLoading(false);
      }
    };

    cargarRoles();
  }, []);

  // Obtener rol sugerido cuando cambia el cargo
  useEffect(() => {
    if (!cargo) {
      setRolSugerido(null);
      return;
    }

    const obtenerRolSugerido = async () => {
      try {
        const response = await axios.post('/empleados-data/rol-sugerido', { cargo });
        setRolSugerido(response.data.rolSugerido);
      } catch (err) {
        console.error('Error obteniendo rol sugerido:', err);
        setRolSugerido(null);
      }
    };

    obtenerRolSugerido();
  }, [cargo]);

  const toggleRole = (roleName: string) => {
    if (disabled) return;

    const newRoles = selectedRoles.includes(roleName)
      ? selectedRoles.filter(r => r !== roleName)
      : [...selectedRoles, roleName];

    setSelectedRoles(newRoles);
    onChange(newRoles);
  };

  const sugerirRol = () => {
    if (rolSugerido) {
      setSelectedRoles([rolSugerido]);
      onChange([rolSugerido]);
    }
  };

  if (!puedeAccederSistema) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <label className="text-base font-semibold">{label}</label>
        <div className="text-center py-8">Cargando roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-semibold">{label}</label>
        {rolSugerido && !selectedRoles.includes(rolSugerido) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={sugerirRol}
            className="gap-2"
            disabled={disabled}
          >
            <Lightbulb className="w-4 h-4" />
            Usar sugerencia
          </Button>
        )}
      </div>

      {/* Mostrar rol sugerido */}
      {rolSugerido && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Rol sugerido:</strong> {rolSugerido}
            <p className="text-sm mt-1">
              Basado en el cargo "{cargo}", recomendamos asignar este rol automáticamente.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Grid de roles */}
      <div className="grid gap-3">
        {roles.map((role) => {
          const isSelected = selectedRoles.includes(role.value);
          const isRolSugerido = role.value === rolSugerido;

          return (
            <Card
              key={role.value}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-green-500 border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-700'
                  : isRolSugerido
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700'
                    : 'hover:border-gray-400 dark:hover:border-gray-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleRole(role.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleRole(role.value);
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{role.label}</CardTitle>
                      {isRolSugerido && (
                        <Badge variant="secondary" className="mt-1">
                          Sugerido
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">{role.description}</p>

                {/* Mostrar permisos principales */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Capacidades principales:</p>
                  <ul className="space-y-1">
                    {role.permisos.map((permiso, idx) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                        {permiso}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Badges de módulos */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {role.capabilities.admin && (
                    <Badge variant="destructive" className="text-xs">
                      Admin
                    </Badge>
                  )}
                  {role.capabilities.usuarios && (
                    <Badge variant="secondary" className="text-xs">
                      Usuarios
                    </Badge>
                  )}
                  {role.capabilities.ventas && (
                    <Badge variant="default" className="text-xs bg-blue-600">
                      Ventas
                    </Badge>
                  )}
                  {role.capabilities.compras && (
                    <Badge variant="default" className="text-xs bg-purple-600">
                      Compras
                    </Badge>
                  )}
                  {role.capabilities.inventario && (
                    <Badge variant="default" className="text-xs bg-amber-600">
                      Inventario
                    </Badge>
                  )}
                  {role.capabilities.cajas && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      Cajas
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {role.permisosCount} permisos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedRoles.length > 0 && (
        <div className="pt-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Roles seleccionados ({selectedRoles.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map((rol) => (
              <Badge key={rol} variant="default" className="gap-1">
                {rol}
                <button
                  onClick={() => toggleRole(rol)}
                  className="ml-1 text-white hover:text-gray-200"
                  disabled={disabled}
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
