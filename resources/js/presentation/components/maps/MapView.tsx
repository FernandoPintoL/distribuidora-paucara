// Componente de visualización de mapa (solo lectura) - Usando @react-google-maps/api
import React, { useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

interface MapViewProps {
    latitude: number;
    longitude: number;
    height?: string;
    zoom?: number;
    markerTitle?: string;
}

// Estilos del mapa
const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: 'cooperative',
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        }
    ]
};

export default function MapView({
    latitude,
    longitude,
    height = '300px',
    zoom = 16,
    markerTitle = 'Ubicación'
}: MapViewProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const [map, setMap] = useState<google.maps.Map | null>(null);

    // Usar useLoadScript hook en lugar de LoadScript component
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey || '',
    });

    const center = { lat: latitude, lng: longitude };

    // Callback cuando el mapa se carga
    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    // Callback cuando el mapa se desmonta
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center p-4 border border-destructive rounded-lg bg-destructive/10">
                <p className="text-sm text-destructive">
                    La API key de Google Maps no está configurada
                </p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex items-center justify-center p-4 border border-destructive rounded-lg bg-destructive/10">
                <p className="text-sm text-destructive">
                    Error al cargar Google Maps
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center border border-border rounded-lg bg-muted" style={{ height }}>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="relative rounded-lg overflow-hidden border border-border" style={{ height }}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={zoom}
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                <Marker
                    position={center}
                    title={markerTitle}
                />
            </GoogleMap>
        </div>
    );
}
