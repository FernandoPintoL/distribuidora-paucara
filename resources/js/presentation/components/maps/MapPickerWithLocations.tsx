// Google Maps Picker Component con múltiples ubicaciones - Usando @react-google-maps/api
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { MapPin, Search, Loader2, Navigation, Trash2, Edit, Star } from 'lucide-react';
import LocationModal, { DireccionData } from './LocationModal';

interface MapPickerWithLocationsProps {
    addresses?: DireccionData[];
    onAddressesChange: (addresses: DireccionData[]) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    height?: string;
}

// Coordenadas por defecto - Santa Cruz, Bolivia
const DEFAULT_CENTER = { lat: -17.78629, lng: -63.18117 };
const DEFAULT_ZOOM = 16; // Zoom más cercano para mejor visualización

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

export default function MapPickerWithLocations({
    addresses = [],
    onAddressesChange,
    label = 'Ubicaciones del cliente',
    description = 'Haz clic en el mapa para agregar una nueva ubicación o en un marcador para editarla',
    disabled = false,
    height = '450px'
}: MapPickerWithLocationsProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLatitude, setModalLatitude] = useState(0);
    const [modalLongitude, setModalLongitude] = useState(0);
    const [modalGeocodedAddress, setModalGeocodedAddress] = useState('');
    const [editingAddress, setEditingAddress] = useState<DireccionData | null>(null);

    // InfoWindow state
    const [selectedMarker, setSelectedMarker] = useState<DireccionData | null>(null);

    // Centrar mapa en la primera dirección o en la ubicación por defecto
    useEffect(() => {
        if (addresses.length > 0) {
            const firstAddress = addresses[0];
            setMapCenter({ lat: firstAddress.latitud, lng: firstAddress.longitud });

            // Ajustar el zoom del mapa cuando se cargan direcciones existentes
            if (map) {
                map.panTo({ lat: firstAddress.latitud, lng: firstAddress.longitud });
                map.setZoom(17); // Zoom más cercano al punto de referencia
            }
        }
        // Si no hay direcciones, simplemente mantener el centro por defecto (Santa Cruz)
        // NO llamar a getCurrentLocation() automáticamente
    }, [addresses, map]);

    // Callback cuando el mapa se carga
    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    // Callback cuando el mapa se desmonta
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Obtener ubicación actual del usuario y abrir modal directamente
    const getCurrentLocation = async () => {
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
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                console.log('✅ Ubicación obtenida:', { lat, lng });

                // Centrar el mapa en la ubicación
                setMapCenter({ lat, lng });
                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(17); // Zoom más cercano
                }

                // Hacer geocodificación inversa para obtener la dirección
                const address = await reverseGeocode(lat, lng);

                setIsGettingLocation(false);

                // Abrir modal directamente con los datos de ubicación actual
                setModalLatitude(lat);
                setModalLongitude(lng);
                setModalGeocodedAddress(address || 'Mi ubicación actual');
                setEditingAddress(null);
                setIsModalOpen(true);

                // Mensaje de éxito
                console.log('✅ Modal abierto con ubicación actual');
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

    // Manejar clic en el mapa (agregar nueva ubicación)
    const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
        if (disabled || !event.latLng) return;

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Geocodificación inversa para obtener la dirección
        const address = await reverseGeocode(lat, lng);

        // Abrir modal para agregar nueva ubicación
        setModalLatitude(lat);
        setModalLongitude(lng);
        setModalGeocodedAddress(address);
        setEditingAddress(null);
        setIsModalOpen(true);
    }, [disabled]);

    // Geocodificación inversa
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                return response.results[0].formatted_address;
            }
            return '';
        } catch (error) {
            console.error('Error en geocodificación inversa:', error);
            return '';
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
                region: 'BO'
            });

            if (response.results[0]) {
                const location = response.results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                setMapCenter({ lat, lng });

                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(17); // Zoom más cercano para búsqueda
                }
            } else {
                setSearchError('No se encontró la dirección');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setSearchError('Error al buscar la dirección.');
        } finally {
            setIsSearching(false);
        }
    };

    // Manejar guardar ubicación desde el modal
    const handleSaveLocation = (direccion: DireccionData) => {
        if (editingAddress) {
            // Editar ubicación existente
            const updatedAddresses = addresses.map((addr) =>
                addr.id === editingAddress.id ? { ...direccion, id: addr.id } : addr
            );
            onAddressesChange(updatedAddresses);
        } else {
            // Agregar nueva ubicación
            // Si se marca como principal, desmarcar las demás
            const newAddresses = direccion.es_principal
                ? addresses.map((addr) => ({ ...addr, es_principal: false }))
                : addresses;

            onAddressesChange([...newAddresses, direccion]);
        }

        setIsModalOpen(false);
        setEditingAddress(null);
    };

    // Manejar edición de ubicación
    const handleEditAddress = async (address: DireccionData) => {
        setModalLatitude(address.latitud);
        setModalLongitude(address.longitud);
        setModalGeocodedAddress(address.direccion);
        setEditingAddress(address);
        setIsModalOpen(true);
        setSelectedMarker(null);
    };

    // Manejar eliminación de ubicación
    const handleDeleteAddress = (address: DireccionData) => {
        const updatedAddresses = addresses.filter((addr) => addr.id !== address.id);
        onAddressesChange(updatedAddresses);
        setSelectedMarker(null);
    };

    // Manejar marcar como principal
    const handleSetPrincipal = (address: DireccionData) => {
        const updatedAddresses = addresses.map((addr) => ({
            ...addr,
            es_principal: addr.id === address.id,
        }));
        onAddressesChange(updatedAddresses);
        setSelectedMarker(null);
    };

    if (!apiKey) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error de configuración</CardTitle>
                    <CardDescription>
                        La API key de Google Maps no está configurada.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
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
                        {searchError && <p className="text-sm text-destructive">{searchError}</p>}
                        {locationError && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">{locationError}</p>
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
                                {/* Marcadores para cada dirección */}
                                {addresses.map((address, index) => (
                                    <Marker
                                        key={address.id || index}
                                        position={{ lat: address.latitud, lng: address.longitud }}
                                        title={`Dirección ${index + 1}`}
                                        onClick={() => setSelectedMarker(address)}
                                        icon={
                                            address.es_principal
                                                ? {
                                                      url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                                  }
                                                : undefined
                                        }
                                    />
                                ))}

                                {/* InfoWindow para el marcador seleccionado */}
                                {selectedMarker && (
                                    <InfoWindow
                                        position={{ lat: selectedMarker.latitud, lng: selectedMarker.longitud }}
                                        onCloseClick={() => setSelectedMarker(null)}
                                    >
                                        <div className="p-2 max-w-xs">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-sm">
                                                    Dirección #{addresses.findIndex(a => a.id === selectedMarker.id || (a.latitud === selectedMarker.latitud && a.longitud === selectedMarker.longitud)) + 1}
                                                </h3>
                                                {selectedMarker.es_principal && (
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mb-1">{selectedMarker.direccion}</p>
                                            {selectedMarker.observaciones && (
                                                <p className="text-xs text-gray-500 mb-2">{selectedMarker.observaciones}</p>
                                            )}
                                            <div className="flex gap-1 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditAddress(selectedMarker)}
                                                    disabled={disabled}
                                                    className="h-7 text-xs"
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Editar
                                                </Button>
                                                {!selectedMarker.es_principal && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSetPrincipal(selectedMarker)}
                                                        disabled={disabled}
                                                        className="h-7 text-xs"
                                                    >
                                                        <Star className="h-3 w-3 mr-1" />
                                                        Principal
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteAddress(selectedMarker)}
                                                    disabled={disabled}
                                                    className="h-7 text-xs"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMap>
                        </LoadScript>
                    </div>

                    {/* Lista de ubicaciones */}
                    {addresses.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Ubicaciones registradas ({addresses.length})
                            </Label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {addresses.map((address, index) => (
                                    <div
                                        key={address.id || index}
                                        className="flex items-start gap-2 p-2 border rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setMapCenter({ lat: address.latitud, lng: address.longitud });
                                            if (map) {
                                                map.panTo({ lat: address.latitud, lng: address.longitud });
                                                map.setZoom(18); // Zoom muy cercano al hacer clic en la lista
                                            }
                                            setSelectedMarker(address);
                                        }}
                                    >
                                        <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium truncate">Dirección #{index + 1}</p>
                                                {address.es_principal && (
                                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{address.direccion}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ayuda */}
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-start gap-1">
                            <span>💡</span>
                            <span>Haz clic en el mapa para agregar una ubicación o en un marcador para editarla</span>
                        </p>
                        <p className="flex items-start gap-1">
                            <span>📍</span>
                            <span>Usa "Mi ubicación" para agregar tu ubicación actual automáticamente</span>
                        </p>
                        <p className="flex items-start gap-1">
                            <span>⭐</span>
                            <span>Los marcadores azules indican la ubicación principal</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Modal para registrar/editar ubicación */}
            <LocationModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAddress(null);
                }}
                onSave={handleSaveLocation}
                latitude={modalLatitude}
                longitude={modalLongitude}
                geocodedAddress={modalGeocodedAddress}
                existingData={editingAddress}
            />
        </>
    );
}
