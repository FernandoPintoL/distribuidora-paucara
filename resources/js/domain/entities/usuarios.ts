// Domain: Usuarios
import type { BaseEntity } from './generic';
import type { Id } from './shared';

export interface Usuario extends BaseEntity {
    id: Id;
    name: string;
    usernick?: string;
    email?: string;
}
