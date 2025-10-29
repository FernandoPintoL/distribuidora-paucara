import React, { useState, useMemo } from 'react';
import { FilaAjusteValidada } from '@/infrastructure/services/ajustesCSV.service';
import SearchSelect, { SelectOption } from '@/presentation/components/ui/search-select';
import InputSearch from '@/presentation/components/ui/input-search';

interface TipoOperacion {
  id: number;
  clave: string;
  label: string;
  direccion: 'entrada' | 'salida';
  requiere_tipo_motivo: string | null;
  requiere_proveedor: boolean;
  requiere_cliente: boolean;
}

interface TablaAjustesPreviewProps {
  filas: FilaAjusteValidada[];
  tiposOperacion: TipoOperacion[];
  tiposAjuste: any[];
  tiposMerma: any[];
  almacenes: any[];
  productos: any[];
  proveedores?: any[];
  clientes?: any[];
  onFilasActualizadas: (filasActualizadas: FilaAjusteValidada[]) => void;
}

export default function TablaAjustesPreview({
  filas: filasInicial,
  tiposOperacion,
  tiposAjuste,
  tiposMerma,
  almacenes,
  productos,
  proveedores = [],
  clientes = [],
  onFilasActualizadas,
}: TablaAjustesPreviewProps) {
  const [filas, setFilas] = useState<FilaAjusteValidada[]>(filasInicial);
  const [filaEditando, setFilaEditando] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const filasFiltradasBusqueda = filas.filter(f =>
    f.producto.toLowerCase().includes(busqueda.toLowerCase())
  );

  /**
   * Obtiene los valores válidos para el campo tipo_motivo basado en la operación seleccionada
   */
  const obtenerOpcionesMotivo = (tipoOperacionClave: string): { id: any; label: string; value: string }[] => {
    const operacion = tiposOperacion.find(o => o.clave === tipoOperacionClave);
    if (!operacion) return [];

    if (operacion.requiere_tipo_motivo === 'tipo_ajuste') {
      return tiposAjuste.map(t => ({
        id: t.id,
        label: `${t.clave} - ${t.label}`,
        value: t.clave,
      }));
    } else if (operacion.requiere_tipo_motivo === 'tipo_merma') {
      return tiposMerma.map(t => ({
        id: t.id,
        label: `${t.clave} - ${t.label}`,
        value: t.clave,
      }));
    } else if (operacion.requiere_proveedor || operacion.requiere_cliente) {
      // Para proveedor/cliente, el tipo_motivo es texto libre
      return [];
    }
    return [];
  };

  /**
   * Convierte las opciones de tipo operación al formato de SelectOption
   */
  const opcionesTiposOperacion = useMemo<SelectOption[]>(() => {
    return tiposOperacion.map(op => ({
      value: op.clave,
      label: op.label,
      description: op.clave,
    }));
  }, [tiposOperacion]);

  /**
   * Convierte las opciones de almacenes al formato de SelectOption
   */
  const opcionesAlmacenes = useMemo<SelectOption[]>(() => {
    return almacenes.map(almacen => ({
      value: almacen.nombre,
      label: almacen.nombre,
      description: almacen.activo ? 'Activo' : 'Inactivo',
      disabled: !almacen.activo,
    }));
  }, [almacenes]);

  /**
   * Obtiene las opciones de motivo como SelectOption
   */
  const obtenerOpcionesMotivoBusqueda = (tipoOperacionClave: string): SelectOption[] => {
    const opciones = obtenerOpcionesMotivo(tipoOperacionClave);
    return opciones.map(op => ({
      value: op.value,
      label: op.label,
    }));
  };

  /**
   * Busca proveedores o clientes según la operación
   */
  const buscarProveedorCliente = async (query: string, tipoOperacionClave: string) => {
    const operacion = tiposOperacion.find(o => o.clave === tipoOperacionClave);

    if (!operacion) return [];

    let lista: any[] = [];
    if (operacion.requiere_proveedor) {
      lista = proveedores;
    } else if (operacion.requiere_cliente) {
      lista = clientes;
    }

    if (!query.trim()) return [];

    const queryLower = query.toLowerCase();
    return lista
      .filter(item =>
        item.nombre?.toLowerCase().includes(queryLower) ||
        item.razon_social?.toLowerCase().includes(queryLower) ||
        item.ci_nit?.toLowerCase().includes(queryLower)
      )
      .map(item => ({
        value: item.id,
        label: item.nombre || item.razon_social,
        description: item.ci_nit || '',
      }));
  };

  const handleCambio = (index: number, campo: keyof FilaAjusteValidada, valor: any) => {
    const filasActualizadas = [...filas];
    const fila = filasActualizadas[index];

    // Actualizar campo
    if (campo === 'cantidad') {
      fila[campo] = valor === '' ? '' : parseInt(valor, 10);
    } else {
      fila[campo] = valor;
    }

    // Si cambia el tipo_operacion, resetear tipo_motivo
    if (campo === 'tipo_operacion') {
      fila.tipo_motivo = '';
    }

    // Revalidar esta fila
    const nuevosErrores: string[] = [];

    if (campo === 'cantidad' || campo === 'tipo_operacion' || campo === 'tipo_motivo') {
      const cantidad = parseInt(String(fila.cantidad), 10);
      if (isNaN(cantidad) || cantidad <= 0) {
        nuevosErrores.push('La cantidad debe ser un número entero positivo');
      }

      // Validar tipo_operacion
      const operacion = tiposOperacion.find(o => o.clave === fila.tipo_operacion);
      if (!operacion) {
        nuevosErrores.push('Tipo de operación no válido');
      } else {
        fila.tipo_operacion_id = operacion.id;

        // Validar tipo_motivo según la operación
        if (operacion.requiere_tipo_motivo === 'tipo_ajuste') {
          const tipoAjuste = tiposAjuste.find(t => t.clave === fila.tipo_motivo);
          if (!tipoAjuste) {
            nuevosErrores.push(`Tipo de ajuste no válido para esta operación`);
          } else {
            fila.tipo_motivo_id = tipoAjuste.id;
          }
        } else if (operacion.requiere_tipo_motivo === 'tipo_merma') {
          const tipoMerma = tiposMerma.find(t => t.clave === fila.tipo_motivo);
          if (!tipoMerma) {
            nuevosErrores.push(`Tipo de merma no válido para esta operación`);
          } else {
            fila.tipo_motivo_id = tipoMerma.id;
          }
        } else if (operacion.requiere_proveedor || operacion.requiere_cliente) {
          if (!fila.tipo_motivo || fila.tipo_motivo.trim().length === 0) {
            nuevosErrores.push(
              `${operacion.requiere_proveedor ? 'Proveedor' : 'Cliente'} es requerido`
            );
          }
        }
      }
    }

    if (campo === 'almacen') {
      const almacen = almacenes.find(a => a.nombre?.toUpperCase() === fila.almacen.toUpperCase());
      if (!almacen) {
        nuevosErrores.push(`Almacén "${fila.almacen}" no encontrado`);
      } else {
        fila.almacen_id = almacen.id;
      }
    }

    fila.errores = nuevosErrores;
    fila.valido = nuevosErrores.length === 0;

    setFilas(filasActualizadas);
    onFilasActualizadas(filasActualizadas);
  };

  const handleEliminarFila = (index: number) => {
    const filasActualizadas = filas.filter((_, i) => i !== index);
    setFilas(filasActualizadas);
    onFilasActualizadas(filasActualizadas);
  };

  const handleDuplicarFila = (index: number) => {
    const filaADuplicar = filas[index];
    const nuevaFila: FilaAjusteValidada = {
      ...filaADuplicar,
      fila: filas.length + 2,
    };
    const filasActualizadas = [...filas, nuevaFila];
    setFilas(filasActualizadas);
    onFilasActualizadas(filasActualizadas);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
            <path fillRule="evenodd" d="M3 7h14v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0V4a1 1 0 011-1h12a1 1 0 011 1v3h1V4a3 3 0 00-3-3H4a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3v-3h-1v3a1 1 0 01-1 1H5a1 1 0 01-1-1V7z" clipRule="evenodd" />
          </svg>
          Vista previa editable ({filas.length} filas)
        </h4>

        {filas.length > 0 && (
          <input
            type="text"
            placeholder="Buscar por producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900">
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Fila
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Producto
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Cantidad
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Tipo Operación
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Tipo Motivo
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Almacén
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Observación
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold text-gray-900 dark:text-gray-100 text-xs">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradasBusqueda.map((fila, index) => {
              const indexOriginal = filas.indexOf(fila);
              const esValida = fila.valido;

              return (
                <React.Fragment key={indexOriginal}>
                  <tr
                    className={`border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      esValida
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-600 dark:text-gray-400">
                      {fila.fila}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      <input
                        type="text"
                        value={fila.producto}
                        onChange={(e) => handleCambio(indexOriginal, 'producto', e.target.value)}
                        onFocus={() => setFilaEditando(indexOriginal)}
                        onBlur={() => setFilaEditando(null)}
                        placeholder="SKU, nombre o código"
                        className={`w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          esValida
                            ? 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                            : 'border-red-300 dark:border-red-600 focus:border-red-500'
                        }`}
                      />
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                      <input
                        type="number"
                        value={fila.cantidad}
                        onChange={(e) => handleCambio(indexOriginal, 'cantidad', e.target.value)}
                        onFocus={() => setFilaEditando(indexOriginal)}
                        onBlur={() => setFilaEditando(null)}
                        className={`w-full px-2 py-1 text-sm border rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          esValida
                            ? 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                            : 'border-red-300 dark:border-red-600 focus:border-red-500'
                        }`}
                      />
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      <SearchSelect
                        value={fila.tipo_operacion}
                        options={opcionesTiposOperacion}
                        onChange={(value) => handleCambio(indexOriginal, 'tipo_operacion', value)}
                        placeholder="Selecciona operación..."
                        searchPlaceholder="Buscar operación..."
                        emptyText="No hay operaciones disponibles"
                        className="w-full"
                      />
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      {fila.tipo_operacion && obtenerOpcionesMotivo(fila.tipo_operacion).length > 0 ? (
                        <SearchSelect
                          value={fila.tipo_motivo}
                          options={obtenerOpcionesMotivoBusqueda(fila.tipo_operacion)}
                          onChange={(value) => handleCambio(indexOriginal, 'tipo_motivo', value)}
                          placeholder="Selecciona motivo..."
                          searchPlaceholder="Buscar motivo..."
                          emptyText="No hay opciones disponibles"
                          className="w-full"
                        />
                      ) : fila.tipo_operacion &&
                        (tiposOperacion.find(o => o.clave === fila.tipo_operacion)?.requiere_proveedor ||
                          tiposOperacion.find(o => o.clave === fila.tipo_operacion)?.requiere_cliente) ? (
                        <InputSearch
                          value={fila.tipo_motivo}
                          onChange={(value) => handleCambio(indexOriginal, 'tipo_motivo', value)}
                          onSearch={(query) => buscarProveedorCliente(query, fila.tipo_operacion)}
                          placeholder={
                            tiposOperacion.find(o => o.clave === fila.tipo_operacion)?.requiere_proveedor
                              ? "Buscar proveedor..."
                              : "Buscar cliente..."
                          }
                          emptyText={
                            tiposOperacion.find(o => o.clave === fila.tipo_operacion)?.requiere_proveedor
                              ? "No hay proveedores disponibles"
                              : "No hay clientes disponibles"
                          }
                          className="w-full"
                        />
                      ) : (
                        <input
                          type="text"
                          value={fila.tipo_motivo}
                          onChange={(e) => handleCambio(indexOriginal, 'tipo_motivo', e.target.value)}
                          onFocus={() => setFilaEditando(indexOriginal)}
                          onBlur={() => setFilaEditando(null)}
                          placeholder="Motivo o detalle"
                          className={`w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                            esValida
                              ? 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                              : 'border-red-300 dark:border-red-600 focus:border-red-500'
                          }`}
                        />
                      )}
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      <SearchSelect
                        value={fila.almacen}
                        options={opcionesAlmacenes}
                        onChange={(value) => handleCambio(indexOriginal, 'almacen', value)}
                        placeholder="Selecciona almacén..."
                        searchPlaceholder="Buscar almacén..."
                        emptyText="No hay almacenes disponibles"
                        className="w-full"
                      />
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                      <input
                        type="text"
                        value={fila.observacion}
                        onChange={(e) => handleCambio(indexOriginal, 'observacion', e.target.value)}
                        onFocus={() => setFilaEditando(indexOriginal)}
                        onBlur={() => setFilaEditando(null)}
                        maxLength={50}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {fila.observacion.length}/50
                      </div>
                    </td>

                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        {esValida ? (
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Mostrar errores debajo de la fila */}
                  {!esValida && (
                    <tr className="bg-red-50 dark:bg-red-900/20 border-b border-gray-300 dark:border-gray-600">
                      <td colSpan={9} className="px-3 py-2">
                        <div className="space-y-1">
                          {fila.errores.map((error, i) => (
                            <div key={i} className="text-red-700 dark:text-red-300 text-xs flex items-start">
                              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filas.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay filas para mostrar
        </div>
      )}
    </div>
  );
}
