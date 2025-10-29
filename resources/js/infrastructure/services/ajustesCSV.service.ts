/**
 * Servicio para procesar importación de ajustes de inventario desde CSV, XLSX, ODS
 */

export interface FilaAjusteCSV {
  producto: string; // SKU, nombre o código para búsqueda flexible
  cantidad_ajuste: string | number;
  tipo_ajuste: string;
  almacen: string;
  observacion: string;
}

export interface FilaAjusteValidada extends FilaAjusteCSV {
  fila: number;
  valido: boolean;
  errores: string[];
  producto_id?: number;
  tipo_ajuste_id?: number;
  almacen_id?: number;
}

export interface ResultadoValidacion {
  filasValidas: FilaAjusteValidada[];
  filasInvalidas: FilaAjusteValidada[];
  totalFilas: number;
  filasConError: number;
  resumen: {
    productosUnicos: number;
    ajustesTotales: number;
    cantidadTotal: number;
  };
}

class AjustesCSVService {
  /**
   * Normaliza strings removiendo tildes y acentos
   */
  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /**
   * Busca un producto por SKU, nombre o código de forma flexible
   */
  private buscarProducto(busqueda: string, productos: any[]): any | null {
    const busquedaNormalizada = this.normalizarTexto(busqueda);

    // Búsqueda exacta por SKU normalizado
    let producto = productos.find(
      p => this.normalizarTexto(p.sku) === busquedaNormalizada
    );
    if (producto) return producto;

    // Búsqueda exacta por nombre normalizado
    producto = productos.find(
      p => this.normalizarTexto(p.nombre) === busquedaNormalizada
    );
    if (producto) return producto;

    // Búsqueda parcial por nombre normalizado
    producto = productos.find(
      p => this.normalizarTexto(p.nombre).includes(busquedaNormalizada)
    );
    if (producto) return producto;

    // Búsqueda parcial por SKU normalizado
    producto = productos.find(
      p => this.normalizarTexto(p.sku).includes(busquedaNormalizada)
    );
    if (producto) return producto;

    return null;
  }

  /**
   * Busca un almacén por nombre de forma flexible
   */
  private buscarAlmacen(nombre: string, almacenes: any[]): any | null {
    const nombreNormalizado = this.normalizarTexto(nombre);

    // Búsqueda exacta
    let almacen = almacenes.find(
      a => this.normalizarTexto(a.nombre) === nombreNormalizado
    );
    if (almacen) return almacen;

    // Búsqueda parcial
    almacen = almacenes.find(
      a => this.normalizarTexto(a.nombre).includes(nombreNormalizado)
    );
    if (almacen) return almacen;

    return null;
  }

  /**
   * Parsea un archivo CSV y lo convierte en array de objetos
   */
  parsearCSV(contenido: string): FilaAjusteCSV[] {
    const lineas = contenido.trim().split('\n');

    if (lineas.length < 2) {
      throw new Error('El archivo CSV debe contener al menos un encabezado y una fila de datos');
    }

    // Obtener encabezados
    const encabezados = lineas[0].toLowerCase().split(',').map(h => h.trim());

    // Validar encabezados requeridos (ahora usa "producto" en lugar de "sku" y "nombre_producto")
    const encabezadosRequeridos = ['producto', 'cantidad_ajuste', 'tipo_ajuste', 'almacen'];
    const encabezadosFaltantes = encabezadosRequeridos.filter(
      e => !encabezados.includes(e)
    );

    if (encabezadosFaltantes.length > 0) {
      throw new Error(
        `Encabezados faltantes: ${encabezadosFaltantes.join(', ')}\n` +
        `Encabezados esperados: ${encabezadosRequeridos.join(', ')}`
      );
    }

    const filas: FilaAjusteCSV[] = [];

    // Procesar datos
    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split(',').map(v => v.trim());

      if (valores.every(v => v === '')) {
        continue; // Saltar líneas vacías
      }

      const fila: FilaAjusteCSV = {
        producto: valores[encabezados.indexOf('producto')] || '',
        cantidad_ajuste: valores[encabezados.indexOf('cantidad_ajuste')] || '',
        tipo_ajuste: valores[encabezados.indexOf('tipo_ajuste')] || '',
        almacen: valores[encabezados.indexOf('almacen')] || '',
        observacion: valores[encabezados.indexOf('observacion')] || 'Carga masiva CSV',
      };

      filas.push(fila);
    }

    if (filas.length === 0) {
      throw new Error('No se encontraron filas de datos en el archivo CSV');
    }

    return filas;
  }

  /**
   * Valida las filas del CSV contra la base de datos
   */
  async validarFilas(
    filas: FilaAjusteCSV[],
    productos: any[],
    tiposAjuste: any[],
    almacenes: any[]
  ): Promise<ResultadoValidacion> {
    const filasValidas: FilaAjusteValidada[] = [];
    const filasInvalidas: FilaAjusteValidada[] = [];
    const productosProcessados = new Set<string>();

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const filaValidada: FilaAjusteValidada = {
        ...fila,
        fila: i + 2, // Número de fila en el archivo (i+2 porque empieza en 1 y encabezado)
        valido: true,
        errores: [],
      };

      // Validar Producto (búsqueda flexible por SKU, nombre o código)
      const producto = this.buscarProducto(fila.producto, productos);
      if (!producto) {
        filaValidada.errores.push(`Producto "${fila.producto}" no encontrado. Verifica el SKU o nombre.`);
        filaValidada.valido = false;
      } else {
        filaValidada.producto_id = producto.id;
        productosProcessados.add(producto.sku);
      }

      // Validar Tipo de Ajuste (también con normalización)
      let tipoAjuste = tiposAjuste.find(t =>
        this.normalizarTexto(t.clave) === this.normalizarTexto(fila.tipo_ajuste) ||
        this.normalizarTexto(t.label) === this.normalizarTexto(fila.tipo_ajuste)
      );

      // Si no encuentra por normalización exacta, busca parcial
      if (!tipoAjuste) {
        tipoAjuste = tiposAjuste.find(t =>
          this.normalizarTexto(t.clave).includes(this.normalizarTexto(fila.tipo_ajuste)) ||
          this.normalizarTexto(t.label).includes(this.normalizarTexto(fila.tipo_ajuste))
        );
      }

      if (!tipoAjuste) {
        filaValidada.errores.push(
          `Tipo de ajuste "${fila.tipo_ajuste}" no encontrado. Valores válidos: ${tiposAjuste.map(t => t.clave).join(', ')}`
        );
        filaValidada.valido = false;
      } else {
        filaValidada.tipo_ajuste_id = tipoAjuste.id;
      }

      // Validar Almacén (búsqueda flexible con normalización)
      const almacen = this.buscarAlmacen(fila.almacen, almacenes);
      if (!almacen) {
        filaValidada.errores.push(
          `Almacén "${fila.almacen}" no encontrado. Valores válidos: ${almacenes.map(a => a.nombre).join(', ')}`
        );
        filaValidada.valido = false;
      } else {
        filaValidada.almacen_id = almacen.id;
      }

      // Validar Cantidad
      const cantidad = parseInt(String(fila.cantidad_ajuste), 10);
      if (isNaN(cantidad) || cantidad === 0) {
        filaValidada.errores.push('La cantidad debe ser un número entero diferente de 0');
        filaValidada.valido = false;
      }

      // Validar Observación
      if (!fila.observacion || fila.observacion.trim().length === 0) {
        filaValidada.errores.push('La observación es requerida');
        filaValidada.valido = false;
      }

      if (filaValidada.valido) {
        filasValidas.push(filaValidada);
      } else {
        filasInvalidas.push(filaValidada);
      }
    }

    return {
      filasValidas,
      filasInvalidas,
      totalFilas: filas.length,
      filasConError: filasInvalidas.length,
      resumen: {
        productosUnicos: productosProcessados.size,
        ajustesTotales: filasValidas.length,
        cantidadTotal: filasValidas.reduce((sum, f) => sum + parseInt(String(f.cantidad_ajuste), 10), 0),
      },
    };
  }

  /**
   * Genera una plantilla CSV para descargar
   */
  generarPlantillaCSV(tiposAjuste: any[], almacenes: any[]): string {
    const encabezados = ['producto', 'cantidad_ajuste', 'tipo_ajuste', 'almacen', 'observacion'];

    // Crear filas de ejemplo
    const ejemplos = [
      ['PRD001', '10', 'ENTRADA', almacenes[0]?.nombre || 'Almacén 1', 'Recuento físico'],
      ['Producto B', '5', 'SALIDA', almacenes[0]?.nombre || 'Almacén 1', 'Merma por vencimiento'],
      ['', '', '', '', ''],
    ];

    let csv = encabezados.join(',') + '\n';

    ejemplos.forEach(fila => {
      csv += fila.join(',') + '\n';
    });

    // Agregar comentarios de referencia
    csv += '\n# COLUMNA "producto": Ingresa el SKU, nombre o código del producto\n';
    csv += '# COLUMNA "cantidad_ajuste": Número positivo (entrada) o negativo (salida)\n';
    csv += '# COLUMNA "tipo_ajuste": Valores válidos:\n';
    tiposAjuste.forEach(t => {
      csv += `#   - ${t.clave} (${t.label})\n`;
    });

    csv += '# COLUMNA "almacen": Nombre del almacén (se busca de forma flexible)\n';
    almacenes.forEach(a => {
      csv += `#   - ${a.nombre}\n`;
    });

    csv += '# COLUMNA "observacion": Descripción del ajuste (máximo 500 caracteres)\n';
    csv += '\n# NOTA: La búsqueda de productos y almacenes es flexible.\n';
    csv += '# Puedes escribir con o sin tildes, mayúsculas o minúsculas.\n';
    csv += '# Ejemplo: "Almacén" o "almacen" serán encontrados correctamente.\n';

    return csv;
  }

  /**
   * Parsea un archivo XLSX y lo convierte en array de objetos
   */
  async parsearXLSX(archivo: File): Promise<FilaAjusteCSV[]> {
    try {
      // Importar dinamicamente la librería xlsx
      const XLSX = (await import('xlsx')).default;

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const datos = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(datos, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            if (!worksheet) {
              reject(new Error('No se encontró ninguna hoja en el archivo XLSX'));
              return;
            }

            const filas: FilaAjusteCSV[] = [];
            const encabezados = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];

            if (!encabezados || encabezados.length === 0) {
              reject(new Error('El archivo XLSX no contiene encabezados'));
              return;
            }

            const encabezadosNormalizados = encabezados.map(h => h?.toLowerCase().trim() || '');

            // Validar encabezados requeridos
            const encabezadosRequeridos = ['producto', 'cantidad_ajuste', 'tipo_ajuste', 'almacen'];
            const encabezadosFaltantes = encabezadosRequeridos.filter(
              e => !encabezadosNormalizados.includes(e)
            );

            if (encabezadosFaltantes.length > 0) {
              reject(new Error(
                `Encabezados faltantes: ${encabezadosFaltantes.join(', ')}\n` +
                `Encabezados esperados: ${encabezadosRequeridos.join(', ')}`
              ));
              return;
            }

            const datos_json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            datos_json.forEach((fila: any) => {
              // Normalizar las claves del objeto
              const filaObj: any = {};
              Object.keys(fila).forEach(key => {
                const keyNormalizado = key.toLowerCase().trim();
                if (encabezadosRequeridos.includes(keyNormalizado) || keyNormalizado === 'observacion') {
                  filaObj[keyNormalizado] = fila[key] || '';
                }
              });

              // Verificar que no sea una fila vacía
              if (Object.values(filaObj).some(v => v !== '' && v !== null)) {
                filas.push({
                  producto: filaObj.producto || '',
                  cantidad_ajuste: filaObj.cantidad_ajuste || '',
                  tipo_ajuste: filaObj.tipo_ajuste || '',
                  almacen: filaObj.almacen || '',
                  observacion: filaObj.observacion || 'Carga masiva XLSX',
                });
              }
            });

            if (filas.length === 0) {
              reject(new Error('No se encontraron filas de datos en el archivo XLSX'));
              return;
            }

            resolve(filas);
          } catch (error: any) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Error al leer el archivo XLSX'));
        };

        reader.readAsArrayBuffer(archivo);
      });
    } catch (error: any) {
      throw new Error(`Error al procesar archivo XLSX: ${error.message}`);
    }
  }

  /**
   * Parsea un archivo ODS y lo convierte en array de objetos
   */
  async parsearODS(archivo: File): Promise<FilaAjusteCSV[]> {
    try {
      // Importar dinamicamente la librería para ODS
      const odsModule = await import('ods');
      const ods = odsModule.default || odsModule;

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            ods.readFile(archivo, (err: any, data: any) => {
              if (err) {
                reject(new Error(`Error al leer el archivo ODS: ${err.message}`));
                return;
              }

              if (!data || !data.sheets || data.sheets.length === 0) {
                reject(new Error('No se encontró ninguna hoja en el archivo ODS'));
                return;
              }

              const hoja = data.sheets[0];
              const filas: FilaAjusteCSV[] = [];

              if (!hoja.data || hoja.data.length === 0) {
                reject(new Error('La hoja está vacía'));
                return;
              }

              const encabezados = (hoja.data[0] || []).map((h: any) => String(h || '').toLowerCase().trim());

              // Validar encabezados requeridos
              const encabezadosRequeridos = ['producto', 'cantidad_ajuste', 'tipo_ajuste', 'almacen'];
              const encabezadosFaltantes = encabezadosRequeridos.filter(
                e => !encabezados.includes(e)
              );

              if (encabezadosFaltantes.length > 0) {
                reject(new Error(
                  `Encabezados faltantes: ${encabezadosFaltantes.join(', ')}\n` +
                  `Encabezados esperados: ${encabezadosRequeridos.join(', ')}`
                ));
                return;
              }

              // Procesar datos
              for (let i = 1; i < hoja.data.length; i++) {
                const fila = hoja.data[i] || [];

                // Verificar que no sea una fila vacía
                if (fila.every((v: any) => !v || v === '')) {
                  continue;
                }

                const filaObj: FilaAjusteCSV = {
                  producto: String(fila[encabezados.indexOf('producto')] || '').trim(),
                  cantidad_ajuste: String(fila[encabezados.indexOf('cantidad_ajuste')] || '').trim(),
                  tipo_ajuste: String(fila[encabezados.indexOf('tipo_ajuste')] || '').trim(),
                  almacen: String(fila[encabezados.indexOf('almacen')] || '').trim(),
                  observacion: String(fila[encabezados.indexOf('observacion')] || 'Carga masiva ODS').trim(),
                };

                filas.push(filaObj);
              }

              if (filas.length === 0) {
                reject(new Error('No se encontraron filas de datos en el archivo ODS'));
                return;
              }

              resolve(filas);
            });
          } catch (error: any) {
            reject(new Error(`Error al procesar archivo ODS: ${error.message}`));
          }
        };

        reader.onerror = () => {
          reject(new Error('Error al leer el archivo ODS'));
        };

        reader.readAsArrayBuffer(archivo);
      });
    } catch (error: any) {
      throw new Error(`Error al procesar archivo ODS: ${error.message}`);
    }
  }

  /**
   * Parsea cualquier archivo (CSV, XLSX, ODS) automáticamente detectando el formato
   */
  async parsearArchivo(archivo: File): Promise<FilaAjusteCSV[]> {
    const extension = archivo.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      const contenido = await archivo.text();
      return this.parsearCSV(contenido);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.parsearXLSX(archivo);
    } else if (extension === 'ods') {
      return this.parsearODS(archivo);
    } else {
      throw new Error(`Formato de archivo no soportado: ${extension}`);
    }
  }

  /**
   * Descarga un archivo CSV
   */
  descargarCSV(contenido: string, nombreArchivo: string = 'plantilla-ajustes.csv'): void {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    const url = URL.createObjectURL(blob);

    enlace.setAttribute('href', url);
    enlace.setAttribute('download', nombreArchivo);
    enlace.style.visibility = 'hidden';

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  }
}

export default new AjustesCSVService();
