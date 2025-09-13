# Casos de Uso API - Distribuidora Paucara

Este documento describe casos de uso específicos y flujos comunes para trabajar con la API de Distribuidora Paucara.

## 📚 Índice de Casos de Uso

1. [Registro Completo de Producto](#registro-completo-de-producto)
2. [Proceso de Venta](#proceso-de-venta)
3. [Gestión de Inventario](#gestión-de-inventario)
4. [Consulta de Reportes](#consulta-de-reportes)
5. [Integración con Sistema POS](#integración-con-sistema-pos)

---

## 🆕 Registro Completo de Producto

### Flujo: Crear producto nuevo con stock inicial

**Paso 1:** Verificar datos necesarios (categorías, marcas, unidades)
**Paso 2:** Crear el producto
**Paso 3:** Configurar stock inicial por almacén

```javascript
async function registrarProductoCompleto(datosProducto) {
  try {
    // Paso 1: Crear el producto base
    const producto = await fetch(`${API_BASE_URL}/productos`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify({
        nombre: datosProducto.nombre,
        codigo: datosProducto.codigo,
        descripcion: datosProducto.descripcion,
        categoria_id: datosProducto.categoria_id,
        marca_id: datosProducto.marca_id,
        unidad_medida_id: datosProducto.unidad_medida_id,
        precio_compra: datosProducto.precio_compra,
        precio_venta: datosProducto.precio_venta,
        stock_minimo: datosProducto.stock_minimo,
        stock_maximo: datosProducto.stock_maximo,
        activo: true
      })
    }).then(res => res.json());

    if (!producto.success) {
      throw new Error(producto.message);
    }

    console.log('✅ Producto creado:', producto.data.nombre);

    // Paso 2: Registrar stock inicial si se proporciona
    if (datosProducto.stock_inicial && datosProducto.stock_inicial.length > 0) {
      for (const stockAlmacen of datosProducto.stock_inicial) {
        await registrarMovimientoInventario({
          producto_id: producto.data.id,
          almacen_id: stockAlmacen.almacen_id,
          cantidad: stockAlmacen.cantidad,
          tipo: 'ENTRADA_INVENTARIO_INICIAL',
          observacion: 'Stock inicial del producto'
        });
      }
      
      console.log('✅ Stock inicial registrado');
    }

    return producto.data;

  } catch (error) {
    console.error('❌ Error en registro completo:', error.message);
    throw error;
  }
}

// Ejemplo de uso
const nuevoProducto = {
  nombre: "Coca Cola 500ml",
  codigo: "COCA500",
  descripcion: "Bebida gaseosa Coca Cola de 500ml",
  categoria_id: 1, // Bebidas
  marca_id: 2, // Coca Cola
  unidad_medida_id: 1, // Unidad
  precio_compra: 3.50,
  precio_venta: 5.00,
  stock_minimo: 20,
  stock_maximo: 100,
  stock_inicial: [
    { almacen_id: 1, cantidad: 50 }, // Almacén principal
    { almacen_id: 2, cantidad: 25 }  // Almacén secundario
  ]
};

registrarProductoCompleto(nuevoProducto);
```

---

## 🛒 Proceso de Venta

### Flujo: Venta con verificación de stock y actualización automática

**Paso 1:** Buscar cliente o crear nuevo
**Paso 2:** Verificar disponibilidad de productos
**Paso 3:** Crear la venta
**Paso 4:** Actualizar inventario

```javascript
class ProcesadorVentas {
  constructor() {
    this.carrito = [];
    this.cliente = null;
  }

  // Paso 1: Gestionar cliente
  async buscarOCrearCliente(datosCliente) {
    try {
      // Primero buscar si existe
      const clienteExistente = await fetch(
        `${API_BASE_URL}/clientes/buscar?q=${encodeURIComponent(datosCliente.nit || datosCliente.nombre)}`,
        { headers: apiClient.headers }
      ).then(res => res.json());

      if (clienteExistente.success && clienteExistente.data.length > 0) {
        this.cliente = clienteExistente.data[0];
        console.log('👤 Cliente existente encontrado:', this.cliente.nombre);
        return this.cliente;
      }

      // Si no existe, crear nuevo
      const nuevoCliente = await fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: apiClient.headers,
        body: JSON.stringify({
          nombre: datosCliente.nombre,
          nit: datosCliente.nit,
          telefono: datosCliente.telefono,
          email: datosCliente.email,
          activo: true
        })
      }).then(res => res.json());

      if (nuevoCliente.success) {
        this.cliente = nuevoCliente.data;
        console.log('✅ Nuevo cliente creado:', this.cliente.nombre);
        return this.cliente;
      }

      throw new Error(nuevoCliente.message);

    } catch (error) {
      console.error('❌ Error al gestionar cliente:', error);
      throw error;
    }
  }

  // Paso 2: Agregar producto al carrito
  async agregarProductoCarrito(productoId, cantidad, almacenId) {
    try {
      // Verificar stock disponible
      const stockInfo = await fetch(
        `${API_BASE_URL}/inventario/stock-producto/${productoId}`,
        { headers: apiClient.headers }
      ).then(res => res.json());

      if (!stockInfo.success) {
        throw new Error('No se pudo verificar el stock');
      }

      const stockAlmacen = stockInfo.data.stock_por_almacen
        .find(s => s.almacen_id === almacenId);

      if (!stockAlmacen || stockAlmacen.cantidad < cantidad) {
        throw new Error(`Stock insuficiente. Disponible: ${stockAlmacen?.cantidad || 0}`);
      }

      // Obtener datos del producto
      const producto = await fetch(
        `${API_BASE_URL}/productos/${productoId}`,
        { headers: apiClient.headers }
      ).then(res => res.json());

      if (!producto.success) {
        throw new Error('Producto no encontrado');
      }

      // Agregar al carrito
      const itemCarrito = {
        producto_id: productoId,
        producto: producto.data,
        cantidad: cantidad,
        almacen_id: almacenId,
        precio_unitario: producto.data.precio_venta,
        subtotal: cantidad * producto.data.precio_venta
      };

      this.carrito.push(itemCarrito);
      console.log(`🛒 Agregado: ${producto.data.nombre} x${cantidad}`);

      return itemCarrito;

    } catch (error) {
      console.error('❌ Error al agregar producto:', error);
      throw error;
    }
  }

  // Paso 3: Procesar la venta
  async procesarVenta(metodoPago = 'EFECTIVO', observaciones = '') {
    try {
      if (!this.cliente) {
        throw new Error('No hay cliente seleccionado');
      }

      if (this.carrito.length === 0) {
        throw new Error('El carrito está vacío');
      }

      const totalVenta = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);

      // Crear la venta
      const venta = await fetch(`${API_BASE_URL}/ventas`, {
        method: 'POST',
        headers: apiClient.headers,
        body: JSON.stringify({
          cliente_id: this.cliente.id,
          fecha: new Date().toISOString().split('T')[0],
          subtotal: totalVenta,
          total: totalVenta,
          metodo_pago: metodoPago,
          observaciones: observaciones,
          detalles: this.carrito.map(item => ({
            producto_id: item.producto_id,
            almacen_id: item.almacen_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
          }))
        })
      }).then(res => res.json());

      if (!venta.success) {
        throw new Error(venta.message);
      }

      console.log('✅ Venta procesada exitosamente');
      console.log(`📄 Número de venta: ${venta.data.numero}`);
      console.log(`💰 Total: $${totalVenta.toFixed(2)}`);

      // Limpiar carrito
      this.carrito = [];
      this.cliente = null;

      return venta.data;

    } catch (error) {
      console.error('❌ Error al procesar venta:', error);
      throw error;
    }
  }

  // Utilidad: Mostrar resumen del carrito
  mostrarResumenCarrito() {
    console.log('\n🛒 RESUMEN DEL CARRITO:');
    this.carrito.forEach((item, index) => {
      console.log(`${index + 1}. ${item.producto.nombre} x${item.cantidad} = $${item.subtotal.toFixed(2)}`);
    });
    
    const total = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    console.log(`\n💰 TOTAL: $${total.toFixed(2)}\n`);
  }
}

// Ejemplo de uso completo
async function ejemploVentaCompleta() {
  const procesador = new ProcesadorVentas();

  try {
    // 1. Gestionar cliente
    await procesador.buscarOCrearCliente({
      nombre: "Carlos Mendoza",
      nit: "1234567890",
      telefono: "77777777"
    });

    // 2. Agregar productos al carrito
    await procesador.agregarProductoCarrito(1, 2, 1); // 2 unidades del producto 1 del almacén 1
    await procesador.agregarProductoCarrito(3, 1, 1); // 1 unidad del producto 3 del almacén 1

    // 3. Mostrar resumen
    procesador.mostrarResumenCarrito();

    // 4. Procesar venta
    const venta = await procesador.procesarVenta('EFECTIVO', 'Venta de mostrador');

    return venta;

  } catch (error) {
    console.error('❌ Error en proceso de venta:', error);
  }
}
```

---

## 📦 Gestión de Inventario

### Flujo: Recepción de mercancía y actualización de stock

```javascript
async function recibirMercancia(compraId, productos) {
  try {
    console.log('📦 Iniciando recepción de mercancía...');

    const movimientos = [];

    for (const item of productos) {
      // Verificar que el producto existe
      const producto = await fetch(
        `${API_BASE_URL}/productos/${item.producto_id}`,
        { headers: apiClient.headers }
      ).then(res => res.json());

      if (!producto.success) {
        console.warn(`⚠️ Producto ${item.producto_id} no encontrado`);
        continue;
      }

      // Registrar entrada al inventario
      const movimiento = await fetch(`${API_BASE_URL}/inventario/movimientos`, {
        method: 'POST',
        headers: apiClient.headers,
        body: JSON.stringify({
          producto_id: item.producto_id,
          almacen_id: item.almacen_id,
          cantidad: item.cantidad_recibida,
          tipo: 'ENTRADA_COMPRA',
          observacion: `Compra #${compraId} - Lote: ${item.lote || 'Sin lote'}`,
          fecha_vencimiento: item.fecha_vencimiento
        })
      }).then(res => res.json());

      if (movimiento.success) {
        movimientos.push(movimiento.data);
        console.log(`✅ ${producto.data.nombre}: +${item.cantidad_recibida} unidades`);
      } else {
        console.error(`❌ Error con ${producto.data.nombre}:`, movimiento.message);
      }
    }

    console.log(`📊 Recepción completada. ${movimientos.length} movimientos registrados.`);
    return movimientos;

  } catch (error) {
    console.error('❌ Error en recepción de mercancía:', error);
    throw error;
  }
}

// Ejemplo de uso
const mercanciaRecibida = [
  {
    producto_id: 1,
    almacen_id: 1,
    cantidad_recibida: 100,
    lote: 'L2024001',
    fecha_vencimiento: '2024-12-31'
  },
  {
    producto_id: 2,
    almacen_id: 1,
    cantidad_recibida: 50,
    lote: 'L2024002',
    fecha_vencimiento: '2024-06-30'
  }
];

recibirMercancia('COMP-001', mercanciaRecibida);
```

### Flujo: Auditoria de inventario con ajustes

```javascript
async function realizarAuditoriaInventario(almacenId) {
  try {
    console.log(`🔍 Iniciando auditoría del almacén ${almacenId}...`);

    // Obtener stock actual del sistema
    const stockSistema = await fetch(
      `${API_BASE_URL}/inventario/stock-almacen/${almacenId}`,
      { headers: apiClient.headers }
    ).then(res => res.json());

    if (!stockSistema.success) {
      throw new Error('No se pudo obtener el stock del sistema');
    }

    console.log(`📋 Se encontraron ${stockSistema.data.length} productos en el sistema`);

    // Simular conteo físico (en la práctica vendría de una interfaz)
    const conteoFisico = await solicitarConteoFisico(stockSistema.data);

    // Identificar diferencias
    const ajustesNecesarios = [];
    
    for (const item of stockSistema.data) {
      const conteoItem = conteoFisico.find(c => c.producto_id === item.producto_id);
      if (conteoItem && conteoItem.cantidad_fisica !== item.cantidad_sistema) {
        ajustesNecesarios.push({
          stock_producto_id: item.id,
          cantidad_sistema: item.cantidad_sistema,
          cantidad_fisica: conteoItem.cantidad_fisica,
          diferencia: conteoItem.cantidad_fisica - item.cantidad_sistema,
          producto_nombre: item.producto.nombre
        });
      }
    }

    console.log(`📊 Se encontraron ${ajustesNecesarios.length} diferencias`);

    // Procesar ajustes
    if (ajustesNecesarios.length > 0) {
      const ajustes = ajustesNecesarios.map(ajuste => ({
        stock_producto_id: ajuste.stock_producto_id,
        nueva_cantidad: ajuste.cantidad_fisica,
        observacion: `Ajuste por auditoría - Diferencia: ${ajuste.diferencia > 0 ? '+' : ''}${ajuste.diferencia}`
      }));

      const resultado = await fetch(`${API_BASE_URL}/inventario/ajustes`, {
        method: 'POST',
        headers: apiClient.headers,
        body: JSON.stringify({ ajustes })
      }).then(res => res.json());

      if (resultado.success) {
        console.log('✅ Ajustes procesados exitosamente');
        
        // Mostrar resumen
        ajustesNecesarios.forEach(ajuste => {
          const tipo = ajuste.diferencia > 0 ? 'Faltante' : 'Sobrante';
          console.log(`- ${ajuste.producto_nombre}: ${tipo} de ${Math.abs(ajuste.diferencia)} unidades`);
        });
      }
    } else {
      console.log('✅ No se encontraron diferencias. El inventario está correcto.');
    }

    return ajustesNecesarios;

  } catch (error) {
    console.error('❌ Error en auditoría:', error);
    throw error;
  }
}

// Simular interfaz de conteo físico
async function solicitarConteoFisico(productosEnSistema) {
  // En la práctica, esto sería una interfaz donde el usuario ingresa las cantidades físicas
  console.log('👥 Solicitando conteo físico al personal...');
  
  // Simulación de conteo con algunas diferencias
  return productosEnSistema.map(item => ({
    producto_id: item.producto_id,
    cantidad_fisica: item.cantidad_sistema + (Math.random() > 0.8 ? Math.floor(Math.random() * 5) - 2 : 0)
  }));
}
```

---

## 📊 Consulta de Reportes

### Flujo: Dashboard ejecutivo con múltiples métricas

```javascript
class DashboardEjecutivo {
  constructor() {
    this.metricas = {};
  }

  async generarReporteDiario(fecha = null) {
    const fechaReporte = fecha || new Date().toISOString().split('T')[0];
    
    try {
      console.log(`📈 Generando reporte del ${fechaReporte}...`);

      // Obtener múltiples métricas en paralelo
      const [
        estadisticasInventario,
        ventasDelDia,
        productosStockBajo,
        productosProximosVencer,
        movimientosDelDia
      ] = await Promise.all([
        this.obtenerEstadisticasInventario(),
        this.obtenerVentasDelDia(fechaReporte),
        this.obtenerProductosStockBajo(),
        this.obtenerProductosProximosVencer(),
        this.obtenerMovimientosDelDia(fechaReporte)
      ]);

      // Compilar reporte
      const reporte = {
        fecha: fechaReporte,
        inventario: estadisticasInventario,
        ventas: ventasDelDia,
        alertas: {
          stock_bajo: productosStockBajo,
          proximos_vencer: productosProximosVencer
        },
        movimientos: movimientosDelDia,
        generado_en: new Date().toISOString()
      };

      this.mostrarResumenEjecutivo(reporte);
      return reporte;

    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw error;
    }
  }

  async obtenerEstadisticasInventario() {
    const response = await fetch(`${API_BASE_URL}/inventario/reportes/estadisticas`, {
      headers: apiClient.headers
    });
    const resultado = await response.json();
    return resultado.success ? resultado.data : {};
  }

  async obtenerVentasDelDia(fecha) {
    const response = await fetch(
      `${API_BASE_URL}/ventas?fecha=${fecha}&estado=completada`,
      { headers: apiClient.headers }
    );
    const resultado = await response.json();
    
    if (resultado.success) {
      const ventas = resultado.data.data;
      return {
        total_ventas: ventas.length,
        monto_total: ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0),
        promedio_venta: ventas.length > 0 ? ventas.reduce((sum, venta) => sum + parseFloat(venta.total), 0) / ventas.length : 0
      };
    }
    return { total_ventas: 0, monto_total: 0, promedio_venta: 0 };
  }

  async obtenerProductosStockBajo() {
    const response = await fetch(`${API_BASE_URL}/inventario/reportes/stock-bajo`, {
      headers: apiClient.headers
    });
    const resultado = await response.json();
    return resultado.success ? resultado.data : [];
  }

  async obtenerProductosProximosVencer(dias = 30) {
    const response = await fetch(
      `${API_BASE_URL}/inventario/reportes/proximos-vencer?dias=${dias}`,
      { headers: apiClient.headers }
    );
    const resultado = await response.json();
    return resultado.success ? resultado.data : [];
  }

  async obtenerMovimientosDelDia(fecha) {
    const response = await fetch(
      `${API_BASE_URL}/inventario/movimientos?fecha_inicio=${fecha}&fecha_fin=${fecha}`,
      { headers: apiClient.headers }
    );
    const resultado = await response.json();
    
    if (resultado.success) {
      const movimientos = resultado.data.data;
      return {
        total_movimientos: movimientos.length,
        entradas: movimientos.filter(m => m.cantidad > 0).length,
        salidas: movimientos.filter(m => m.cantidad < 0).length
      };
    }
    return { total_movimientos: 0, entradas: 0, salidas: 0 };
  }

  mostrarResumenEjecutivo(reporte) {
    console.log(`\n📊 REPORTE EJECUTIVO - ${reporte.fecha}`);
    console.log('=' .repeat(50));
    
    // Inventario
    console.log('\n📦 INVENTARIO:');
    console.log(`   Total productos: ${reporte.inventario.total_productos || 0}`);
    console.log(`   Valor total: $${(reporte.inventario.valor_total_inventario || 0).toFixed(2)}`);
    
    // Ventas
    console.log('\n💰 VENTAS DEL DÍA:');
    console.log(`   Número de ventas: ${reporte.ventas.total_ventas}`);
    console.log(`   Monto total: $${reporte.ventas.monto_total.toFixed(2)}`);
    console.log(`   Promedio por venta: $${reporte.ventas.promedio_venta.toFixed(2)}`);
    
    // Alertas
    console.log('\n⚠️  ALERTAS:');
    console.log(`   Productos con stock bajo: ${reporte.alertas.stock_bajo.length}`);
    console.log(`   Productos próximos a vencer: ${reporte.alertas.proximos_vencer.length}`);
    
    // Movimientos
    console.log('\n📈 ACTIVIDAD DE INVENTARIO:');
    console.log(`   Total movimientos: ${reporte.movimientos.total_movimientos}`);
    console.log(`   Entradas: ${reporte.movimientos.entradas}`);
    console.log(`   Salidas: ${reporte.movimientos.salidas}`);
    
    console.log('\n' + '=' .repeat(50));
  }
}

// Ejemplo de uso
async function generarReporteDiarioCompleto() {
  const dashboard = new DashboardEjecutivo();
  
  try {
    const reporte = await dashboard.generarReporteDiario();
    
    // Opcional: Enviar reporte por email o guardarlo
    // await enviarReportePorEmail(reporte);
    // await guardarReporteEnArchivo(reporte);
    
    return reporte;
  } catch (error) {
    console.error('❌ Error al generar reporte diario:', error);
  }
}

// Ejecutar reporte automáticamente
generarReporteDiarioCompleto();
```

---

## 🖥️ Integración con Sistema POS

### Flujo: Sincronización bidireccional con sistema de punto de venta

```javascript
class IntegracionPOS {
  constructor(configuracion) {
    this.config = configuracion;
    this.ultimaSincronizacion = null;
  }

  // Sincronizar productos hacia el POS
  async sincronizarProductosHaciaPOS() {
    try {
      console.log('🔄 Sincronizando productos hacia POS...');

      // Obtener productos activos con precios
      const productos = await fetch(`${API_BASE_URL}/productos?activo=true&per_page=1000`, {
        headers: apiClient.headers
      }).then(res => res.json());

      if (!productos.success) {
        throw new Error('No se pudieron obtener los productos');
      }

      const productosParaPOS = productos.data.data.map(producto => ({
        codigo: producto.codigo || producto.id.toString(),
        nombre: producto.nombre,
        precio: producto.precio_venta,
        categoria: producto.categoria?.nombre || 'Sin categoría',
        activo: producto.activo,
        ultima_actualizacion: new Date().toISOString()
      }));

      // Enviar al sistema POS (simulado)
      const resultadoEnvio = await this.enviarDatosAPOS('productos', productosParaPOS);

      console.log(`✅ ${productosParaPOS.length} productos sincronizados al POS`);
      return resultadoEnvio;

    } catch (error) {
      console.error('❌ Error en sincronización a POS:', error);
      throw error;
    }
  }

  // Recibir ventas del POS y registrarlas en el sistema
  async procesarVentasDePOS() {
    try {
      console.log('📥 Procesando ventas del POS...');

      // Obtener ventas pendientes del POS (simulado)
      const ventasPOS = await this.obtenerVentasPendientesDePOS();

      const ventasProcesadas = [];

      for (const ventaPOS of ventasPOS) {
        try {
          // Convertir formato POS a formato API
          const ventaAPI = await this.convertirVentaPOSaAPI(ventaPOS);

          // Registrar en el sistema
          const venta = await fetch(`${API_BASE_URL}/ventas`, {
            method: 'POST',
            headers: apiClient.headers,
            body: JSON.stringify(ventaAPI)
          }).then(res => res.json());

          if (venta.success) {
            console.log(`✅ Venta POS #${ventaPOS.numero_pos} registrada como #${venta.data.numero}`);
            ventasProcesadas.push({
              pos_id: ventaPOS.id,
              sistema_id: venta.data.id,
              numero_pos: ventaPOS.numero_pos,
              numero_sistema: venta.data.numero
            });

            // Marcar como procesada en el POS
            await this.marcarVentaComoProcesada(ventaPOS.id);
          } else {
            console.error(`❌ Error al procesar venta POS #${ventaPOS.numero_pos}:`, venta.message);
          }

        } catch (error) {
          console.error(`❌ Error con venta POS #${ventaPOS.numero_pos}:`, error);
        }
      }

      console.log(`📊 Procesadas ${ventasProcesadas.length} ventas de ${ventasPOS.length} recibidas del POS`);
      return ventasProcesadas;

    } catch (error) {
      console.error('❌ Error al procesar ventas del POS:', error);
      throw error;
    }
  }

  // Convertir venta del formato POS al formato de la API
  async convertirVentaPOSaAPI(ventaPOS) {
    // Buscar cliente (si existe)
    let clienteId = null;
    if (ventaPOS.cliente_nit) {
      const cliente = await fetch(
        `${API_BASE_URL}/clientes/buscar?q=${ventaPOS.cliente_nit}`,
        { headers: apiClient.headers }
      ).then(res => res.json());

      if (cliente.success && cliente.data.length > 0) {
        clienteId = cliente.data[0].id;
      }
    }

    // Convertir detalles
    const detalles = [];
    for (const detallePOS of ventaPOS.detalles) {
      // Buscar producto por código
      const producto = await fetch(
        `${API_BASE_URL}/productos/buscar?q=${detallePOS.codigo_producto}`,
        { headers: apiClient.headers }
      ).then(res => res.json());

      if (producto.success && producto.data.length > 0) {
        detalles.push({
          producto_id: producto.data[0].id,
          cantidad: detallePOS.cantidad,
          precio_unitario: detallePOS.precio_unitario,
          subtotal: detallePOS.cantidad * detallePOS.precio_unitario
        });
      }
    }

    return {
      cliente_id: clienteId,
      fecha: ventaPOS.fecha,
      subtotal: ventaPOS.subtotal,
      total: ventaPOS.total,
      metodo_pago: ventaPOS.metodo_pago || 'EFECTIVO',
      observaciones: `Venta del POS #${ventaPOS.numero_pos}`,
      detalles: detalles,
      origen: 'POS'
    };
  }

  // Métodos simulados para interacción con POS
  async enviarDatosAPOS(tipo, datos) {
    // Simular envío al POS
    console.log(`📤 Enviando ${datos.length} registros de ${tipo} al POS...`);
    
    // En implementación real, aquí iría la conexión al POS
    // return await pos.sincronizar(tipo, datos);
    
    return { enviados: datos.length, errores: 0 };
  }

  async obtenerVentasPendientesDePOS() {
    // Simular obtención de ventas del POS
    return [
      {
        id: 'pos_001',
        numero_pos: 'V-001-POS',
        fecha: new Date().toISOString().split('T')[0],
        cliente_nit: '1234567890',
        subtotal: 25.00,
        total: 25.00,
        metodo_pago: 'EFECTIVO',
        detalles: [
          {
            codigo_producto: 'PROD001',
            cantidad: 2,
            precio_unitario: 12.50
          }
        ]
      }
    ];
  }

  async marcarVentaComoProcesada(posId) {
    // Simular marcado de venta como procesada
    console.log(`✓ Venta POS ${posId} marcada como procesada`);
    return true;
  }

  // Sincronización completa
  async ejecutarSincronizacionCompleta() {
    try {
      console.log('🔄 Iniciando sincronización completa con POS...');

      // 1. Enviar productos actualizados al POS
      await this.sincronizarProductosHaciaPOS();

      // 2. Procesar ventas pendientes del POS
      await this.procesarVentasDePOS();

      // 3. Actualizar timestamp de última sincronización
      this.ultimaSincronizacion = new Date().toISOString();

      console.log('✅ Sincronización completa finalizada');
      return { exito: true, timestamp: this.ultimaSincronizacion };

    } catch (error) {
      console.error('❌ Error en sincronización completa:', error);
      return { exito: false, error: error.message };
    }
  }
}

// Configurar y ejecutar integración
const integracionPOS = new IntegracionPOS({
  url_pos: 'http://pos-local:8080',
  intervalo_sincronizacion: 300000 // 5 minutos
});

// Ejecutar sincronización cada 5 minutos
setInterval(() => {
  integracionPOS.ejecutarSincronizacionCompleta();
}, 300000);

// Ejecutar primera sincronización
integracionPOS.ejecutarSincronizacionCompleta();
```

---

## 📝 Mejores Prácticas y Consideraciones

### 1. Manejo de Errores Robusto

```javascript
async function operacionConReintentos(operacion, maxIntentos = 3) {
  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      return await operacion();
    } catch (error) {
      console.log(`Intento ${intento} fallido:`, error.message);
      
      if (intento === maxIntentos) {
        throw new Error(`Operación falló después de ${maxIntentos} intentos: ${error.message}`);
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * intento));
    }
  }
}
```

### 2. Validación de Datos Consistente

```javascript
function validarDatosVenta(datosVenta) {
  const errores = [];
  
  if (!datosVenta.cliente_id) {
    errores.push('Cliente es requerido');
  }
  
  if (!datosVenta.detalles || datosVenta.detalles.length === 0) {
    errores.push('Al menos un producto es requerido');
  }
  
  if (datosVenta.total <= 0) {
    errores.push('El total debe ser mayor a 0');
  }
  
  return errores;
}
```

### 3. Logging y Auditoría

```javascript
function registrarOperacion(tipo, datos, resultado) {
  const log = {
    timestamp: new Date().toISOString(),
    tipo: tipo,
    usuario: 'sistema', // O usuario actual
    datos_entrada: datos,
    resultado: resultado,
    exito: resultado.success || false
  };
  
  console.log('📋 Operación registrada:', log);
  
  // En producción: enviar a sistema de logs
  // await enviarALogs(log);
}
```

Estos casos de uso proporcionan una guía completa para las operaciones más comunes con la API de Distribuidora Paucara.
