/**
 * Servicio para calcular carritos con precios por rango de cantidad
 *
 * FASE 4 - IMPLEMENTACION DE RANGOS DE PRECIOS EN WEB
 *
 * Este servicio consume el endpoint /api/carrito/calcular del backend
 * que retorna información de tipos de precio aplicados según cantidad
 */

import type { Id } from '@/domain/entities/shared';

// ============= TIPOS DEL CARRITO CON RANGOS =============

export interface RangoAplicado {
    id: Id;
    cantidad_minima: number;
    cantidad_maxima: number | null;
    tipo_precio_id: Id;
    tipo_precio_nombre: string;
}

export interface ProximoRango {
    cantidad_minima: number;
    cantidad_maxima: number | null;
    tipo_precio_nombre: string;
    falta_cantidad?: number;
}

export interface DetalleCarritoConRango {
    producto_id: Id;
    producto_nombre: string;
    producto_sku: string;
    cantidad: number;
    tipo_precio_id: Id;
    tipo_precio_nombre: string;
    precio_unitario: number;
    subtotal: number;
    rango_aplicado: RangoAplicado | null;
    proximo_rango: ProximoRango | null;
    ahorro_proximo: number | null;
}

export interface CarritoCalculadoResponse {
    detalles: DetalleCarritoConRango[];
    subtotal: number;
    total: number;
    cantidad_items: number;
    ahorro_disponible: number;
    tiene_ahorro_disponible: boolean;
}

export interface ItemCarrito {
    producto_id: Id;
    cantidad: number;
}

// ============= SERVICIO =============

class PrecioRangoCarritoService {
    /**
     * Calcular carrito con precios por rango
     *
     * POST /api/carrito/calcular
     *
     * @param items Array de items con producto_id y cantidad
     * @returns Respuesta con detalles de precios según rango
     */
    async calcularCarrito(items: ItemCarrito[]): Promise<CarritoCalculadoResponse> {
        try {
            console.log('📤 Enviando solicitud a /api/carrito/calcular:', JSON.stringify({ items }, null, 2));

            const response = await fetch('/api/carrito/calcular', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                },
                body: JSON.stringify({
                    items: items,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Error en calcularCarrito:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data,
                });

                // ✅ MEJORADO: Manejar diferentes formatos de error
                let errorMessage = response.statusText;

                // Formato 1: error simple (del backend con throw new InvalidArgumentException)
                if (data.error) {
                    errorMessage = data.error;
                }
                // Formato 2: errors object (validación de Request)
                else if (data.errors) {
                    errorMessage = Object.entries(data.errors)
                        .map(([field, messages]: any) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                        .join('\n');
                }
                // Formato 3: message (otro formato)
                else if (data.message) {
                    errorMessage = data.message;
                }

                throw new Error(errorMessage);
            }

            // ✅ MODIFICADO: Solo loguear en consola, NO mostrar toast de éxito
            console.log('✅ Respuesta completa de /api/carrito/calcular:', data);

            // ✅ NUEVO: Logs detallados de cada detalle del carrito
            const carritoData = data.data || data; // Manejar ambos formatos
            if (carritoData?.detalles && Array.isArray(carritoData.detalles)) {
                console.log('📋 ===== DETALLES DEL CARRITO CALCULADO =====');
                carritoData.detalles.forEach((detalle: any, index: number) => {
                    console.log(`\n📦 Detalle #${index}:`);
                    console.log(`   Producto: ${detalle.producto_nombre} (ID: ${detalle.producto_id})`);
                    console.log(`   Cantidad: ${detalle.cantidad}`);
                    console.log(`   🏷️ Tipo Precio: ${detalle.tipo_precio_nombre} (ID: ${detalle.tipo_precio_id})`);
                    console.log(`   💵 Precio Unitario: ${detalle.precio_unitario}`);
                    console.log(`   📊 Subtotal: ${detalle.subtotal}`);
                    if (detalle.rango_aplicado) {
                        console.log(`   ✅ Rango Aplicado: ${detalle.rango_aplicado.cantidad_minima}-${detalle.rango_aplicado.cantidad_maxima || '∞'} unidades`);
                        console.log(`      Tipo en Rango: ${detalle.rango_aplicado.tipo_precio_nombre}`);
                    } else {
                        console.log(`   ❌ Sin rango aplicado (precio normal)`);
                    }
                    if (detalle.proximo_rango) {
                        console.log(`   📈 Próximo Rango: ${detalle.proximo_rango.cantidad_minima} unidades (falta: ${detalle.proximo_rango.falta_cantidad})`);
                        if (detalle.ahorro_proximo) {
                            console.log(`      💰 Ahorro Disponible: ${detalle.ahorro_proximo}`);
                        }
                    }
                });
                console.log(`\n💰 Resumen Total:`);
                console.log(`   Subtotal: ${carritoData.subtotal}`);
                console.log(`   Total: ${carritoData.total}`);
                if (carritoData.ahorro_disponible) {
                    console.log(`   Ahorro Disponible: ${carritoData.ahorro_disponible}`);
                }
                console.log('==========================================\n');
            }

            return data;
        } catch (error) {
            console.error('❌ Error calculando carrito con rangos:', error);
            throw error;
        }
    }

    /**
     * Obtener token CSRF del meta tag
     */
    private getCsrfToken(): string {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        return token || '';
    }

    /**
     * Formatear moneda para mostrar precios
     */
    formatCurrency(value: number, decimals: number = 2): string {
        return value.toLocaleString('es-BO', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    /**
     * Obtener mensaje de ahorro disponible
     */
    getAhorroMessage(detalle: DetalleCarritoConRango): string | null {
        if (!detalle.ahorro_proximo || !detalle.proximo_rango) {
            return null;
        }

        const falta = detalle.proximo_rango.falta_cantidad || 0;
        const ahorro = detalle.ahorro_proximo;

        return `Ahorro disponible: Bs ${this.formatCurrency(ahorro)} si agregás ${falta} unidad${falta !== 1 ? 'es' : ''} más`;
    }

    /**
     * Obtener indicador visual del rango
     */
    getRangoIndicator(detalle: DetalleCarritoConRango): string {
        if (!detalle.rango_aplicado) {
            return '📌 Sin rango';
        }

        const cantidad = detalle.cantidad;
        const min = detalle.rango_aplicado.cantidad_minima;
        const max = detalle.rango_aplicado.cantidad_maxima;

        if (max === null) {
            return `📦 ${min}+ unidades`;
        }

        return `📦 ${min}-${max} unidades`;
    }
}

// Singleton instance
const precioRangoCarritoService = new PrecioRangoCarritoService();
export default precioRangoCarritoService;
