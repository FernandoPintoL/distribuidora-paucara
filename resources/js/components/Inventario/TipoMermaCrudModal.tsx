import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTipoMermas, TipoMermaApi } from '@/stores/useTipoMermas';
import { TipoMermaService } from '@/services/tipoMermaService';

export function TipoMermaCrudModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { tipos, fetchTipos } = useTipoMermas();
    const [editing, setEditing] = useState<TipoMermaApi | null>(null);
    const [form, setForm] = useState<Partial<TipoMermaApi>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) fetchTipos();
    }, [open, fetchTipos]);

    const handleEdit = (tipo: TipoMermaApi) => {
        setEditing(tipo);
        setForm(tipo);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar tipo de merma?')) return;
        setLoading(true);
        await TipoMermaService.remove(id);
        await fetchTipos();
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (editing) {
            await TipoMermaService.update(editing.id, form);
        } else {
            await TipoMermaService.create(form);
        }
        setEditing(null);
        setForm({});
        await fetchTipos();
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-w-lg w-full p-6 rounded-lg bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Gestionar Tipos de Merma</h2>
                        <DialogClose asChild>
                            <Button variant="ghost">Cerrar</Button>
                        </DialogClose>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                        <Input
                            placeholder="Clave (ej: VENCIMIENTO)"
                            value={form.clave || ''}
                            onChange={e => setForm(f => ({ ...f, clave: e.target.value }))}
                            required
                            disabled={!!editing}
                        />
                        <Input
                            placeholder="Nombre visible"
                            value={form.label || ''}
                            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                            required
                        />
                        <Input
                            placeholder="Descripción"
                            value={form.descripcion || ''}
                            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                        />
                        <div className="flex gap-2">
                            <Input
                                placeholder="Color"
                                value={form.color || ''}
                                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                            />
                            <Input
                                placeholder="BG Color"
                                value={form.bg_color || ''}
                                onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}
                            />
                            <Input
                                placeholder="Text Color"
                                value={form.text_color || ''}
                                onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))}
                            />
                        </div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!form.requiere_aprobacion}
                                onChange={e => setForm(f => ({ ...f, requiere_aprobacion: e.target.checked }))}
                            />
                            Requiere aprobación
                        </label>
                        <Button type="submit" disabled={loading}>
                            {editing ? 'Actualizar' : 'Crear'}
                        </Button>
                        {editing && (
                            <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({}); }}>
                                Cancelar edición
                            </Button>
                        )}
                    </form>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Clave</th>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tipos.map(tipo => (
                                    <tr key={tipo.id} className="border-b">
                                        <td>{tipo.clave}</td>
                                        <td>{tipo.label}</td>
                                        <td>{tipo.descripcion}</td>
                                        <td className="flex gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(tipo)}>
                                                Editar
                                            </Button>
                                            <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(tipo.id)}>
                                                Eliminar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
