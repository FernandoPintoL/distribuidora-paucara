// Google Maps Picker Component - Using @react-google-maps/api
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';

interface MapPickerProps {
    latitude?: number | null;
    longitude?: number | null;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    height?: string;
}

// Coordenadas por defecto - Santa Cruz, Bolivia
const DEFAULT_CENTER = { lat: -17.78629, lng: -63.18117 };
const DEFAULT_ZOOM = 13;

// Estilos del mapa
const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    clickableIcons: false,
    gestureHandling: 'greedy',
    styles: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        }
    ]
};

export default function MapPicker({
    latitude,
    longitude,
    onLocationSelect,
    label = 'Ubicación en el mapa',
    description = 'Haz clic en el mapa para seleccionar una ubicación o busca una dirección',
    disabled = false,
    height = '400px'
}: MapPickerProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
        latitude && longitude ? { lat: latitude, lng: longitude } : DEFAULT_CENTER
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Obtener ubicación actual del usuario al cargar el componente
    useEffect(() => {
        // Solo intentar obtener ubicación si no hay coordenadas previas
        if (!latitude && !longitude) {
            getCurrentLocation();
        }
    }, []);

    // Callback cuando el mapa se carga
    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    // Callback cuando el mapa se desmonta
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Obtener ubicación actual del usuario
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Tu navegador no soporta geolocalización');
            console.error('Geolocalización no soportada');
            return;
        }

        // Verificar si está en HTTPS o localhost
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (!isSecure) {
            setLocationError('⚠️ La geolocalización requiere HTTPS. Accede usando https:// o localhost');
            console.error('Geolocalización bloqueada: Se requiere HTTPS');
            return;
        }

        console.log('🔍 Solicitando ubicación del usuario...');
        setIsGettingLocation(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                console.log('✅ Ubicación obtenida:', { lat, lng });
                setMapCenter({ lat, lng });
                setIsGettingLocation(false);

                // Centrar el mapa si ya está cargado
                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(15);
                }

                // Mensaje de éxito temporal
                setSearchError('✅ Ubicación obtenida correctamente');
                setTimeout(() => setSearchError(null), 3000);
            },
            (error) => {
                setIsGettingLocation(false);
                console.error('❌ Error de geolocalización:', error);

                let errorMsg = '';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = '⚠️ Permiso denegado. Habilita la ubicación en tu navegador (icono de candado en la barra de direcciones)';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = '⚠️ Ubicación no disponible. Verifica tu conexión GPS/WiFi';
                        break;
                    case error.TIMEOUT:
                        errorMsg = '⚠️ Tiempo agotado. Intenta nuevamente';
                        break;
                    default:
                        errorMsg = `⚠️ Error al obtener ubicación: ${error.message}`;
                        break;
                }
                setLocationError(errorMsg);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Manejar clic en el mapa
    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (disabled || !event.latLng) return;

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setSelectedPosition({ lat, lng });
        onLocationSelect(lat, lng);

        // Geocodificación inversa para obtener la dirección
        reverseGeocode(lat, lng);
    }, [disabled, onLocationSelect]);

    // Geocodificación inversa
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const address = response.results[0].formatted_address;
                setSelectedAddress(address);
                onLocationSelect(lat, lng, address);
            }
        } catch (error) {
            console.error('Error en geocodificación inversa:', error);
        }
    };

    // Buscar dirección
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchError('Por favor ingresa una dirección');
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
                address: searchQuery,
                region: 'BO' // Priorizar resultados de Bolivia
            });

            if (response.results[0]) {
                const location = response.results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();
                const address = response.results[0].formatted_address;

                setSelectedPosition({ lat, lng });
                setMapCenter({ lat, lng });
                setSelectedAddress(address);
                onLocationSelect(lat, lng, address);

                // Centrar el mapa en la nueva ubicación
                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(15);
                }
            } else {
                setSearchError('No se encontró la dirección');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setSearchError('Error al buscar la dirección. Verifica tu conexión a internet.');
        } finally {
            setIsSearching(false);
        }
    };

    // Limpiar ubicación
    const handleClear = () => {
        setSelectedPosition(null);
        setSearchQuery('');
        setSearchError(null);
        setSelectedAddress(null);
        setMapCenter(DEFAULT_CENTER);
        onLocationSelect(0, 0);

        if (map) {
            map.panTo(DEFAULT_CENTER);
            map.setZoom(DEFAULT_ZOOM);
        }
    };

    if (!apiKey) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">⚠️ Error de configuración</CardTitle>
                    <CardDescription>
                        La API key de Google Maps no está configurada. Por favor, configura <code className="bg-muted px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> en tu archivo .env
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {label}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Buscador de direcciones */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="address-search">Buscar dirección</Label>
                        <Button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={disabled || isGettingLocation}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                        >
                            {isGettingLocation ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Obteniendo...
                                </>
                            ) : (
                                <>
                                    <Navigation className="h-3 w-3 mr-1" />
                                    Mi ubicación
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            id="address-search"
                            placeholder="Ej: Av. Cristo Redentor, Santa Cruz"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                            disabled={disabled || isSearching}
                        />
                        <Button
                            type="button"
                            onClick={handleSearch}
                            disabled={disabled || isSearching}
                            variant="outline"
                        >
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    {searchError && (
                        <p className="text-sm text-destructive">{searchError}</p>
                    )}
                    {locationError && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <span>⚠️</span>
                            {locationError}
                        </p>
                    )}
                </div>

                {/* Mapa */}
                <div className="relative rounded-lg overflow-hidden border border-border" style={{ height }}>
                    <LoadScript googleMapsApiKey={apiKey} loadingElement={<div className="flex items-center justify-center h-full bg-muted"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={DEFAULT_ZOOM}
                            options={mapOptions}
                            onClick={handleMapClick}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                        >
                            {selectedPosition && (
                                <Marker
                                    position={selectedPosition}
                                    title="Ubicación seleccionada"
                                    animation={google.maps.Animation.DROP}
                                />
                            )}
                        </GoogleMap>
                    </LoadScript>
                </div>

                {/* Ubicación seleccionada */}
                {selectedPosition && (
                    <div className="space-y-2">
                        <div className="flex items-start justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex-1 space-y-1">
                                {selectedAddress && (
                                    <div className="text-sm">
                                        <span className="font-medium">📍 Ubicación: </span>
                                        <span className="text-foreground">{selectedAddress}</span>
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium">Coordenadas: </span>
                                    <span>
                                        {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                disabled={disabled}
                                className="ml-2"
                            >
                                Limpiar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Ayuda */}
                <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-start gap-1">
                        <span>💡</span>
                        <span>Haz clic en el mapa para seleccionar una ubicación o busca una dirección</span>
                    </p>
                    <p className="flex items-start gap-1">
                        <span>📍</span>
                        <span>El mapa se centra automáticamente en tu ubicación actual al cargar (requiere permisos)</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
