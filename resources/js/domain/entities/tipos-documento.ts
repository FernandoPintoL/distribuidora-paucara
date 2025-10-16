// Domain: Tipos de Documento
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface TipoDocumento extends BaseEntity {
    id: Id;
    codigo: string;
    nombre: string;
    descripcion?: string;
}

export interface TipoDocumentoFormData extends BaseFormData {
    id?: Id;
    codigo: string;
    nombre: string;
    descripcion?: string;
}
