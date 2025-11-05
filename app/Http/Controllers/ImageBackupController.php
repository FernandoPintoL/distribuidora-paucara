<?php

namespace App\Http\Controllers;

use App\Services\ImageBackupService;
use App\Services\ChunkedUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Exception;

class ImageBackupController extends Controller
{
    protected $backupService;
    protected $chunkedUploadService;

    public function __construct(ImageBackupService $backupService, ChunkedUploadService $chunkedUploadService)
    {
        $this->backupService = $backupService;
        $this->chunkedUploadService = $chunkedUploadService;
    }

    /**
     * Crear un backup de todas las imágenes
     */
    public function createBackup(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'tables' => 'array|nullable',
                'tables.*' => 'in:clientes,proveedores,productos,fotos_lugar'
            ]);

            $tables = $request->input('tables', []);

            if (empty($tables)) {
                $result = $this->backupService->createFullBackup();
            } else {
                $result = $this->backupService->createSelectiveBackup($tables);
            }

            return response()->json([
                'success' => true,
                'message' => 'Backup creado exitosamente',
                'data' => $result
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un backup
     */
    public function restoreBackup(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'backup_name' => 'required|string',
                'skip_existing' => 'boolean'
            ]);

            $backupName = $request->input('backup_name');
            $skipExisting = $request->input('skip_existing', true);

            $result = $this->backupService->restoreBackup($backupName, $skipExisting);

            return response()->json([
                'success' => true,
                'message' => 'Backup restaurado exitosamente',
                'data' => $result
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar todos los backups disponibles
     */
    public function listBackups(): JsonResponse
    {
        try {
            $backups = $this->backupService->listBackups();

            return response()->json([
                'success' => true,
                'data' => $backups,
                'total' => count($backups)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar backups: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Descargar un backup específico
     */
    public function downloadBackup(string $backupName): mixed
    {
        try {
            $backupPath = 'backups/images/' . $backupName;
            $fullPath = storage_path('app/' . $backupPath);

            if (!file_exists($fullPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo de backup no encontrado'
                ], 404);
            }

            return response()->download($fullPath, $backupName);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un backup
     */
    public function deleteBackup(string $backupName): JsonResponse
    {
        try {
            if (empty($backupName)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nombre de backup requerido'
                ], 400);
            }

            $deleted = $this->backupService->deleteBackup($backupName);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo eliminar el backup'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Backup eliminado exitosamente'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener información de un backup específico
     */
    public function getBackupInfo(string $backupName): JsonResponse
    {
        try {
            $backups = $this->backupService->listBackups();

            $backup = collect($backups)->firstWhere('name', $backupName);

            if (!$backup) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $backup
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener tamaños de carpetas
     */
    public function getFolderSizes(): JsonResponse
    {
        try {
            $sizes = $this->backupService->getFolderSizes();

            $formattedSizes = collect($sizes)->mapWithKeys(function ($size, $folderName) {
                return [
                    $folderName => [
                        'bytes' => $size,
                        'formatted' => $this->formatBytes($size)
                    ]
                ];
            })->toArray();

            return response()->json([
                'success' => true,
                'data' => $formattedSizes,
                'total_size' => array_sum($sizes),
                'total_size_formatted' => $this->formatBytes(array_sum($sizes))
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tamaños de carpetas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear backup de una carpeta específica
     */
    public function createFolderBackup(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'folder_name' => 'required|string|in:clientes,proveedores,productos'
            ]);

            $folderName = $request->input('folder_name');
            $result = $this->backupService->createFolderBackup($folderName);

            return response()->json([
                'success' => true,
                'message' => 'Backup de carpeta creado exitosamente',
                'data' => $result
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear backup de carpeta: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Descargar backup de una carpeta específica
     */
    public function downloadFolderBackup(Request $request): mixed
    {
        try {
            $request->validate([
                'folder_name' => 'required|string|in:clientes,proveedores,productos'
            ]);

            $folderName = $request->input('folder_name');
            $timestamp = now()->format('Y-m-d_H-i-s');
            $backupName = "backup_{$folderName}_{$timestamp}.zip";

            // Crear el backup temporalmente
            $result = $this->backupService->createFolderBackup($folderName);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo crear el backup'
                ], 500);
            }

            $backupPath = storage_path('app/backups/images/' . $result['backup_name']);

            if (!file_exists($backupPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo de backup no encontrado'
                ], 404);
            }

            return response()->download($backupPath, $result['backup_name']);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar backup de carpeta: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una carpeta específica desde un backup
     */
    public function restoreFolderBackup(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'backup_name' => 'required|string',
                'folder_name' => 'required|string|in:clientes,proveedores,productos',
                'skip_existing' => 'boolean'
            ]);

            $backupName = $request->input('backup_name');
            $folderName = $request->input('folder_name');
            $skipExisting = $request->input('skip_existing', true);

            $result = $this->backupService->restoreFolderBackup($backupName, $folderName, $skipExisting);

            return response()->json([
                'success' => true,
                'message' => 'Carpeta restaurada exitosamente',
                'data' => $result
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar carpeta: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener información de espacio en disco
     */
    public function getDiskSpace(): JsonResponse
    {
        try {
            $diskInfo = $this->chunkedUploadService->getDiskSpaceInfo();

            return response()->json([
                'success' => true,
                'data' => $diskInfo
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información del disco: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Iniciar subida por partes
     */
    public function startChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string|regex:/^[a-zA-Z0-9_-]+$/',
                'file_name' => 'required|string|ends_with:.zip',
                'total_chunks' => 'required|integer|min:1|max:10000',
                'total_size' => 'required|integer|min:1'
            ]);

            $uploadId = $request->input('upload_id');
            $fileName = $request->input('file_name');
            $totalChunks = $request->input('total_chunks');
            $totalSize = $request->input('total_size');

            // Validar espacio disponible
            $diskInfo = $this->chunkedUploadService->getDiskSpaceInfo();
            if ($diskInfo['available_for_backups'] < $totalSize) {
                return response()->json([
                    'success' => false,
                    'message' => 'Espacio insuficiente en disco',
                    'data' => [
                        'required' => $this->formatBytes($totalSize),
                        'available' => $diskInfo['available_for_backups_formatted']
                    ]
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Upload iniciado',
                'data' => [
                    'upload_id' => $uploadId,
                    'file_name' => $fileName,
                    'total_chunks' => $totalChunks,
                    'total_size' => $totalSize,
                    'total_size_formatted' => $this->formatBytes($totalSize)
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error iniciando upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir un chunk
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'chunk' => 'required|file|max:52428800', // 50MB por chunk
                'upload_id' => 'required|string|regex:/^[a-zA-Z0-9_-]+$/',
                'chunk_index' => 'required|integer|min:0',
                'total_chunks' => 'required|integer|min:1',
                'file_name' => 'required|string|ends_with:.zip'
            ]);

            $chunkFile = $request->file('chunk');
            $uploadId = $request->input('upload_id');
            $chunkIndex = (int) $request->input('chunk_index');
            $totalChunks = (int) $request->input('total_chunks');
            $fileName = $request->input('file_name');

            $result = $this->chunkedUploadService->processChunk(
                $chunkFile,
                $uploadId,
                $chunkIndex,
                $totalChunks,
                $fileName
            );

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error subiendo chunk: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Finalizar subida y ensamblar chunks
     */
    public function finishChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string|regex:/^[a-zA-Z0-9_-]+$/',
                'file_name' => 'required|string|ends_with:.zip'
            ]);

            $uploadId = $request->input('upload_id');
            $fileName = $request->input('file_name');

            $result = $this->chunkedUploadService->finishUpload($uploadId, $fileName);

            return response()->json([
                'success' => true,
                'message' => 'Archivo ensamblado exitosamente',
                'data' => $result
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error finalizando upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estado de un upload en progreso
     */
    public function getChunkedUploadStatus(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string|regex:/^[a-zA-Z0-9_-]+$/'
            ]);

            $uploadId = $request->input('upload_id');
            $status = $this->chunkedUploadService->getUploadStatus($uploadId);

            return response()->json($status);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancelar upload
     */
    public function cancelChunkedUpload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'upload_id' => 'required|string|regex:/^[a-zA-Z0-9_-]+$/'
            ]);

            $uploadId = $request->input('upload_id');
            $this->chunkedUploadService->cleanupUpload($uploadId);

            return response()->json([
                'success' => true,
                'message' => 'Upload cancelado y limpiado'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelando upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir un archivo ZIP de backup (método antiguo, mantener para compatibilidad)
     */
    public function uploadBackup(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:zip|max:52428800' // 50MB max para upload directo
            ]);

            $file = $request->file('file');
            $backupDir = storage_path('app/backups/images');

            // Crear directorio si no existe
            if (!is_dir($backupDir)) {
                @mkdir($backupDir, 0755, true);
            }

            $fileName = $file->getClientOriginalName();
            $targetPath = $backupDir . DIRECTORY_SEPARATOR . $fileName;

            // Mover archivo al directorio de backups
            if ($file->move($backupDir, $fileName)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Archivo subido exitosamente',
                    'data' => [
                        'backup_name' => $fileName,
                        'file_size' => filesize($targetPath),
                        'file_size_formatted' => $this->formatBytes(filesize($targetPath))
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo mover el archivo al directorio de backups'
                ], 500);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Formatear bytes a string legible (helper para JSON)
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
