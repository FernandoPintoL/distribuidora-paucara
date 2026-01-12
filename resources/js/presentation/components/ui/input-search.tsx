import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, X, Plus } from 'lucide-react';

interface SearchOption {
    value: string | number;
    label: string;
    description?: string;
    codigos_barras?: string;
    precio_base?: number;
    stock_total?: number;
}

interface InputSearchProps {
    id?: string;
    label?: string;
    value: string | number | null;
    onChange: (value: string | number | null, option?: SearchOption) => void;
    onSearch: (query: string) => Promise<SearchOption[]>;
    placeholder?: string;
    emptyText?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    allowScanner?: boolean;
    scannerLabel?: string;
    showCreateButton?: boolean;
    onCreateClick?: (searchQuery: string) => void;
    createButtonText?: string;
    showCreateIconButton?: boolean;
    createIconButtonTitle?: string;
    displayValue?: string; // Texto a mostrar cuando el valor cambia desde el exterior
    showSearchButton?: boolean; // Mostrar botón de búsqueda manual
    onSearchButtonClick?: (query: string) => void; // Callback cuando se hace click en el botón de búsqueda
}

export default function InputSearch({
    id,
    label,
    value,
    onChange,
    onSearch,
    placeholder = "Escribir para buscar...",
    emptyText = "No se encontraron resultados",
    error,
    disabled = false,
    required = false,
    className = "",
    allowScanner = false,
    scannerLabel = "Escanear código",
    showCreateButton = false,
    onCreateClick,
    createButtonText = "Crear nuevo",
    showCreateIconButton = false,
    createIconButtonTitle = "Crear nuevo elemento",
    displayValue,
    showSearchButton = false,
    onSearchButtonClick
}: InputSearchProps) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<SearchOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SearchOption | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);

    // Ref para controlar si el usuario está escribiendo activamente
    const isUserTypingRef = useRef(false);
    const lastValueRef = useRef(value);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Debounce de búsqueda - Versión simplificada para evitar bucles infinitos
    useEffect(() => {
        // Solo buscar si query tiene al menos 2 caracteres
        if (!query || query.length < 2) {
            setOptions([]);
            setIsOpen(false);
            return;
        }

        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await onSearch(query);
                setOptions(results);
                setIsOpen(results.length > 0 || (query.length >= 2 && showCreateButton && !!onCreateClick));
                setSelectedIndex(-1); // Reset selection when new results arrive
            } catch (error) {
                console.error('Error en búsqueda:', error);
                setOptions([]);
                setIsOpen(false);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]); // Solo depende de query, ignoramos onSearch para evitar bucles

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Actualizar valor seleccionado cuando cambia el value (solo desde el exterior)
    useEffect(() => {
        console.log('🔄 InputSearch useEffect - value:', value, 'displayValue:', displayValue, 'isUserTyping:', isUserTypingRef.current);
        console.log('📊 selectedOption actual:', selectedOption);

        // Si hay displayValue y el query actual no coincide, forzar actualización
        if (displayValue && query !== displayValue && !isUserTypingRef.current) {
            // console.log('✅ Actualizando con displayValue:', displayValue);
            setQuery(displayValue);
            setSelectedOption({
                value: value || '',
                label: displayValue,
                description: ''
            });
            lastValueRef.current = value;
            return;
        }

        // Solo actualizar si el valor cambió desde el exterior (no por la escritura del usuario)
        if (value !== lastValueRef.current && !isUserTypingRef.current) {
            lastValueRef.current = value;

            if (value && value !== selectedOption?.value) {
                // Si se proporciona displayValue, usarlo directamente
                if (displayValue) {
                    // console.log('✅ Usando displayValue:', displayValue);
                    setQuery(displayValue);
                    setSelectedOption({
                        value: value,
                        label: displayValue,
                        description: ''
                    });
                } else {
                    // Buscar la opción correspondiente en las opciones actuales
                    const found = options.find(opt => opt.value === value);
                    if (found) {
                        setSelectedOption(found);
                        setQuery(found.label);
                    } else {
                        // Si no se encuentra, limpiar la selección pero mantener el query
                        setSelectedOption(null);
                    }
                }
            } else if (!value) {
                setSelectedOption(null);
                setQuery('');
            }
        } else {
            lastValueRef.current = value;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, selectedOption?.value, displayValue, query]); // Agregar query a las dependencias

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        isUserTypingRef.current = true;
        setQuery(newQuery);

        // Si se borra el input, limpiar la selección
        if (!newQuery) {
            setSelectedOption(null);
            onChange(null);
        } else {
            // Si el usuario está escribiendo pero no hay selección válida, mostrar que debe seleccionar de la lista
            if (!selectedOption || selectedOption.label !== newQuery) {
                setSelectedOption(null);
            }
        }

        // Resetear el flag después de un pequeño delay
        setTimeout(() => {
            isUserTypingRef.current = false;
        }, 100);
    };

    const handleSelectOption = (option: SearchOption) => {
        isUserTypingRef.current = false; // No es escritura del usuario
        setSelectedOption(option);
        setQuery(option.label);
        setIsOpen(false);
        setSelectedIndex(-1);
        onChange(option.value, option);
    };

    const handleClear = () => {
        isUserTypingRef.current = false; // No es escritura del usuario
        setQuery('');
        setSelectedOption(null);
        setIsOpen(false);
        onChange(null);
        inputRef.current?.focus();
    };

    // Funcionalidad del scanner
    const startScanner = async () => {
        try {
            setScannerError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setShowScanner(true);

            // Aquí podrías integrar una librería de detección de códigos de barras
            // Por ejemplo, @zxing/library o similar

        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            setScannerError('No se puede acceder a la cámara');
        }
    };

    const stopScanner = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowScanner(false);
        setScannerError(null);
    };

    const handleScanResult = (code: string) => {
        isUserTypingRef.current = false; // No es escritura del usuario
        setQuery(code);
        stopScanner();
        // El useEffect se encargará de la búsqueda cuando query cambie
    };

    const handleSearchButtonClick = async () => {
        if (!query || query.length < 2) {
            console.warn('La búsqueda requiere al menos 2 caracteres');
            return;
        }

        // Si hay un callback personalizado, usarlo
        if (onSearchButtonClick) {
            onSearchButtonClick(query);
            return;
        }

        // Sino, dispara la búsqueda directa
        setLoading(true);
        try {
            const results = await onSearch(query);
            setOptions(results);
            setIsOpen(results.length > 0 || (query.length >= 2 && showCreateButton && !!onCreateClick));
            setSelectedIndex(-1);
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setOptions([]);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || options.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => prev < options.length - 1 ? prev + 1 : 0);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : options.length - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < options.length) {
                    handleSelectOption(options[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}

            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <input
                        ref={inputRef}
                        id={id}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query.length >= 2 && (options.length > 0 || (showCreateButton && !!onCreateClick)) && setIsOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        aria-invalid={!!error}
                        className={`
                            border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground
                            flex h-9 w-full min-w-0 rounded-md border bg-transparent pl-9 pr-9 text-base shadow-xs
                            transition-[color,box-shadow] outline-none
                            focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
                            disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
                            md:text-sm
                            aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
                        `}
                    />

                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
                        {showSearchButton && query && query.length >= 2 && (
                            <button
                                type="button"
                                onClick={handleSearchButtonClick}
                                disabled={disabled || loading}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Buscar"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        )}

                        {showCreateIconButton && onCreateClick && (
                            <button
                                type="button"
                                onClick={() => onCreateClick(query)}
                                disabled={disabled}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={createIconButtonTitle}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        )}

                        {allowScanner && (
                            <button
                                type="button"
                                onClick={startScanner}
                                disabled={disabled}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={scannerLabel}
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        )}

                        {query && (
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={disabled}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        )}
                    </div>
                </div>

                {/* Dropdown de opciones mejorado */}
                {isOpen && (
                    <div className="absolute z-[2147483647] mt-2 w-full bg-background shadow-lg border border-border rounded-md overflow-hidden transform transition-all duration-200 ease-out">
                        {/* Header del dropdown */}
                        <div className="px-4 py-2 bg-muted border-b border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">
                                        Resultados
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                                    {options.length}
                                </span>
                            </div>
                        </div>

                        {/* Contenedor de resultados con scroll mejorado */}
                        <div className="max-h-80 overflow-y-auto">
                            {options.length === 0 && !loading ? (
                                <div className="px-6 py-8 text-center">
                                    {/* Banner de advertencia si hay búsqueda pero sin resultados */}
                                    {query.length >= 2 && showCreateButton && onCreateClick && (
                                        <div className="mb-6 p-4 bg-destructive/5 border-l-4 border-destructive rounded-r">
                                            <div className="flex items-start space-x-3">
                                                <div className="text-2xl">⚠️</div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        No encontramos "{query}"
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Este elemento no existe. Puedes crearlo usando el botón de abajo.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                                        <Search className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-foreground font-medium">
                                        {emptyText}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Intenta con otros términos de búsqueda
                                    </p>

                                    {/* Botón para crear nuevo elemento */}
                                    {showCreateButton && query.length >= 2 && onCreateClick && (
                                        <div className="mt-6 pt-6 border-t border-border">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    console.log('🖱️ Botón crear clickeado con query:', query);
                                                    onCreateClick(query);
                                                }}
                                                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors duration-150"
                                            >
                                                <span className="mr-2">➕</span>
                                                {createButtonText}
                                            </button>
                                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                                Crear elemento con este nombre
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {options.map((option, index) => (
                                        <button
                                            key={`${option.value}-${index}`}
                                            type="button"
                                            onClick={() => handleSelectOption(option)}
                                            className={`w-full text-left px-4 py-3 transition-colors duration-150 group ${selectedIndex === index
                                                ? 'bg-accent border-l-4 border-primary'
                                                : 'hover:bg-accent'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between space-x-3">
                                                {/* Información principal del producto */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                            {option.label}
                                                        </h4>
                                                        {option.codigos_barras && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                                <span className="mr-1">📱</span>
                                                                {option.codigos_barras}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {option.description && (
                                                        <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                                                            {option.description}
                                                        </p>
                                                    )}

                                                    {/* Información adicional en fila */}
                                                    <div className="flex items-center space-x-4 text-xs">
                                                        {option.precio_base !== undefined && option.precio_base > 0 && (
                                                            <div className="flex items-center space-x-1">
                                                                <span className="text-muted-foreground">Precio:</span>
                                                                <span className="font-semibold text-foreground">
                                                                    Bs. {option.precio_base.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {option.stock_total !== undefined && (
                                                            <div className="flex items-center space-x-1">
                                                                <span className="text-muted-foreground">Stock:</span>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${option.stock_total > 10
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                                    : option.stock_total > 0
                                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                                        : 'bg-destructive/10 text-destructive'
                                                                    }`}>
                                                                    {option.stock_total > 10 ? '✅' : option.stock_total > 0 ? '⚠️' : '❌'}
                                                                    {option.stock_total}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Indicador de selección */}
                                                <div className={`flex-shrink-0 transition-opacity ${selectedIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                    }`}>
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedIndex === index
                                                        ? 'bg-primary'
                                                        : 'bg-muted'
                                                        }`}>
                                                        {selectedIndex === index && (
                                                            <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer con información adicional */}
                        {options.length > 0 && (
                            <div className="px-4 py-2 bg-muted border-t border-border">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Presiona Enter o haz clic para seleccionar</span>
                                    <span>↑↓ para navegar</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-destructive">{error}</p>
            )}

            {/* Modal del scanner */}
            {showScanner && (
                <div className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/75">
                    <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4 border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                {scannerLabel}
                            </h3>
                            <button
                                onClick={stopScanner}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {scannerError ? (
                            <div className="text-center py-8">
                                <p className="text-destructive mb-4">{scannerError}</p>
                                <button
                                    onClick={stopScanner}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Apunta la cámara hacia el código de barras
                                    </p>

                                    {/* Input manual para código */}
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="O ingresa el código manualmente"
                                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    const target = e.target as HTMLInputElement;
                                                    if (target.value.trim()) {
                                                        handleScanResult(target.value.trim());
                                                    }
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Presiona Enter después de escribir el código
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
