import React, { useRef, useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface Props {
    onClose: () => void;
    onDetected: (codigo: string) => void;
}

export default function ScannerCamaraModal({ onClose, onDetected }: Props) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentURL, setCurrentURL] = useState<string>('');

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                // Solicitar acceso a la cámara
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setLoading(false);
                }
            } catch (err) {
                setError('No se puede acceder a la cámara. Verifica los permisos.');
                console.error('Error al acceder a cámara:', err);
            }
        };

        startCamera();

        return () => {
            // Limpiar stream al desmontar
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const captureAndDecode = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        try {
            const context = canvasRef.current.getContext('2d');
            if (!context) return;

            // Dibujar frame actual del video en el canvas
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);

            // Obtener imagen como URL
            const imageData = canvasRef.current.toDataURL('image/jpeg');
            setCurrentURL(imageData);

            // Intentar decodificar usando ZXing library si está disponible
            try {
                const { BrowserMultiFormatReader } = await import('@zxing/library');
                const codeReader = new BrowserMultiFormatReader();

                const result = await codeReader.decodeFromImageUrl(imageData);
                if (result?.getText()) {
                    onDetected(result.getText());
                    onClose();
                    return;
                }
            } catch (decodeError) {
                // Si no decodifica, intentar nuevamente
                console.log('No se detectó código en este frame');
            }
        } catch (err) {
            console.error('Error al capturar:', err);
        }
    };

    // Capturar frames continuamente
    useEffect(() => {
        if (!loading && videoRef.current) {
            const interval = setInterval(captureAndDecode, 500);
            return () => clearInterval(interval);
        }
    }, [loading]);

    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/90 z-[60] flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Escanear Código de Barras</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Video/Cámara */}
                <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden mb-4">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-white text-center">Inicializando cámara...</p>
                        </div>
                    ) : null}

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ display: loading ? 'none' : 'block' }}
                    />

                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Overlay de enfoque */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-green-400 rounded-lg">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                        </div>
                    </div>
                </div>

                {/* Mensajes de estado */}
                {error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                        <div className="flex gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    </div>
                ) : !loading ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                            ✓ Apunta la cámara hacia el código de barras
                        </p>
                    </div>
                ) : null}

                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium transition"
                >
                    Cerrar Scanner
                </button>
            </div>
        </div>
    );
}
