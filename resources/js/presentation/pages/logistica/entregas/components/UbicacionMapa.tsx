import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';

interface UbicacionMapaProps {
    latitud: number;
    longitud: number;
    nombreChofer?: string;
    placa?: string;
    entregaId: number;
}

export default function UbicacionMapa({
    latitud,
    longitud,
    nombreChofer,
    placa,
    entregaId,
}: UbicacionMapaProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Inicializar mapa
    useEffect(() => {
        if (!containerRef.current || !latitud || !longitud) return;

        // Crear mapa
        const map = L.map(containerRef.current).setView(
            [latitud, longitud],
            15
        );

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Crear marcador personalizado
        const markerIcon = L.icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj48cGF0aCBmaWxsPSIjMzM3N2ZmIiBkPSJNMTYgMEM3LjE2IDAgMCA3LjE2IDAgMTZjMCA1LjI1IDIuOTIgOS44MiA3LjI0IDEyLjA4QzEwLjI1IDMzLjUyIDEzIDM3LjAxIDEzIDQwaDZjMC0yLjk5IDIuNzUtNi40OCA1Ljc2LTExLjkyQzI5LjA4IDI1LjgyIDMyIDIxLjI1IDMyIDE2YzAtOC44NC03LjE2LTE2LTE2LTE2em0wIDI0Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48L3N2Zz4=',
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -40],
        });

        const marker = L.marker([latitud, longitud], {
            icon: markerIcon,
        }).addTo(map);

        // Popup con información
        const popupContent = `
            <div style="font-size: 12px; text-align: center;">
                <strong style="display: block; margin-bottom: 4px;">${nombreChofer || 'Chofer'}</strong>
                <span style="display: block; color: #666;">${placa || 'Sin vehículo'}</span>
                <span style="display: block; color: #999; font-size: 10px; margin-top: 4px;">
                    ${latitud.toFixed(6)}, ${longitud.toFixed(6)}
                </span>
            </div>
        `;
        marker.bindPopup(popupContent).openPopup();

        mapRef.current = map;
        markerRef.current = marker;

        // Cleanup
        return () => {
            map.remove();
        };
    }, []);

    // Actualizar posición del marcador cuando cambian coordenadas
    useEffect(() => {
        if (mapRef.current && markerRef.current && latitud && longitud) {
            const newLatLng = L.latLng(latitud, longitud);
            markerRef.current.setLatLng(newLatLng);
            mapRef.current.setView(newLatLng, 15);

            // Actualizar popup
            const popupContent = `
                <div style="font-size: 12px; text-align: center;">
                    <strong style="display: block; margin-bottom: 4px;">${nombreChofer || 'Chofer'}</strong>
                    <span style="display: block; color: #666;">${placa || 'Sin vehículo'}</span>
                    <span style="display: block; color: #999; font-size: 10px; margin-top: 4px;">
                        ${latitud.toFixed(6)}, ${longitud.toFixed(6)}
                    </span>
                </div>
            `;
            markerRef.current.setPopupContent(popupContent);
            setLastUpdate(new Date());
        }
    }, [latitud, longitud, nombreChofer, placa]);

    // Recargar ubicación del servidor
    const handleRefresh = async () => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/entregas/${entregaId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.data?.latitud && result.data?.longitud) {
                    console.log('✅ Ubicación recargada:', {
                        latitud: result.data.latitud,
                        longitud: result.data.longitud,
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error recargando ubicación:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Auto-actualizar ubicación cada 10 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            handleRefresh();
        }, 10000); // 10 segundos

        return () => clearInterval(interval);
    }, [entregaId]);

    if (!latitud || !longitud) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ⚠️ Ubicación no disponible aún
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Botón de actualización */}
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Ubicación en Tiempo Real
                </h3>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isUpdating}
                >
                    <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                    {isUpdating ? 'Actualizando...' : 'Actualizar'}
                </Button>
            </div>

            {/* Mapa */}
            <div
                ref={containerRef}
                className="w-full h-96 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
                style={{ minHeight: '400px' }}
            />

            {/* Info de última actualización */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm">
                <p className="text-blue-700 dark:text-blue-300">
                    <strong>Última actualización:</strong>{' '}
                    {lastUpdate.toLocaleString('es-ES')}
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    💡 Haz clic en el marcador para ver más detalles
                </p>
            </div>
        </div>
    );
}
