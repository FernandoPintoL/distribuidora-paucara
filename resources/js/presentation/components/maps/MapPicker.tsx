// Google Maps Picker Component
import React, { useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { MapPin, Search, Loader2 } from 'lucide-react';

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

    // Manejar clic en el mapa
    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (disabled || !event.latLng) return;

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setSelectedPosition({ lat, lng });
        onLocationSelect(lat, lng);

        // Opcional: Hacer geocodificación inversa para obtener la dirección
        reverseGeocode(lat, lng);
    }, [disabled, onLocationSelect]);

    // Geocodificación inversa (opcional)
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const address = response.results[0].formatted_address;
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
            const response = await geocoder.geocode({ address: searchQuery });

            if (response.results[0]) {
                const location = response.results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                setSelectedPosition({ lat, lng });
                setMapCenter({ lat, lng });
                onLocationSelect(lat, lng, response.results[0].formatted_address);
            } else {
                setSearchError('No se encontró la dirección');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setSearchError('Error al buscar la dirección');
        } finally {
            setIsSearching(false);
        }
    };

    // Limpiar ubicación
    const handleClear = () => {
        setSelectedPosition(null);
        setSearchQuery('');
        setSearchError(null);
        onLocationSelect(0, 0);
    };

    if (!apiKey) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error de configuración</CardTitle>
                    <CardDescription>
                        La API key de Google Maps no está configurada. Por favor, configura VITE_GOOGLE_MAPS_API_KEY en tu archivo .env
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
                    <Label htmlFor="address-search">Buscar dirección</Label>
                    <div className="flex gap-2">
                        <Input
                            id="address-search"
                            placeholder="Ej: Av. Cristo Redentor, Santa Cruz"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                </div>

                {/* Mapa */}
                <div className="relative" style={{ height }}>
                    <APIProvider apiKey={apiKey}>
                        <Map
                            defaultCenter={mapCenter}
                            defaultZoom={DEFAULT_ZOOM}
                            mapId="map-picker"
                            onClick={handleMapClick}
                            gestureHandling="greedy"
                            disableDefaultUI={false}
                            className="rounded-lg"
                        >
                            {selectedPosition && (
                                <AdvancedMarker position={selectedPosition}>
                                    <Pin
                                        background="#2563eb"
                                        borderColor="#1e40af"
                                        glyphColor="#ffffff"
                                    />
                                </AdvancedMarker>
                            )}
                        </Map>
                    </APIProvider>
                </div>

                {/* Coordenadas seleccionadas */}
                {selectedPosition && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm">
                            <span className="font-medium">Coordenadas: </span>
                            <span className="text-muted-foreground">
                                {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            disabled={disabled}
                        >
                            Limpiar
                        </Button>
                    </div>
                )}

                {/* Ayuda */}
                <p className="text-xs text-muted-foreground">
                    💡 Puedes hacer clic directamente en el mapa o buscar una dirección para seleccionar la ubicación
                </p>
            </CardContent>
        </Card>
    );
}
