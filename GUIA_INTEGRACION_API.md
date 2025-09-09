# Guía de Integración API - Distribuidora Paucara

Esta guía proporciona ejemplos prácticos de cómo integrar y utilizar la API de Distribuidora Paucara en aplicaciones cliente.

## 🔧 Configuración Inicial

### Base URL y Autenticación

```javascript
const API_BASE_URL = 'http://tu-dominio.com/api';
const API_TOKEN = 'tu-token-de-autenticacion';

const apiClient = {
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
```

## 📋 Ejemplos de Uso por Módulo

### 1. Gestión de Productos

#### Listar productos con paginación

```javascript
async function obtenerProductos(pagina = 1, busqueda = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/productos?page=${pagina}&q=${busqueda}&per_page=20`, {
      method: 'GET',
      headers: apiClient.headers
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      console.log('Productos obtenidos:', resultado.data.data);
      console.log('Total de productos:', resultado.data.total);
      return resultado.data;
    } else {
      throw new Error(resultado.message);
    }
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
}
```

#### Crear un producto

```javascript
async function crearProducto(datosProducto) {
  const productoData = {
    nombre: datosProducto.nombre,
    descripcion: datosProducto.descripcion,
    categoria_id: datosProducto.categoria_id,
    unidad_medida_id: datosProducto.unidad_medida_id,
    precio_compra: parseFloat(datosProducto.precio_compra),
    precio_venta: parseFloat(datosProducto.precio_venta),
    stock_minimo: parseInt(datosProducto.stock_minimo),
    stock_maximo: parseInt(datosProducto.stock_maximo),
    activo: true
  };

  try {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify(productoData)
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      console.log('Producto creado exitosamente:', resultado.data);
      return resultado.data;
    } else {
      throw new Error(resultado.message);
    }
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
}
```

#### Buscar productos (autocompletado)

```javascript
async function buscarProductos(termino) {
  if (termino.length < 2) return [];
  
  try {
    const response = await fetch(`${API_BASE_URL}/productos/buscar?q=${encodeURIComponent(termino)}&limite=10`, {
      method: 'GET',
      headers: apiClient.headers
    });
    
    const resultado = await response.json();
    return resultado.success ? resultado.data : [];
  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
    return [];
  }
}

// Ejemplo de uso con debounce para input de búsqueda
let timeoutBusqueda;
function configurarBusquedaProductos(inputElement, callbackResultados) {
  inputElement.addEventListener('input', function(e) {
    clearTimeout(timeoutBusqueda);
    const termino = e.target.value;
    
    timeoutBusqueda = setTimeout(async () => {
      if (termino.length >= 2) {
        const productos = await buscarProductos(termino);
        callbackResultados(productos);
      } else {
        callbackResultados([]);
      }
    }, 300);
  });
}
```

### 2. Gestión de Clientes

#### Crear cliente con dirección

```javascript
async function crearClienteCompleto(datosCliente) {
  const clienteData = {
    nombre: datosCliente.nombre,
    razon_social: datosCliente.razon_social,
    nit: datosCliente.nit,
    email: datosCliente.email,
    telefono: datosCliente.telefono,
    whatsapp: datosCliente.whatsapp,
    fecha_nacimiento: datosCliente.fecha_nacimiento,
    genero: datosCliente.genero,
    limite_credito: parseFloat(datosCliente.limite_credito || 0),
    activo: true,
    observaciones: datosCliente.observaciones,
    direcciones: [
      {
        direccion: datosCliente.direccion,
        ciudad: datosCliente.ciudad,
        departamento: datosCliente.departamento,
        codigo_postal: datosCliente.codigo_postal,
        es_principal: true
      }
    ]
  };

  try {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify(clienteData)
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      console.log('Cliente creado exitosamente:', resultado.data);
      return resultado.data;
    } else {
      throw new Error(resultado.message);
    }
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}
```

#### Agregar nueva dirección a cliente

```javascript
async function agregarDireccionCliente(clienteId, datosDireccion) {
  const direccionData = {
    direccion: datosDireccion.direccion,
    ciudad: datosDireccion.ciudad,
    departamento: datosDireccion.departamento,
    codigo_postal: datosDireccion.codigo_postal,
    es_principal: datosDireccion.es_principal || false
  };

  try {
    const response = await fetch(`${API_BASE_URL}/clientes/${clienteId}/direcciones`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify(direccionData)
    });
    
    const resultado = await response.json();
    return resultado.success ? resultado.data : null;
  } catch (error) {
    console.error('Error al agregar dirección:', error);
    throw error;
  }
}
```

### 3. Consultas de Inventario

#### Verificar stock de producto

```javascript
async function verificarStockProducto(productoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/inventario/stock-producto/${productoId}`, {
      method: 'GET',
      headers: apiClient.headers
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      const stockInfo = resultado.data;
      console.log(`Stock total del producto ${productoId}:`, stockInfo.stock_total);
      
      // Mostrar stock por almacén
      stockInfo.stock_por_almacen.forEach(stock => {
        console.log(`- ${stock.almacen}: ${stock.cantidad} unidades`);
        if (stock.fecha_vencimiento) {
          console.log(`  Vence: ${stock.fecha_vencimiento}`);
        }
      });
      
      return stockInfo;
    } else {
      throw new Error(resultado.message);
    }
  } catch (error) {
    console.error('Error al verificar stock:', error);
    throw error;
  }
}
```

#### Procesar ajustes de inventario

```javascript
async function procesarAjustesInventario(ajustes) {
  const ajustesData = {
    ajustes: ajustes.map(ajuste => ({
      stock_producto_id: ajuste.stock_producto_id,
      nueva_cantidad: parseInt(ajuste.nueva_cantidad),
      observacion: ajuste.observacion || 'Ajuste de inventario'
    }))
  };

  try {
    const response = await fetch(`${API_BASE_URL}/inventario/ajustes`, {
      method: 'POST',
      headers: apiClient.headers,
      body: JSON.stringify(ajustesData)
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      console.log('Ajustes procesados exitosamente');
      return resultado.data;
    } else {
      throw new Error(resultado.message);
    }
  } catch (error) {
    console.error('Error al procesar ajustes:', error);
    throw error;
  }
}
```

### 4. Reportes y Estadísticas

#### Obtener estadísticas del dashboard

```javascript
async function obtenerEstadisticasInventario() {
  try {
    const response = await fetch(`${API_BASE_URL}/inventario/reportes/estadisticas`, {
      method: 'GET',
      headers: apiClient.headers
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      const stats = resultado.data;
      
      // Mostrar estadísticas principales
      console.log('=== ESTADÍSTICAS DE INVENTARIO ===');
      console.log(`Total de productos: ${stats.total_productos}`);
      console.log(`Productos activos: ${stats.productos_activos}`);
      console.log(`Stock bajo: ${stats.productos_stock_bajo}`);
      console.log(`Próximos a vencer: ${stats.productos_proximos_vencer}`);
      console.log(`Productos vencidos: ${stats.productos_vencidos}`);
      console.log(`Valor total: $${stats.valor_total_inventario}`);
      
      return stats;
    } else {
      throw new Error(resultado.message);
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}
```

#### Obtener productos con stock bajo

```javascript
async function obtenerProductosStockBajo(almacenId = null) {
  try {
    let url = `${API_BASE_URL}/inventario/reportes/stock-bajo`;
    if (almacenId) {
      url += `?almacen_id=${almacenId}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: apiClient.headers
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      console.log('Productos con stock bajo:');
      resultado.data.forEach(producto => {
        console.log(`- ${producto.nombre}: ${producto.stock_actual}/${producto.stock_minimo} unidades`);
      });
      
      return resultado.data;
    } else {
      throw new Error(resultado.message);
    }
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    throw error;
  }
}
```

## 🛠️ Utilidades y Funciones Helper

### Manejo de errores centralizado

```javascript
class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function manejarRespuestaApi(response) {
  const resultado = await response.json();
  
  if (!resultado.success) {
    throw new ApiError(resultado.message, response.status, resultado.data);
  }
  
  return resultado.data;
}

// Wrapper para todas las llamadas API
async function llamadaApi(url, opciones = {}) {
  try {
    const response = await fetch(url, {
      ...opciones,
      headers: {
        ...apiClient.headers,
        ...opciones.headers
      }
    });
    
    return await manejarRespuestaApi(response);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Error de API:', error.message);
      throw error;
    } else {
      console.error('Error de conexión:', error);
      throw new ApiError('Error de conexión con el servidor', 500);
    }
  }
}
```

### Validaciones del lado cliente

```javascript
const validadores = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  telefono: (telefono) => {
    const regex = /^[0-9]{7,8}$/;
    return regex.test(telefono);
  },
  
  nit: (nit) => {
    return nit && nit.length >= 7;
  },
  
  precio: (precio) => {
    const valor = parseFloat(precio);
    return !isNaN(valor) && valor >= 0;
  },
  
  stock: (cantidad) => {
    const valor = parseInt(cantidad);
    return !isNaN(valor) && valor >= 0;
  }
};

function validarProducto(producto) {
  const errores = [];
  
  if (!producto.nombre?.trim()) {
    errores.push('El nombre es requerido');
  }
  
  if (!producto.categoria_id) {
    errores.push('La categoría es requerida');
  }
  
  if (!validadores.precio(producto.precio_venta)) {
    errores.push('El precio de venta debe ser un número mayor o igual a 0');
  }
  
  if (!validadores.stock(producto.stock_minimo)) {
    errores.push('El stock mínimo debe ser un número entero mayor o igual a 0');
  }
  
  return errores;
}

function validarCliente(cliente) {
  const errores = [];
  
  if (!cliente.nombre?.trim()) {
    errores.push('El nombre es requerido');
  }
  
  if (cliente.email && !validadores.email(cliente.email)) {
    errores.push('El email no tiene un formato válido');
  }
  
  if (cliente.telefono && !validadores.telefono(cliente.telefono)) {
    errores.push('El teléfono debe tener 7 u 8 dígitos');
  }
  
  return errores;
}
```

### Cache local para mejorar rendimiento

```javascript
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.expiraciones = new Map();
  }
  
  set(key, value, tiempoExpiracion = 300000) { // 5 minutos por defecto
    this.cache.set(key, value);
    this.expiraciones.set(key, Date.now() + tiempoExpiracion);
  }
  
  get(key) {
    if (this.cache.has(key)) {
      const expiracion = this.expiraciones.get(key);
      if (Date.now() < expiracion) {
        return this.cache.get(key);
      } else {
        this.cache.delete(key);
        this.expiraciones.delete(key);
      }
    }
    return null;
  }
  
  clear() {
    this.cache.clear();
    this.expiraciones.clear();
  }
}

const cache = new ApiCache();

// Ejemplo de uso con cache
async function obtenerCategoriasConCache() {
  const cacheKey = 'categorias';
  let categorias = cache.get(cacheKey);
  
  if (!categorias) {
    console.log('Obteniendo categorías desde API...');
    categorias = await llamadaApi(`${API_BASE_URL}/categorias`);
    cache.set(cacheKey, categorias, 600000); // Cache por 10 minutos
  } else {
    console.log('Usando categorías desde cache');
  }
  
  return categorias;
}
```

## 📱 Ejemplo de Integración Frontend

### Formulario de producto con React

```jsx
import React, { useState, useEffect } from 'react';

function FormularioProducto({ productoId = null, onGuardar, onCancelar }) {
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    marca_id: '',
    unidad_medida_id: '',
    precio_compra: '',
    precio_venta: '',
    stock_minimo: '',
    stock_maximo: '',
    activo: true
  });
  
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState([]);

  useEffect(() => {
    cargarDatos();
    if (productoId) {
      cargarProducto();
    }
  }, [productoId]);

  const cargarDatos = async () => {
    try {
      const [categoriasData, marcasData, unidadesData] = await Promise.all([
        llamadaApi(`${API_BASE_URL}/categorias`),
        llamadaApi(`${API_BASE_URL}/marcas`),
        llamadaApi(`${API_BASE_URL}/unidades`)
      ]);
      
      setCategorias(categoriasData);
      setMarcas(marcasData);
      setUnidades(unidadesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const cargarProducto = async () => {
    try {
      const productoData = await llamadaApi(`${API_BASE_URL}/productos/${productoId}`);
      setProducto(productoData);
    } catch (error) {
      console.error('Error al cargar producto:', error);
    }
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setProducto(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    
    // Validar datos
    const erroresValidacion = validarProducto(producto);
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    
    setCargando(true);
    setErrores([]);
    
    try {
      let productoGuardado;
      if (productoId) {
        productoGuardado = await llamadaApi(`${API_BASE_URL}/productos/${productoId}`, {
          method: 'PUT',
          body: JSON.stringify(producto)
        });
      } else {
        productoGuardado = await llamadaApi(`${API_BASE_URL}/productos`, {
          method: 'POST',
          body: JSON.stringify(producto)
        });
      }
      
      onGuardar(productoGuardado);
    } catch (error) {
      setErrores([error.message]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={manejarSubmit} className="formulario-producto">
      {errores.length > 0 && (
        <div className="errores">
          {errores.map((error, index) => (
            <p key={index} className="error">{error}</p>
          ))}
        </div>
      )}
      
      <div className="campo">
        <label>Nombre *</label>
        <input
          type="text"
          name="nombre"
          value={producto.nombre}
          onChange={manejarCambio}
          required
        />
      </div>
      
      <div className="campo">
        <label>Categoría *</label>
        <select
          name="categoria_id"
          value={producto.categoria_id}
          onChange={manejarCambio}
          required
        >
          <option value="">Seleccionar categoría</option>
          {categorias.map(categoria => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>
      
      <div className="campo">
        <label>Precio de Venta *</label>
        <input
          type="number"
          step="0.01"
          name="precio_venta"
          value={producto.precio_venta}
          onChange={manejarCambio}
          required
        />
      </div>
      
      {/* Más campos... */}
      
      <div className="acciones">
        <button type="submit" disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default FormularioProducto;
```

## 🔍 Consejos de Optimización

### 1. Paginación eficiente

```javascript
// Usar paginación apropiada
const ELEMENTOS_POR_PAGINA = 20; // No más de 50 para mejor rendimiento

async function cargarProductosPaginados(pagina = 1, filtros = {}) {
  const params = new URLSearchParams({
    page: pagina,
    per_page: ELEMENTOS_POR_PAGINA,
    ...filtros
  });
  
  return await llamadaApi(`${API_BASE_URL}/productos?${params}`);
}
```

### 2. Búsqueda con debounce

```javascript
// Evitar múltiples llamadas API durante la escritura
function crearBusquedaConDebounce(callback, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback.apply(this, args), delay);
  };
}

const buscarProductosDebounced = crearBusquedaConDebounce(buscarProductos, 300);
```

### 3. Manejo de estados de carga

```javascript
// Mostrar estados apropiados al usuario
class EstadosUI {
  static mostrarCargando(elemento) {
    elemento.innerHTML = '<div class="spinner">Cargando...</div>';
  }
  
  static mostrarError(elemento, mensaje) {
    elemento.innerHTML = `<div class="error">Error: ${mensaje}</div>`;
  }
  
  static mostrarVacio(elemento, mensaje = 'No hay datos disponibles') {
    elemento.innerHTML = `<div class="vacio">${mensaje}</div>`;
  }
}
```

Esta guía proporciona una base sólida para integrar la API en aplicaciones cliente. Recuerda siempre manejar errores apropiadamente y proporcionar feedback visual al usuario durante las operaciones de carga.
