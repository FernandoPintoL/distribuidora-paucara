import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, X } from 'lucide-react';

interface SearchOption {
    value: string | number;
    label: string;
    description?: string;
    codigos_barras?: string;
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
    scannerLabel = "Escanear código"
}: InputSearchProps) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<SearchOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<SearchOption | null>(null);
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
                setIsOpen(results.length > 0);
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
        // Solo actualizar si el valor cambió desde el exterior (no por la escritura del usuario)
        if (value !== lastValueRef.current && !isUserTypingRef.current) {
            lastValueRef.current = value;

            if (value && value !== selectedOption?.value) {
                // Buscar la opción correspondiente en las opciones actuales
                const found = options.find(opt => opt.value === value);
                if (found) {
                    setSelectedOption(found);
                    setQuery(found.label);
                } else {
                    // Si no se encuentra, limpiar la selección pero mantener el query
                    setSelectedOption(null);
                }
            } else if (!value) {
                setSelectedOption(null);
                setQuery('');
            }
        } else {
            lastValueRef.current = value;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, selectedOption?.value]); // Ignoramos options para evitar bucles

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        isUserTypingRef.current = true;
        setQuery(newQuery);

        // Si se borra el input, limpiar la selección
        if (!newQuery) {
            setSelectedOption(null);
            onChange(null);
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

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>

                    <input
                        ref={inputRef}
                        id={id}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => query.length >= 2 && options.length > 0 && setIsOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`
                            block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                            ${error ? 'border-red-500' : 'border-gray-300'}
                            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-800' : ''}
                        `}
                    />

                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
                        {allowScanner && (
                            <button
                                type="button"
                                onClick={startScanner}
                                disabled={disabled}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                    </div>
                </div>

                {/* Dropdown de opciones */}
                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-600 rounded-md py-1 text-base max-h-60 overflow-auto">
                        {options.length === 0 && !loading ? (
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {emptyText}
                            </div>
                        ) : (
                            options.map((option, index) => (
                                <button
                                    key={`${option.value}-${index}`}
                                    type="button"
                                    onClick={() => handleSelectOption(option)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                >
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {option.label}
                                    </div>
                                    {option.description && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {option.description}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* Modal del scanner */}
            {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {scannerLabel}
                            </h3>
                            <button
                                onClick={stopScanner}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {scannerError ? (
                            <div className="text-center py-8">
                                <p className="text-red-600 dark:text-red-400 mb-4">{scannerError}</p>
                                <button
                                    onClick={stopScanner}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Apunta la cámara hacia el código de barras
                                    </p>

                                    {/* Input manual para código */}
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="O ingresa el código manualmente"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    const target = e.target as HTMLInputElement;
                                                    if (target.value.trim()) {
                                                        handleScanResult(target.value.trim());
                                                    }
                                                }
                                            }}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
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