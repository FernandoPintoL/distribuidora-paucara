import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Imagen } from '@/domain/productos';

export interface Step4Props {
  data: { perfil?: { file?: File | null; url?: string }; galeria: Imagen[] };
  setPerfil: (file: File | undefined) => void;
  addGaleria: (files: FileList | null) => void;
  removeGaleria: (i: number) => void | Promise<void>;
}

export default function Step4Imagenes({ data, setPerfil, addGaleria, removeGaleria }: Step4Props) {
  return (
    <div>
      <div className="bg-secondary border border-border rounded p-3">
        <div className="text-sm font-semibold text-foreground">Paso 4: Imágenes</div>
        <div className="text-xs text-muted-foreground">Agrega la foto de perfil y las imágenes de la galería</div>
      </div>
      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base font-semibold">Foto de perfil</Label>
          <div className="relative">
            {data.perfil?.url ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img src={data.perfil.url} alt="Perfil del producto" className="w-32 h-32 object-cover rounded-lg border shadow-md" />
                  <Button type="button" size="sm" variant="destructive" className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0" onClick={() => setPerfil(undefined)}>✕</Button>
                </div>
                <div className="text-sm text-gray-600">Imagen actual del producto</div>
                <div className="relative inline-block">
                  <Button type="button" variant="outline" size="sm" className="relative overflow-hidden">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Cambiar imagen
                    </span>
                    <input type="file" accept="image/*" onChange={e => setPerfil(e.target.files?.[0] ?? undefined)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </Button>
                </div>
              </div>
            ) : data.perfil?.file ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img src={URL.createObjectURL(data.perfil.file)} alt="Vista previa" className="w-32 h-32 object-cover rounded-lg border shadow-md" />
                  <Button type="button" size="sm" variant="destructive" className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0" onClick={() => setPerfil(undefined)}>✕</Button>
                </div>
                <div className="text-sm text-gray-600">Nueva imagen seleccionada</div>
                <div className="relative inline-block">
                  <Button type="button" variant="outline" size="sm" className="relative overflow-hidden">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Cambiar imagen
                    </span>
                    <input type="file" accept="image/*" onChange={e => setPerfil(e.target.files?.[0] ?? undefined)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-border/80 transition-colors relative cursor-pointer">
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Selecciona una imagen</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 4MB</p>
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={e => setPerfil(e.target.files?.[0] ?? undefined)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Galería de imágenes</Label>
            <div className="relative">
              <Button type="button" size="sm" variant="outline" className="relative overflow-hidden">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Agregar imágenes
                </span>
                <input type="file" accept="image/*" multiple onChange={e => addGaleria(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </Button>
            </div>
          </div>

          {data.galeria && data.galeria.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.galeria.map((img: Imagen, i: number) => (
                <div key={i} className="relative group">
                  <div className="aspect-square overflow-hidden rounded-lg border bg-secondary">
                    {img.url ? (
                      <img src={img.url} alt={`Galería ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : img.file ? (
                      <img src={URL.createObjectURL(img.file)} alt={`Vista previa ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </div>
                  <Button type="button" size="sm" variant="destructive" className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" onClick={() => removeGaleria(i)}>✕</Button>
                  <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">Imagen {i + 1}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="space-y-3">
                <div className="mx-auto w-10 h-10 text-gray-300">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <p className="text-sm text-muted-foreground">No hay imágenes en la galería</p>
                <p className="text-xs text-muted-foreground/80">Usa el botón "Agregar imágenes" para subir fotos adicionales</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
