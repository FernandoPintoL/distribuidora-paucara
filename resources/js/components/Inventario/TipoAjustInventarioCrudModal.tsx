import React, { useState, useEffect } from 'react';
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTipoAjustInventario } from '@/stores/useTipoAjustInventario';
import { TipoAjustInventarioService, TipoAjustInventarioApi } from '@/services/tipoAjustInventarioService';

export function TipoAjustInventarioCrudModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { tipos, fetchTipos } = useTipoAjustInventario();
    const [editing, setEditing] = useState<TipoAjustInventarioApi | null>(null);
    const [form, setForm] = useState<Partial<TipoAjustInventarioApi>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) fetchTipos();
    }, [open, fetchTipos]);

    const handleEdit = (tipo: TipoAjustInventarioApi) => {
        setEditing(tipo);
        setForm(tipo);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar tipo de ajuste?')) return;
        setLoading(true);
        await TipoAjustInventarioService.remove(id);
        await fetchTipos();
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (editing) {
            await TipoAjustInventarioService.update(editing.id, form);
        } else {
            await TipoAjustInventarioService.create(form);
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
                    <DialogTitle asChild>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-bold">Gestionar Tipos de Ajuste de Inventario</span>
                            <DialogClose asChild>
                                <Button variant="ghost">Cerrar</Button>
                            </DialogClose>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="mb-4">
                        Crea, edita o elimina los tipos de ajuste disponibles para los movimientos de inventario.
                    </DialogDescription>
                    <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                        <Input
                            placeholder="Clave (ej: AJUSTE_FISICO)"
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
