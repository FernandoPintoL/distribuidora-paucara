# 📋 Implementación de OutputSelectionModal

## ✅ Resumen de Cambios

Se ha implementado un componente modal reutilizable para permitir a los usuarios elegir cómo exportar documentos (Imprimir, Excel, PDF) después de crear o editar documentos.

## 📁 Archivos Creados/Modificados

### 1. **Nuevo Componente Modal**
- **Archivo:** `resources/js/presentation/components/impresion/OutputSelectionModal.tsx`
- **Características:**
  - Selector de acción primero (Imprimir | Excel | PDF)
  - Para Imprimir: selector de impresoras + selector de formatos
  - Para Excel/PDF: solo selector de formatos
  - Defaults por tipo de documento:
    - Ventas, Compras, Pagos, Cajas: **TICKET_80** (80mm)
    - Inventarios: **A4**
  - Reutilizable para múltiples tipos de documentos
  - Soporte para Web Print API (si disponible)

### 2. **Página de Ventas Actualizada**
- **Archivo:** `resources/js/presentation/pages/ventas/create.tsx`
- **Cambios:**
  - ✅ Importado `OutputSelectionModal`
  - ✅ Agregado estado `showOutputModal` y `ventaCreada`
  - ✅ Modificado `handleConfirmSubmit` para mostrar modal en lugar de abrir impresora automáticamente
  - ✅ Agregado componente en JSX

### 3. **Rutas Actualizadas**
- **Archivo:** `routes/web.php`
- **Nuevas Rutas:**
  ```php
  Route::get('{venta}/exportar-excel', [VentaController::class, 'exportarExcel'])
  Route::get('{venta}/exportar-pdf', [VentaController::class, 'exportarPdf'])
  ```

### 4. **Controlador Actualizado**
- **Archivo:** `app/Http/Controllers/VentaController.php`
- **Nuevos Métodos:**
  - `exportarExcel()` - Exporta venta a CSV (compatible con Excel)
  - `exportarPdf()` - Exporta venta a PDF usando ImpresionService existente
  - Ambos incluyen validación de permisos y logging

---

## 🚀 Cómo Implementar en Otros Módulos

### Módulo de Compras

1. **Actualizar Controlador:**
   ```bash
   app/Http/Controllers/CompraController.php
   ```
   - Agregar métodos `exportarExcel()` y `exportarPdf()` (copiar de VentaController)

2. **Actualizar Rutas:**
   ```php
   // routes/web.php
   Route::prefix('compras')->name('compras.')->group(function () {
       Route::get('{compra}/exportar-excel', [CompraController::class, 'exportarExcel']);
       Route::get('{compra}/exportar-pdf', [CompraController::class, 'exportarPdf']);
   });
   ```

3. **Actualizar Página de Compras:**
   ```tsx
   // resources/js/presentation/pages/compras/create.tsx
   import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';

   // En estado:
   const [showOutputModal, setShowOutputModal] = useState(false);
   const [compraCreada, setCompraCreada] = useState<{ id: number; numero: string; fecha: string } | null>(null);

   // En handleConfirmSubmit (después de éxito):
   setCompraCreada({
       id: result.data.id,
       numero: result.data.numero,
       fecha: result.data.fecha
   });
   setShowOutputModal(true);

   // En JSX:
   {compraCreada && (
       <OutputSelectionModal
           isOpen={showOutputModal}
           onClose={() => {
               setShowOutputModal(false);
               setCompraCreada(null);
           }}
           documentoId={compraCreada.id}
           tipoDocumento="compra"
           documentoInfo={{
               numero: compraCreada.numero,
               fecha: compraCreada.fecha
           }}
       />
   )}
   ```

### Módulo de Pagos de Créditos

1. Seguir el mismo patrón que Compras
2. Usar `tipoDocumento="pago"` en OutputSelectionModal
3. Rutas similares: `/pagos/{pago}/exportar-excel|pdf`

### Módulo de Cajas

1. Seguir el mismo patrón
2. **Nota:** El controlador debe manejar la ruta especial `/cajas/{id}/movimientos` o `/cajas/{id}/cierre`
3. Usar `tipoDocumento="caja"` en OutputSelectionModal

### Módulo de Inventarios

1. Seguir el mismo patrón
2. **Diferencia:** Usar `tipoDocumento="inventario"` (default format es A4)
3. Rutas: `/inventarios/{id}/exportar-excel|pdf`

---

## 📝 Configuración del Componente Modal

### Props de OutputSelectionModal

```typescript
interface OutputSelectionModalProps {
    isOpen: boolean;                          // Control de visibilidad del modal
    onClose: () => void;                      // Callback al cerrar
    documentoId: number | string;             // ID del documento
    tipoDocumento: TipoDocumento;             // Type: 'venta'|'compra'|'pago'|'caja'|'inventario'
    documentoInfo?: {                         // Información adicional para mostrar
        numero?: string;                      // Número del documento
        fecha?: string;                       // Fecha del documento
        monto?: number;                       // Monto (opcional)
    };
}
```

### Formatos Disponibles por Tipo de Documento

```typescript
FORMATO_CONFIG: Record<TipoDocumento, FormatoConfig[]> = {
    venta:     [TICKET_80 (default), TICKET_58, A4],
    compra:    [TICKET_80 (default), TICKET_58, A4],
    pago:      [TICKET_80 (default), TICKET_58, A4],
    caja:      [TICKET_80 (default), TICKET_58, A4],
    inventario:[A4 (default), TICKET_80, TICKET_58],
}
```

---

## 🔧 Funcionalidad de Impresoras

### Estado Actual
- **Web Print API:** Intenta usar si está disponible (navegadores Chromium)
- **Fallback:** Usa diálogo de impresión del navegador
- **Selector:** Si hay impresoras disponibles, muestra dropdown, sino advierte al usuario

### Flujo
```
Usuario selecciona "Imprimir"
  ↓
Sistema intenta cargar impresoras disponibles
  ↓
Si hay impresoras → Muestra dropdown de selección
Si no hay impresoras → Muestra advertencia
  ↓
Usuario selecciona formato
  ↓
Click en "Imprimir" → Abre nueva ventana con PDF
```

---

## 🔐 Seguridad

### Validaciones Implementadas
1. **Autorización:** Se valida que el usuario tiene permiso para acceder al documento
   - Super Admin y Admin: acceso a todos los documentos
   - Otros roles: solo documentos autorizados
2. **CSRF Token:** Incluido automáticamente en las peticiones
3. **Logging:** Todas las operaciones se registran (acceso, exportaciones, errores)

---

## 📊 Flujo de la Aplicación (Ejemplo: Ventas)

```
1. Usuario llena formulario de venta
   ↓
2. Click en "Crear venta"
   ↓
3. Modal de preview aparece (VentaPreviewModal)
   ↓
4. Click en "Confirmar"
   ↓
5. handleConfirmSubmit() se ejecuta
   ↓
6. Si éxito:
   - Limpiar formulario ✅
   - Guardar datos de venta creada
   - Mostrar OutputSelectionModal ✅ (NUEVO)
   ↓
7. Usuario selecciona acción (Imprimir | Excel | PDF)
   ↓
8. Si Imprimir:
   - Mostrar selector de impresoras
   - Mostrar selector de formatos
   - Ejecutar GET /ventas/{id}/imprimir
   ↓
9. Si Excel:
   - Mostrar selector de formatos
   - Ejecutar GET /ventas/{id}/exportar-excel (NUEVO)
   - Descargar archivo CSV
   ↓
10. Si PDF:
    - Mostrar selector de formatos
    - Ejecutar GET /ventas/{id}/exportar-pdf (NUEVO)
    - Descargar archivo PDF
```

---

## 🛠️ Testing

### Pruebas Recomendadas

1. **Crear Venta:**
   - Completar formulario → Click "Crear venta"
   - Verificar que modal de salida aparece
   - Probar cada opción (Imprimir, Excel, PDF)

2. **Imprimir:**
   - Seleccionar diferentes formatos
   - Verificar que abre nueva ventana con PDF
   - Probar en diferentes navegadores

3. **Excel:**
   - Descargar archivo
   - Abrir en Excel/Calc
   - Verificar datos se ven correctamente

4. **PDF:**
   - Descargar archivo
   - Abrir en lector PDF
   - Verificar formateo correcto

5. **Permisos:**
   - Probar como usuario sin permisos
   - Verificar que rechaza acceso (403)

---

## 📦 Dependencias Utilizadas

### Ya Instaladas
- ✅ `@headlessui/react` - Componentes sin estilos (Dialog, Transition)
- ✅ `lucide-react` - Iconografía
- ✅ `Tailwind CSS v4` - Estilos
- ✅ `react-hot-toast` - Notificaciones

### No requiere instalación adicional
- El servicio `ImpresionService` ya existe
- El controlador ya tiene métodos de impresión

---

## 🐛 Troubleshooting

### Modal no aparece después de crear venta
- Verificar que el estado `showOutputModal` es true
- Verificar que `ventaCreada` tiene datos válidos
- Revisar console para errores

### URLs devuelven 404
- Verificar que las rutas están en `routes/web.php`
- Limpiar caché de Laravel: `php artisan route:clear`
- Verificar método en controlador existe

### Excel no se descarga correctamente
- El archivo actual es CSV, compatible con Excel
- Si necesitas formato .xlsx, considera instalar `maatwebsite/excel`
- Verificar encoding UTF-8 con BOM

### Impresoras no se detectan
- Es normal en la mayoría de navegadores
- El fallback al diálogo de impresión del navegador funciona correctamente
- Los usuarios pueden seleccionar impresora ahí

---

## 🎯 Próximos Pasos

1. ✅ Implementar en Ventas (COMPLETADO)
2. ⏳ Implementar en Compras
3. ⏳ Implementar en Pagos de Créditos
4. ⏳ Implementar en Cajas
5. ⏳ Implementar en Inventarios
6. ⏳ (Opcional) Instalar `maatwebsite/excel` para mejor soporte de Excel (.xlsx)
7. ⏳ (Opcional) Agregar más opciones de exportación (JSON, XML, etc.)

---

## 📞 Soporte

Para hacer cambios o agregar funcionalidad:
1. Buscar `OutputSelectionModal` en el proyecto
2. Ver los ejemplos en `ventas/create.tsx`
3. Adaptar a otros módulos siguiendo el mismo patrón
4. Agregar nuevas rutas y métodos en controladores

