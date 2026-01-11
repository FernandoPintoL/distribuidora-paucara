<template>
  <div class="entrega-show">
    <Head title="Detalles de Entrega" />

    <div class="show-container">
      <!-- Encabezado con información de entrega -->
      <div class="entrega-header">
        <div class="header-info">
          <h1>Entrega #{{ entrega.numero_entrega }}</h1>
          <div class="estado-badge" :style="{ backgroundColor: estadoColor }">
            {{ estadoNombre }}
          </div>
        </div>
        <div class="header-actions">
          <button @click="refrescarDatos" class="btn btn-secondary">
            <i class="fas fa-sync"></i> Refrescar
          </button>
          <router-link :to="{ name: 'entregas.index' }" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> Volver
          </router-link>
        </div>
      </div>

      <div class="show-content">
        <!-- Sección izquierda: Mapa -->
        <div class="map-section">
          <div class="map-container">
            <div id="google-map" style="width: 100%; height: 100%; min-height: 600px"></div>
          </div>

          <!-- Info en tiempo real debajo del mapa -->
          <div class="map-info-bar">
            <div class="info-item">
              <span class="label">Velocidad:</span>
              <span class="value">{{ velocidadActual }} km/h</span>
            </div>
            <div class="info-item">
              <span class="label">Rumbo:</span>
              <span class="value">{{ direccionActual }}°</span>
            </div>
            <div class="info-item">
              <span class="label">ETA:</span>
              <span class="value">{{ etaEstimado }}</span>
            </div>
            <div class="info-item">
              <span class="label">Distancia recorrida:</span>
              <span class="value">{{ distanciaRecorrida }} km</span>
            </div>
          </div>
        </div>

        <!-- Sección derecha: Panel de información -->
        <div class="info-section">
          <!-- Información de chofer y vehículo -->
          <div class="card">
            <h3>Información de Entrega</h3>
            <div class="info-group">
              <label>Chofer:</label>
              <p>{{ entrega.chofer?.nombre }} {{ entrega.chofer?.apellidos }}</p>
            </div>
            <div class="info-group">
              <label>Vehículo:</label>
              <p>{{ entrega.vehiculo?.placa }} - {{ entrega.vehiculo?.marca }} {{ entrega.vehiculo?.modelo }}</p>
            </div>
            <div class="info-group">
              <label>Estado:</label>
              <p>{{ estadoNombre }}</p>
            </div>
            <div class="info-group">
              <label>Total de ventas:</label>
              <p>{{ entrega.ventas?.length || 0 }}</p>
            </div>
          </div>

          <!-- Información de SLA (si existe) -->
          <div class="card" v-if="entrega.fecha_entrega_comprometida">
            <h3>Información SLA</h3>
            <div class="info-group">
              <label>Fecha comprometida:</label>
              <p>{{ formatearFecha(entrega.fecha_entrega_comprometida) }}</p>
            </div>
            <div class="info-group" v-if="entrega.ventana_entrega_ini">
              <label>Ventana de entrega:</label>
              <p>
                {{ formatearHora(entrega.ventana_entrega_ini) }} -
                {{ formatearHora(entrega.ventana_entrega_fin) }}
              </p>
            </div>
            <div class="info-group">
              <label>Estado SLA:</label>
              <p :class="estadoSLA">{{ statusSLA }}</p>
            </div>
          </div>

          <!-- Historial de ubicaciones -->
          <div class="card">
            <h3>Historial de Ubicaciones</h3>
            <div class="ubicaciones-list">
              <div class="ubicacion-item" v-for="(ub, idx) in ubicacionesRecientes" :key="ub.id">
                <span class="time">{{ formatearTiempo(ub.timestamp) }}</span>
                <span class="coords">{{ formatearCoords(ub.latitud, ub.longitud) }}</span>
                <span class="speed">{{ ub.velocidad }} km/h</span>
              </div>
              <p v-if="ubicacionesRecientes.length === 0" class="text-muted">
                Esperando ubicaciones...
              </p>
            </div>
          </div>

          <!-- Conexión WebSocket -->
          <div class="card connection-status">
            <h3>Estado de Conexión</h3>
            <div class="status-indicator" :class="{ connected: socketConectado }">
              <span class="dot"></span>
              {{ socketConectado ? 'Conectado' : 'Desconectado' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Head } from '@inertiajs/vue3'
import { usePage, router } from '@inertiajs/vue3'
import io from 'socket.io-client'
import dayjs from 'dayjs'

// Props
const props = defineProps({
  entrega: {
    type: Object,
    required: true
  }
})

// Estado local
const velocidadActual = ref(0)
const direccionActual = ref(0)
const etaEstimado = ref('--')
const distanciaRecorrida = ref(0)
const ubicacionesRecientes = ref([])
const socketConectado = ref(false)

// Mapa
let map
let marker
let polylineRecorrida
let polylineRuta
let infoWindow

// WebSocket
let socket

// Computed properties
const estadoColor = computed(() => {
  return props.entrega.estadoEntregaColor || '#6c757d'
})

const estadoNombre = computed(() => {
  return props.entrega.estadoEntregaNombre || props.entrega.estado || 'Desconocido'
})

const statusSLA = computed(() => {
  if (!props.entrega.fecha_entrega_comprometida) {
    return 'N/A'
  }

  const ahora = dayjs()
  const ventanaFin = dayjs(props.entrega.fecha_entrega_comprometida)
    .hour(parseInt(props.entrega.ventana_entrega_fin?.split(':')[0] || 23))
    .minute(parseInt(props.entrega.ventana_entrega_fin?.split(':')[1] || 59))

  if (ahora.isAfter(ventanaFin)) {
    return 'RETRASADO'
  }
  return 'EN TIEMPO'
})

// Métodos
const formatearFecha = (fecha) => {
  return dayjs(fecha).format('DD/MM/YYYY')
}

const formatearHora = (hora) => {
  if (!hora) return '--'
  return dayjs(hora, 'HH:mm:ss').format('HH:mm')
}

const formatearTiempo = (timestamp) => {
  return dayjs(timestamp).format('HH:mm:ss')
}

const formatearCoords = (lat, lng) => {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

const inicializarMapa = () => {
  // Coordenadas iniciales (primera ubicación o entrega)
  const coordenadas = {
    lat: parseFloat(props.entrega.latitud_actual) || -17.39,
    lng: parseFloat(props.entrega.longitud_actual) || -66.15
  }

  map = new google.maps.Map(document.getElementById('google-map'), {
    center: coordenadas,
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  })

  // Crear marcador inicial
  marker = new google.maps.Marker({
    position: coordenadas,
    map: map,
    title: `Chofer: ${props.entrega.chofer?.nombre}`,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#2196F3',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  })

  // Inicializar polilínea de ruta recorrida
  polylineRecorrida = new google.maps.Polyline({
    path: [coordenadas],
    geodesic: true,
    strokeColor: '#FF5722',
    strokeOpacity: 0.8,
    strokeWeight: 3,
    map: map
  })

  // Info window
  infoWindow = new google.maps.InfoWindow({
    content: `
      <div class="info-window">
        <strong>${props.entrega.numero_entrega}</strong><br/>
        Velocidad: ${velocidadActual.value} km/h<br/>
        Rumbo: ${direccionActual.value}°
      </div>
    `
  })

  infoWindow.open(map, marker)

  // Cargar historial inicial
  cargarHistorial()
}

const cargarHistorial = async () => {
  try {
    const response = await fetch(`/api/tracking/entregas/${props.entrega.id}/ubicaciones`)
    const data = await response.json()

    if (data.success && data.data.ubicaciones) {
      ubicacionesRecientes.value = data.data.ubicaciones.slice(-20) // Últimas 20

      // Dibujar ruta histórica
      const path = data.data.ubicaciones.map(
        u => new google.maps.LatLng(u.latitud, u.longitud)
      )

      if (polylineRecorrida) {
        polylineRecorrida.setPath(path)
      }

      // Posicionar mapa en último punto
      if (path.length > 0) {
        const ultimoPunto = path[path.length - 1]
        map.panTo(ultimoPunto)
      }
    }
  } catch (error) {
    console.error('Error cargando historial:', error)
  }
}

const conectarWebSocket = () => {
  try {
    socket = io('http://localhost:6001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('✅ Conectado a WebSocket')
      socketConectado.value = true
    })

    socket.on('disconnect', () => {
      console.log('❌ Desconectado de WebSocket')
      socketConectado.value = false
    })

    // Escuchar actualizaciones de ubicación
    socket.on('entrega:ubicacion', (data) => {
      console.log('📍 Ubicación actualizada:', data)
      actualizarMapa(data)
      agregarUbicacion(data)
    })

    // Escuchar cambios de estado
    socket.on('entrega:estado_cambio', (data) => {
      console.log('📦 Estado cambió:', data)
      refrescarDatos()
    })

    socket.on('entrega:en_transito', (data) => {
      console.log('📍 En tránsito:', data)
      refrescarDatos()
    })

    socket.on('entrega:entregada', (data) => {
      console.log('✅ Entregada:', data)
      refrescarDatos()
    })

    socket.on('error', (error) => {
      console.error('Error WebSocket:', error)
    })
  } catch (error) {
    console.error('Error conectando WebSocket:', error)
  }
}

const actualizarMapa = (data) => {
  if (!map || !marker) return

  const nuevaPos = new google.maps.LatLng(data.latitud, data.longitud)

  // Actualizar marcador
  marker.setPosition(nuevaPos)

  // Actualizar polilínea
  if (polylineRecorrida) {
    const path = polylineRecorrida.getPath()
    path.push(nuevaPos)
  }

  // Centrar mapa en ubicación actual
  map.panTo(nuevaPos)

  // Actualizar info en tiempo real
  velocidadActual.value = data.velocidad || 0
  direccionActual.value = data.rumbo || 0

  // Actualizar info window
  if (infoWindow) {
    infoWindow.setContent(`
      <div class="info-window">
        <strong>${props.entrega.numero_entrega}</strong><br/>
        Velocidad: ${velocidadActual.value} km/h<br/>
        Rumbo: ${direccionActual.value}°<br/>
        Hora: ${dayjs(data.timestamp).format('HH:mm:ss')}
      </div>
    `)
  }
}

const agregarUbicacion = (data) => {
  // Agregar a listado reciente (máx 20)
  const nuevaUbicacion = {
    id: Date.now(),
    latitud: data.latitud,
    longitud: data.longitud,
    velocidad: data.velocidad,
    timestamp: data.timestamp
  }

  ubicacionesRecientes.value.unshift(nuevaUbicacion)
  if (ubicacionesRecientes.value.length > 20) {
    ubicacionesRecientes.value.pop()
  }
}

const refrescarDatos = async () => {
  try {
    // Refrescar datos de la entrega desde el servidor
    const response = await fetch(`/entregas/${props.entrega.id}`)
    // Inertia se encargará de actualizar los props
  } catch (error) {
    console.error('Error refrescando datos:', error)
  }
}

// Ciclo de vida
onMounted(() => {
  // Esperar a que Google Maps esté disponible
  if (window.google && window.google.maps) {
    inicializarMapa()
  } else {
    console.error('Google Maps no está disponible')
  }

  // Conectar WebSocket
  conectarWebSocket()

  // Refrescar cada 30 segundos
  const refreshInterval = setInterval(() => {
    cargarHistorial()
  }, 30000)

  // Guardar para cleanup
  window.__mapRefreshInterval = refreshInterval
})

onUnmounted(() => {
  // Desconectar WebSocket
  if (socket) {
    socket.disconnect()
  }

  // Limpiar intervalo
  if (window.__mapRefreshInterval) {
    clearInterval(window.__mapRefreshInterval)
  }

  // Limpiar mapa
  if (map) {
    map = null
  }
})
</script>

<style scoped lang="scss">
.entrega-show {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.show-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.entrega-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h1 {
    margin: 0;
    font-size: 28px;
    color: #333;
  }

  .estado-badge {
    display: inline-block;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
    margin-top: 8px;
  }

  .header-actions {
    display: flex;
    gap: 10px;

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 5px;

      &.btn-secondary {
        background-color: #6c757d;
        color: white;

        &:hover {
          background-color: #5a6268;
        }
      }
    }
  }
}

.show-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.map-section {
  display: flex;
  flex-direction: column;
}

.map-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 600px;
  margin-bottom: 15px;
}

.map-info-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;

    .label {
      font-size: 12px;
      color: #666;
      font-weight: bold;
      text-transform: uppercase;
    }

    .value {
      font-size: 16px;
      color: #333;
      font-weight: bold;
    }
  }
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
    color: #333;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 10px;
  }

  .info-group {
    margin-bottom: 15px;

    label {
      display: block;
      font-size: 12px;
      color: #666;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #333;
    }
  }
}

.ubicaciones-list {
  max-height: 300px;
  overflow-y: auto;

  .ubicacion-item {
    display: grid;
    grid-template-columns: 80px 1fr 100px;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 12px;
    align-items: center;

    .time {
      color: #2196F3;
      font-weight: bold;
    }

    .coords {
      color: #666;
      font-family: monospace;
    }

    .speed {
      color: #FF5722;
      font-weight: bold;
      text-align: right;
    }
  }

  .text-muted {
    color: #999;
    font-size: 12px;
    padding: 20px 0;
    text-align: center;
  }
}

.connection-status {
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 4px;
    background-color: #ffebee;
    color: #c62828;
    font-weight: bold;

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #c62828;
      animation: blink 1s infinite;
    }

    &.connected {
      background-color: #e8f5e9;
      color: #2e7d32;

      .dot {
        background-color: #2e7d32;
        animation: none;
      }
    }
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.3;
  }
}

.info-window {
  padding: 10px;
  border-radius: 4px;
  background: white;

  strong {
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
  }

  br {
    display: block;
    height: 5px;
  }
}
</style>
