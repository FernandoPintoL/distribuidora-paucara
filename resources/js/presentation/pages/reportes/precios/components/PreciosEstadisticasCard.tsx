import { Card, CardContent } from '@/presentation/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/reportes.utils';
import type { PreciosEstadisticas } from '@/domain/entities/reportes';

interface PreciosEstadisticasCardProps {
  estadisticas: PreciosEstadisticas;
}

export function PreciosEstadisticasCard({ estadisticas }: PreciosEstadisticasCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{estadisticas.total_precios}</p>
            <p className="text-sm text-gray-600">Total Precios</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(estadisticas.precio_promedio)}
            </p>
            <p className="text-sm text-gray-600">Precio Promedio</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(estadisticas.precio_minimo)}
            </p>
            <p className="text-sm text-gray-600">Precio Mínimo</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(estadisticas.precio_maximo)}
            </p>
            <p className="text-sm text-gray-600">Precio Máximo</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{estadisticas.total_productos_con_precio}</p>
            <p className="text-sm text-gray-600">Productos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
