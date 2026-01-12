import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import type { Precio } from '@/domain/entities/productos';
import type { TipoPrecio } from '@/domain/entities/tipos-precio';
import tiposPrecioService from '@/infrastructure/services/tipos-precio.service';
import { Link } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
// Importar react-qr-barcode-scanner
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
// Importar ZXing como fallback
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { openCameraStream, stopStream as stopCameraStream } from '@/infrastructure/services/image.service';
import type { HistorialPrecio } from '@/domain/entities/productos';

// Soporte para opciones provenientes del backend (value/label) o del modelo directo (id/nombre)
type TipoPrecioOption = Partial<TipoPrecio> & {
    value?: number | string;
    label?: string;
    icono?: string;
    configuracion?: TipoPrecio['configuracion'];
    // porcentaje_ganancia: number;
};

export interface Step2Props {
    data: {
        precios: Precio[];
        codigos: { codigo: string; es_principal?: boolean; tipo?: string }[];
        es_fraccionado?: boolean; // ✨ NUEVO
        unidad_medida_id?: number | string; // ✨ NUEVO
        conversiones?: any[]; // ✨ NUEVO
    };
    errors: Record<string, string>;
    tipos_precio: TipoPrecio[];
    porcentajeInteres: number;
    precioCosto: number;
    isEditing?: boolean;
    addPrecio: () => void;
    removePrecio: (i: number) => void | Promise<void>;
    setPrecio: (i: number, key: string, value: string | number) => void;
    setPrecios: (precios: Precio[]) => void;
    toggleTipoPrecio: (tipoId: number, checked: boolean) => void;
    getTipoPrecioInfo: (tipoPrecioValue: number) => TipoPrecio | undefined;
    calcularGanancia: (precioVenta: number, precioCosto: number) => { ganancia: number; porcentaje: number };
    addCodigo: () => void;
    removeCodigo: (i: number) => void | Promise<void>;
    setCodigo: (i: number, value: string) => void;
    historial_precios?: HistorialPrecio[];
    unidades?: { id: number | string; nombre: string; codigo: string }[]; // ✨ NUEVO
}

export default function Step2PreciosCodigos(props: Step2Props) {
    const {
        data,
        errors,
        tipos_precio,
        setPrecio,
        setPrecios,
        toggleTipoPrecio,
        addCodigo,
        removeCodigo,
        setCodigo,
        isEditing,
    } = props;

    // IDs de tipo_precio con monto modificado manualmente por el usuario
    const manualOverrideIdsRef = useRef<Set<number>>(new Set());
    const isEditingInitializedRef = useRef<boolean>(false);

    // Si estamos editando, marcar todos los precios existentes como "manuales" para evitar que se recalculen
    useEffect(() => {
        if (isEditing && !isEditingInitializedRef.current && data.precios && data.precios.length > 0) {
            isEditingInitializedRef.current = true;
            // Marcar todos los precios existentes como manuales para que no se recalculen automáticamente
            data.precios.forEach((p: Precio) => {
                manualOverrideIdsRef.current.add(Number(p.tipo_precio_id));
            });
            console.log('✅ Precios marcados como manuales (edición). IDs:', Array.from(manualOverrideIdsRef.current));
        }
    }, [isEditing, data.precios]);

    // ✨ Estado para precios por unidad (si es fraccionado)
    const [preciosPorUnidad, setPreciosPorUnidad] = useState<{
        [tipoPrecioId: number]: {
            [unidadId: number]: {
                monto: number;
                manual: boolean;
            };
        };
    }>({});

    // ✨ Calcular precios automáticamente cuando cambia el precio base o el factor de conversión
    const calcularPreciosPorUnidad = useCallback((
        precioBase: number,
        tipoPrecioId: number,
        porcentajeGanancia: number
    ) => {
        if (!props.data.es_fraccionado || !props.data.conversiones || props.data.conversiones.length === 0) {
            return;
        }

        // Precio para la unidad base (ej: CAJA = 45 Bs)
        const precioUnidadBase = precioBase * (1 + porcentajeGanancia / 100);

        const nuevosPrecios: typeof preciosPorUnidad[number] = {
            [Number(props.data.unidad_medida_id)]: {
                monto: Number(precioUnidadBase.toFixed(2)),
                manual: false,
            },
        };

        // Calcular precio para cada unidad destino
        props.data.conversiones.forEach((conv: any) => {
            // Si es manual, no recalcular
            const esManual = preciosPorUnidad[tipoPrecioId]?.[conv.unidad_destino_id]?.manual;
            if (esManual) {
                nuevosPrecios[conv.unidad_destino_id] = preciosPorUnidad[tipoPrecioId][conv.unidad_destino_id];
                return;
            }

            // Calcular: Precio CAJA / Factor = Precio TABLETA
            // Ej: 45 Bs / 30 = 1.5 Bs por tableta
            const precioUnidadDestino = precioUnidadBase / conv.factor_conversion;

            nuevosPrecios[conv.unidad_destino_id] = {
                monto: Number(precioUnidadDestino.toFixed(2)),
                manual: false,
            };
        });

        setPreciosPorUnidad(prev => ({
            ...prev,
            [tipoPrecioId]: nuevosPrecios,
        }));
    }, [props.data.es_fraccionado, props.data.conversiones, props.data.unidad_medida_id, preciosPorUnidad]);

    // ✨ Handler para cambio manual de precio por unidad
    const handlePrecioUnidadChange = (
        tipoPrecioId: number,
        unidadId: number,
        nuevoMonto: number
    ) => {
        setPreciosPorUnidad(prev => ({
            ...prev,
            [tipoPrecioId]: {
                ...prev[tipoPrecioId],
                [unidadId]: {
                    monto: nuevoMonto,
                    manual: true, // Marcar como manual
                },
            },
        }));
    };

    // Estado y refs para cámara y escaneo de códigos / fotos
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState<'scan' | 'photo'>('scan');
    const [targetIndex, setTargetIndex] = useState<number | null>(null);
    const [scanSupported, setScanSupported] = useState<boolean>(false);
    const [scanning, setScanning] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [photos, setPhotos] = useState<string[]>([]);
    const [supportsGetUserMedia, setSupportsGetUserMedia] = useState<boolean>(false);
    const [compactCodigos] = useState<boolean>(false);
    // Estados para react-qr-barcode-scanner
    const [useModernScanner, setUseModernScanner] = useState<boolean>(true);
    const [modernScannerError, setModernScannerError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafIdRef = useRef<number | null>(null);
    type BarcodeDetectorLike = {
        detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string; displayValue?: string }>>;
    };
    const detectorRef = useRef<BarcodeDetectorLike | null>(null);
    // Agregar ref para ZXing
    const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const VIDEO_ELEMENT_ID = 'barcode-video';

    const initializeZXingFallback = useCallback(() => {
        try {
            const hints = new Map();
            hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                BarcodeFormat.QR_CODE,
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.CODE_128,
                BarcodeFormat.UPC_E,
                BarcodeFormat.UPC_A,
            ]);
            zxingReaderRef.current = new BrowserMultiFormatReader(hints);
            setScanSupported(true);
        } catch (error) {
            console.warn('ZXing fallback failed to initialize:', error);
            setScanSupported(false);
        }
    }, []);

    // Detectar soporte de BarcodeDetector (para QR y códigos de barras)
    useEffect(() => {
        type BarcodeDetectorCtor = new (opts?: unknown) => BarcodeDetectorLike;
        const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor };

        // Intentar usar BarcodeDetector nativo primero
        if (w && typeof w.BarcodeDetector === 'function') {
            try {
                detectorRef.current = new w.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'upc_e', 'upc_a'] });
                setScanSupported(true);
            } catch {
                // Si falla BarcodeDetector, usar ZXing como fallback
                initializeZXingFallback();
            }
        } else {
            // Si no hay BarcodeDetector, usar ZXing
            initializeZXingFallback();
        }

        // Detectar soporte de getUserMedia (algunos móviles en HTTP no lo exponen)
        const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
        setSupportsGetUserMedia(hasMediaDevices);
    }, [initializeZXingFallback]);

    const stopCamera = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        setScanning(false);
        if (streamRef.current) {
            stopCameraStream(streamRef.current);
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const closeCamera = useCallback(() => {
        stopCamera();
        setCameraOpen(false);
        setTargetIndex(null);
        setCameraError(null);
    }, [stopCamera]);

    const triggerFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    }, []);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        try {
            const reader = new FileReader();
            const dataUrl: string = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada'));
                reader.readAsDataURL(file);
            });
            if (cameraMode === 'photo') {
                setPhotos((prev) => [dataUrl, ...prev]);
                closeCamera();
            } else if (cameraMode === 'scan') {
                // Intentar primero con BarcodeDetector nativo
                if (detectorRef.current) {
                    await new Promise<void>((resolve) => {
                        const img = new Image();
                        img.onload = async () => {
                            if (!canvasRef.current) {
                                resolve();
                                return;
                            }
                            const canvas = canvasRef.current;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) {
                                resolve();
                                return;
                            }
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            try {
                                const results = await detectorRef.current!.detect(canvas);
                                const value = results?.[0]?.rawValue || results?.[0]?.displayValue;
                                if (value && targetIndex !== null) {
                                    setCodigo(targetIndex, String(value));
                                    closeCamera();
                                } else {
                                    setCameraError('No se detectó ningún código en la foto.');
                                }
                            } catch {
                                setCameraError('No se pudo procesar la imagen seleccionada.');
                            }
                            resolve();
                        };
                        img.onerror = () => {
                            setCameraError('No se pudo cargar la imagen seleccionada.');
                            resolve();
                        };
                        img.src = dataUrl;
                    });
                } else if (zxingReaderRef.current) {
                    // Usar ZXing como fallback
                    try {
                        const img = new Image();
                        await new Promise<void>((resolve, reject) => {
                            img.onload = () => resolve();
                            img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
                            img.src = dataUrl;
                        });

                        const result = await zxingReaderRef.current.decodeFromImageElement(img);
                        if (result && targetIndex !== null) {
                            setCodigo(targetIndex, result.getText());
                            closeCamera();
                        } else {
                            setCameraError('No se detectó ningún código en la foto.');
                        }
                    } catch {
                        setCameraError('No se pudo procesar la imagen con ZXing.');
                    }
                } else {
                    setCameraError('El dispositivo/navegador no soporta detección de códigos.');
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al procesar la imagen seleccionada';
            setCameraError(msg);
        }
    }, [cameraMode, closeCamera, setCodigo, targetIndex]);

    const startCamera = useCallback(async (mode: 'scan' | 'photo', index: number | null = null) => {
        try {
            setCameraError(null);
            setCameraMode(mode);
            setTargetIndex(index);
            // Si el navegador no soporta getUserMedia, ofrecemos la captura nativa
            if (!supportsGetUserMedia) {
                setCameraOpen(true);
                setCameraError('El navegador no permite acceso directo a la cámara en este contexto. Usa "Usar cámara del dispositivo".');
                triggerFileInput();
                return;
            }
            const constraints: MediaStreamConstraints = {
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            };
            const stream = await openCameraStream(constraints);
            console.log('Stream obtenido:', stream);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                console.log('Video debería estar reproduciéndose');
            } else {
                console.warn('videoRef.current es null');
            }
            setCameraOpen(true);
            if (mode === 'scan') {
                setScanning(true);

                // Usar BarcodeDetector nativo si está disponible
                if (detectorRef.current) {
                    const loop = async () => {
                        if (!videoRef.current || !canvasRef.current || !scanning) {
                            return;
                        }
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            return;
                        }
                        canvas.width = video.videoWidth || 640;
                        canvas.height = video.videoHeight || 360;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        try {
                            const results = await detectorRef.current!.detect(canvas);
                            if (results && results.length > 0) {
                                const value = results[0]?.rawValue || results[0]?.displayValue;
                                if (value && targetIndex !== null) {
                                    setCodigo(targetIndex, String(value));
                                    closeCamera();
                                    return;
                                }
                            }
                        } catch {
                            // Si falla la detección, continuamos sin romper el loop
                        }
                        rafIdRef.current = requestAnimationFrame(loop);
                    };
                    rafIdRef.current = requestAnimationFrame(loop);
                } else if (zxingReaderRef.current && videoRef.current) {
                    // Usar ZXing como fallback para escaneo en tiempo real
                    try {
                        await zxingReaderRef.current.decodeFromVideoDevice(null, VIDEO_ELEMENT_ID, (result) => {
                            if (result && targetIndex !== null) {
                                setCodigo(targetIndex, result.getText());
                                closeCamera();
                            }
                        });
                    } catch (err) {
                        console.warn('ZXing video scanning failed:', err);
                    }
                }
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'No se pudo acceder a la cámara.';
            setCameraError(msg);
            setCameraOpen(true);
        }
    }, [closeCamera, scanning, setCodigo, supportsGetUserMedia, triggerFileInput, targetIndex]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) {
            return;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            setPhotos((prev) => [dataUrl, ...prev]);
        } catch {
            // ignorar
        }
    }, []);

    // Funciones para react-qr-barcode-scanner
    const startModernScanner = useCallback((index: number) => {
        setModernScannerError(null);
        setTargetIndex(index);
        setCameraMode('scan');
        setCameraOpen(true);
    }, []);

    const handleModernScannerResult = useCallback((result: string) => {
        if (result && targetIndex !== null) {
            setCodigo(targetIndex, result);
            closeCamera();
        }
    }, [setCodigo, targetIndex, closeCamera]);

    const handleModernScannerError = useCallback((error: string) => {
        setModernScannerError(error);
        console.warn('Modern scanner error:', error);
    }, []);

    const switchToFallbackScanner = useCallback(() => {
        setUseModernScanner(false);
        setModernScannerError(null);
    }, []);

    const switchToModernScanner = useCallback(() => {
        setUseModernScanner(true);
        setModernScannerError(null);
    }, []);

    // Limpiar recursos al desmontar
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // Normalizadores locales para admitir tanto {id,nombre} como {value,label}
    const tpId = (tp: TipoPrecioOption) => Number(tp?.id ?? tp?.value ?? 0);
    const tpNombre = (tp: TipoPrecioOption) => String(tp?.nombre ?? tp?.label ?? '');
    const tpIcono = (tp: TipoPrecioOption) => tp?.configuracion?.icono ?? tp?.icono ?? '';

    // Calcula y sincroniza automáticamente los montos de venta cuando cambia el costo o la selección de tipos de precio
    useEffect(() => {
        const costo = Number(props.precioCosto ?? 0);
        if (!Number.isFinite(costo) || costo < 0) {
            return;
        }

        // Mapa rápido de porcentaje por tipo_precio_id
        const pctById = new Map<number, number>();
        for (const tp of tipos_precio as TipoPrecioOption[]) {
            const id = tpId(tp);
            const pctRaw = (tp?.porcentaje_ganancia as unknown as number | string);
            const pctNum = pctRaw !== undefined && pctRaw !== null && pctRaw !== '' ? Number(pctRaw) : 0;
            const pct = Number.isFinite(pctNum) ? pctNum : 0;
            pctById.set(id, pct);
        }

        // Construye un array actualizado en memoria para evitar condiciones de carrera por múltiples setPrecio
        const originales = data.precios || [];
        let huboCambios = false;
        const actualizados: Precio[] = originales.map((p: Precio) => {
            const pct = pctById.get(Number(p.tipo_precio_id)) ?? 0;
            const nuevoMonto = Number((costo * (1 + pct / 100)).toFixed(2));
            const nuevaMoneda = p.moneda && p.moneda !== '' ? p.moneda : 'BOB';
            const nuevo: Precio = { ...p } as Precio;
            const esManual = manualOverrideIdsRef.current.has(Number(p.tipo_precio_id));
            if (!esManual && Number.isFinite(nuevoMonto) && p.monto !== nuevoMonto) {
                nuevo.monto = nuevoMonto;
                huboCambios = true;
            }
            if (p.moneda !== nuevaMoneda) {
                nuevo.moneda = nuevaMoneda;
                huboCambios = true;
            }
            return nuevo;
        });

        if (huboCambios) {
            setPrecios(actualizados);
        }
    }, [props.precioCosto, data.precios, tipos_precio, setPrecios]);

    return (
        <div>
            <div className="-mb-2 sm:col-span-2">
                <div className="rounded border border-border bg-secondary p-3">
                    <div className="text-sm font-semibold text-foreground">Paso 2: Precios y códigos</div>
                    <div className="text-xs text-muted-foreground">Seleccione tipos de precio, defina montos y agregue códigos de barra</div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="space-y-6">

                    <div className={`rounded border border-border bg-secondary p-3 ${compactCodigos ? 'hidden' : ''}`}>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-medium text-foreground">Elegir tipos de precio a usar</div>
                            <Button asChild size="sm" variant="outline">
                                <Link href={tiposPrecioService.createUrl()}>
                                    <span className="flex items-center gap-1">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Nuevo tipo de precio
                                    </span>
                                </Link>
                            </Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                            {tipos_precio.map((tp: TipoPrecioOption) => {
                                const currId = tpId(tp);
                                const checked = (data.precios || []).some((p: Precio) => Number(p.tipo_precio_id) === currId);
                                const pctRaw = (tp?.porcentaje_ganancia as unknown as number | string);
                                const pctNum = pctRaw !== undefined && pctRaw !== null && pctRaw !== '' ? Number(pctRaw) : 0;
                                const pct = Number.isFinite(pctNum) ? pctNum : 0;
                                const precioIdx = (data.precios || []).findIndex((p: Precio) => Number(p.tipo_precio_id) === currId);
                                const precioSel = precioIdx >= 0 ? (data.precios as Precio[])[precioIdx] : null;
                                return (
                                    <div
                                        key={currId}
                                        className={[
                                            'text-sm',
                                            'rounded border border-border bg-card px-2 py-2',
                                            'text-foreground hover:border-accent hover:bg-accent/40',
                                            'transition-colors duration-150',
                                            checked
                                                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                                                : 'border-border bg-card dark:border-neutral-700 dark:bg-neutral-900',
                                        ].join(' ')}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 select-none">
                                                <Checkbox id={`tp-${currId}`} checked={checked} onCheckedChange={(v) => {
                                                    const isChecked = !!v;
                                                    // Al desmarcar, limpiamos cualquier override manual asociado a este tipo
                                                    if (!isChecked) {
                                                        manualOverrideIdsRef.current.delete(currId);
                                                    } else {
                                                        // Al volver a marcar, reiniciamos el estado manual para permitir cálculo automático inicial
                                                        manualOverrideIdsRef.current.delete(currId);
                                                    }
                                                    toggleTipoPrecio(currId, isChecked);
                                                }} />
                                                <label htmlFor={`tp-${currId}`} className="flex items-center gap-1 cursor-pointer">
                                                    <span>{tpIcono(tp)}</span>
                                                    <span>{tpNombre(tp)}</span>
                                                </label>
                                            </div>
                                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground">
                                                {pct}%
                                            </span>
                                        </div>
                                        {checked && (
                                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                                <Label className="mb-1 block text-xs font-medium">Monto (BOB)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={precioSel ? (precioSel.monto === 0 ? '' : precioSel.monto) : ''}
                                                    onChange={(e) => {
                                                        if (precioIdx >= 0) {
                                                            // Marcar este tipo de precio como modificado manualmente
                                                            manualOverrideIdsRef.current.add(currId);
                                                            setPrecio(precioIdx, 'monto', e.target.value);
                                                            if (precioSel && (precioSel.moneda === undefined || precioSel.moneda === '')) {
                                                                setPrecio(precioIdx, 'moneda', 'BOB');
                                                            }
                                                        }
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    onBlur={(e) => {
                                                        if (precioIdx >= 0 && e.target.value === '') {
                                                            // Si se deja vacío, lo consideramos una edición manual a 0
                                                            manualOverrideIdsRef.current.add(currId);
                                                            setPrecio(precioIdx, 'monto', 0);
                                                        }
                                                    }}
                                                    className={`h-8 text-sm ${errors[`precios.${precioIdx}.monto`] ? 'border-red-500' : ''}`}
                                                    placeholder="0.00"
                                                    inputMode="decimal"
                                                    pattern="\d+(\.\d{1,2})?"
                                                />
                                                {errors[`precios.${precioIdx}.monto`] && (
                                                    <div className="mt-1 text-xs text-red-500">⚠️ {errors[`precios.${precioIdx}.monto`]}</div>
                                                )}
                                                {/* Input para motivo del cambio de precio */}
                                                <Label className="mb-1 mt-2 block text-xs font-medium">Motivo del cambio</Label>
                                                <Input
                                                    type="text"
                                                    value={precioSel?.motivo_cambio || ''}
                                                    onChange={(e) => {
                                                        if (precioIdx >= 0) {
                                                            setPrecio(precioIdx, 'motivo_cambio', e.target.value);
                                                        }
                                                    }}
                                                    className="h-8 text-xs"
                                                    placeholder="Motivo del cambio de precio (opcional)"
                                                />

                                                {/* ✨ NUEVA SECCIÓN: Precios por Unidad (si es fraccionado) */}
                                                {props.data.es_fraccionado && props.data.conversiones && props.data.conversiones.length > 0 && (
                                                    <div className="mt-4 space-y-2 border-t pt-3">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                Precios por unidad:
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    // Recalcular precios automáticos
                                                                    const pct = tp?.configuracion?.porcentaje_ganancia || props.porcentajeInteres;
                                                                    calcularPreciosPorUnidad(props.precioCosto, currId, pct);
                                                                }}
                                                                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                                                                title="Recalcular precios automáticamente"
                                                            >
                                                                🔄 Recalcular
                                                            </button>
                                                        </div>

                                                        {/* Precio en unidad base */}
                                                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[70px] font-medium">
                                                                {props.unidades?.find(u => u.id === props.data.unidad_medida_id)?.codigo || 'Base'}:
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={preciosPorUnidad[currId]?.[Number(props.data.unidad_medida_id)]?.monto || (precioSel?.monto === 0 ? '' : precioSel?.monto) || ''}
                                                                onChange={(e) => {
                                                                    handlePrecioUnidadChange(currId, Number(props.data.unidad_medida_id), Number(e.target.value) || 0);
                                                                    setPrecio(precioIdx, 'monto', e.target.value);
                                                                }}
                                                                className="flex-1 text-xs h-7"
                                                                placeholder="0.00"
                                                            />
                                                            <span className="text-xs text-gray-500 min-w-[50px]">Bs</span>
                                                        </div>

                                                        {/* Precios en unidades destino */}
                                                        {props.data.conversiones.map((conv: any) => {
                                                            const unidadDestino = props.unidades?.find(u => u.id === conv.unidad_destino_id);
                                                            const esManual = preciosPorUnidad[currId]?.[conv.unidad_destino_id]?.manual;
                                                            const monto = preciosPorUnidad[currId]?.[conv.unidad_destino_id]?.monto || 0;

                                                            return (
                                                                <div key={conv.id} className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[70px]">
                                                                        {unidadDestino?.codigo || `ID:${conv.unidad_destino_id}`}:
                                                                    </span>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={monto === 0 ? '' : monto}
                                                                        onChange={(e) => {
                                                                            handlePrecioUnidadChange(currId, conv.unidad_destino_id, Number(e.target.value) || 0);
                                                                        }}
                                                                        className="flex-1 text-xs h-7"
                                                                        placeholder="0.00"
                                                                    />
                                                                    <span className="text-xs text-gray-500 min-w-[50px]">Bs</span>
                                                                    {!esManual && monto > 0 && (
                                                                        <span className="text-xs text-blue-600 dark:text-blue-400 min-w-fit whitespace-nowrap font-medium">
                                                                            Auto ✓
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Códigos de barra</Label>
                        <div className="flex items-center gap-2">
                            {/*<Button
                                type="button"
                                size="sm"
                                variant={compactCodigos ? 'default' : 'outline'}
                                onClick={() => setCompactCodigos(!compactCodigos)}
                                title={compactCodigos ? 'Cambiar a modo amplio' : 'Cambiar a modo compacto'}
                            >
                                {compactCodigos ? 'Modo amplio' : 'Modo compacto'}
                            </Button>*/}
                            <Button type="button" size="sm" onClick={addCodigo} variant="outline">
                                <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Añadir código
                            </Button>
                        </div>
                    </div>
                    <div className={compactCodigos ? 'grid gap-2 sm:grid-cols-2' : 'space-y-3'}>
                        {data.codigos.map((c: { codigo: string; es_principal?: boolean; tipo?: string }, i: number) => (
                            <div
                                key={i}
                                className={`rounded-lg border-2 ${compactCodigos ? 'p-3' : 'p-4'} ${c.es_principal ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-border bg-secondary'}`}
                            >
                                <div className={compactCodigos ? 'space-y-2' : 'space-y-3'}>
                                    <div className={`flex items-center ${compactCodigos ? 'flex-wrap gap-1' : ''}`}>
                                        <div className="flex items-center gap-2 mr-2 select-none">
                                            <Label className="text-sm font-medium">Código de barras</Label>
                                            {c.es_principal && (
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                                    Principal
                                                </span>
                                            )}
                                            {c.tipo && <span className="rounded bg-secondary px-2 py-1 text-xs text-foreground">{c.tipo}</span>}
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeCodigo(i)}
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 mr-2"
                                        >
                                            🗑️
                                        </Button>
                                        <Button type="button" className="mr-2" size="sm" variant="outline" onClick={() => useModernScanner ? startModernScanner(i) : startCamera('scan', i)} disabled={!scanSupported && !useModernScanner}>
                                            {useModernScanner ? 'Escanear QR/Código' : (scanSupported ? 'Escanear (Fallback)' : 'Escaneo no soportado')}
                                        </Button>
                                        {useModernScanner && (
                                            <Button type="button" className="mr-2" size="sm" variant="ghost" onClick={switchToFallbackScanner} title="Cambiar a escáner alternativo">
                                                🔄
                                            </Button>
                                        )}
                                        {!useModernScanner && (
                                            <Button type="button" className="mr-2" size="sm" variant="ghost" onClick={switchToModernScanner} title="Cambiar a escáner moderno">
                                                ⚡
                                            </Button>
                                        )}
                                        {/*<Button type="button" className="mr-2" size="sm" variant="outline" onClick={() => startCamera('photo', null)}>
                                            Tomar foto
                                        </Button>*/}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            ref={(el) => { codeInputRefs.current[i] = el; }}
                                            value={c.codigo}
                                            onChange={(e) => setCodigo(i, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const total = (data.codigos?.length ?? 0);
                                                    const isLast = i === total - 1;
                                                    const val = (e.currentTarget.value || '').trim();
                                                    if (isLast && val) {
                                                        addCodigo();
                                                        setTimeout(() => {
                                                            const nextIndex = i + 1;
                                                            codeInputRefs.current[nextIndex]?.focus();
                                                        }, 50);
                                                    }
                                                }
                                            }}
                                            placeholder="Ingresa código EAN, UPC, etc. (opcional)"
                                            className="font-mono text-sm flex-1"
                                        />
                                    </div>
                                    {!c.codigo && i === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            💡 Si no ingresa un código, se usará automáticamente el ID del producto
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/*<div className="rounded-lg bg-blue-50 p-3 text-xs text-muted-foreground dark:bg-blue-900/20">
                        <p className="font-medium text-blue-800 dark:text-blue-200">ℹ️ Información sobre códigos de barra:</p>
                        <ul className="mt-1 space-y-1 text-blue-700 dark:text-blue-200">
                            <li>• Los códigos de barra son opcionales al crear un producto</li>
                            <li>• Si no se proporciona ningún código, se usará el ID del producto automáticamente</li>
                            <li>• El primer código ingresado será marcado como principal</li>
                            <li>• Puedes agregar múltiples códigos por producto si es necesario</li>
                        </ul>
                    </div>*/}
                    {photos.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Fotos del producto</Label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {photos.map((src, idx) => (
                                    <div key={idx} className="relative overflow-hidden rounded border border-border bg-card">
                                        <img src={src} alt={`Foto ${idx + 1}`} className="h-28 w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Estas fotos se guardan localmente por ahora; podemos enlazarlas al backend luego.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Input oculto para usar la cámara nativa del dispositivo */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
            />

            {cameraOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={closeCamera}></div>
                    <div className="relative z-10 w-[90vw] max-w-xl rounded-lg border border-border bg-background p-3 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold">
                                {cameraMode === 'scan' ? 'Escanear código' : 'Tomar foto del producto'}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={closeCamera}>Cerrar</Button>
                        </div>
                        {cameraError && (
                            <div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                                {cameraError}
                            </div>
                        )}
                        {modernScannerError && (
                            <div className="mb-2 rounded bg-orange-50 p-2 text-xs text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                                {modernScannerError}
                                <Button type="button" size="sm" variant="outline" className="ml-2" onClick={switchToFallbackScanner}>
                                    Usar escáner alternativo
                                </Button>
                            </div>
                        )}
                        <div className="aspect-video w-full overflow-hidden rounded bg-black">
                            {useModernScanner && cameraMode === 'scan' ? (
                                <BarcodeScannerComponent
                                    width="100%"
                                    height="100%"
                                    onUpdate={(err, result) => {
                                        if (err) {
                                            const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Error del escáner');
                                            handleModernScannerError(errorMessage);
                                        }
                                        if (result) {
                                            handleModernScannerResult(result.getText());
                                        }
                                    }}
                                    facingMode="environment"
                                />
                            ) : supportsGetUserMedia ? (
                                <video id={VIDEO_ELEMENT_ID} ref={videoRef} className="h-full w-full object-contain" playsInline muted />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center p-2 text-xs text-white/80">
                                    Vista previa en vivo no disponible en este dispositivo/servidor. Usa el botón "Usar cámara del dispositivo".
                                </div>
                            )}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                {cameraMode === 'scan'
                                    ? (useModernScanner
                                        ? 'Escáner moderno - Apunta la cámara al código de barras o QR'
                                        : 'Escáner alternativo - Apunta la cámara al código de barras o QR'
                                    )
                                    : 'Ajusta el encuadre y presiona Capturar'
                                }
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={triggerFileInput}>
                                    Usar cámara del dispositivo
                                </Button>
                                {cameraMode === 'photo' && supportsGetUserMedia && (
                                    <Button type="button" size="sm" onClick={capturePhoto}>Capturar</Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
