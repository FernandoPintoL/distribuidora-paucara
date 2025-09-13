import React, { useState, useEffect } from 'react';
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEstadoMermas, EstadoMermaApi } from '@/stores/useEstadoMermas';
import { EstadoMermaService } from '@/services/estadoMermaService';

export function EstadoMermaCrudModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { estados, fetchEstados } = useEstadoMermas();
    const [editing, setEditing] = useState<EstadoMermaApi | null>(null);
    const [form, setForm] = useState<Partial<EstadoMermaApi>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) fetchEstados();
    }, [open, fetchEstados]);

    const handleEdit = (estado: EstadoMermaApi) => {
        setEditing(estado);
        setForm(estado);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar estado de merma?')) return;
        setLoading(true);
        await EstadoMermaService.remove(id);
        await fetchEstados();
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (editing) {
            await EstadoMermaService.update(editing.id, form);
        } else {
            await EstadoMermaService.create(form);
        }
        setEditing(null);
        setForm({});
        await fetchEstados();
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="max-w-lg w-full p-6 rounded-lg bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Gestionar Estados de Merma</h2>
                        <DialogClose asChild>
                            <Button variant="ghost">Cerrar</Button>
                        </DialogClose>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                        <Input
                            placeholder="Clave (ej: PENDIENTE)"
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
                        <Input
                            placeholder="Acciones (coma separadas)"
                            value={Array.isArray(form.actions) ? form.actions.join(',') : ''}
                            onChange={e => setForm(f => ({ ...f, actions: e.target.value.split(',').map(a => a.trim()) }))}
                        />
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
                                    <th>Color</th>
                                    <th>Acciones</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {estados.map(estado => (
                                    <tr key={estado.id} className="border-b">
                                        <td>{estado.clave}</td>
                                        <td>{estado.label}</td>
                                        <td>{estado.color}</td>
                                        <td>{Array.isArray(estado.actions) ? estado.actions.join(', ') : ''}</td>
                                        <td className="flex gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(estado)}>
                                                Editar
                                            </Button>
                                            <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(estado.id)}>
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
