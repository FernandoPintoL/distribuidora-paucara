/**
 * Page: Cajas/Index
 *
 * Responsabilidades:
 * ✅ Renderizar página principal de gestión de cajas
 * ✅ Orquestar componentes sub-módulos
 * ✅ Gestionar estado de modales
 *
 * Arquitectura:
 * - Types: Domain entities from /domain/entities/cajas.ts
 * - Utils: Formatting functions from /lib/cajas.utils.tsx
 * - Hook: Business logic from /application/hooks/use-cajas.ts
 * - Components: Sub-components from ./components/
 */

import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import AperturaCajaModal from '@/presentation/components/AperturaCajaModal';
import CierreCajaModal from '@/presentation/components/CierreCajaModal';
import { CajaHeader, CajaEstadoCard, MovimientosDelDiaTable } from './components';
import { useCajas } from '@/application/hooks/use-cajas';
import type { CajasIndexProps } from '@/domain/entities/cajas';

export default function Index(props: CajasIndexProps) {
    const {
        showAperturaModal,
        showCierreModal,
        handleAbrirModal,
        handleCerrarModalApertura,
        handleAbrirCierreModal,
        handleCerrarModalCierre,
        cajaAbiertaHoy,
        cajas
    } = useCajas(props);

    const { movimientosHoy, totalMovimientos } = props;

    return (
        <AppLayout>
            <Head title="Gestión de Cajas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <CajaHeader />

                    <CajaEstadoCard
                        cajaAbiertaHoy={cajaAbiertaHoy}
                        totalMovimientos={totalMovimientos}
                        onAbrirClick={handleAbrirModal}
                        onCerrarClick={handleAbrirCierreModal}
                    />

                    <MovimientosDelDiaTable
                        cajaAbiertaHoy={cajaAbiertaHoy}
                        movimientosHoy={movimientosHoy}
                    />
                </div>
            </div>

            {/* Modales */}
            <AperturaCajaModal
                show={showAperturaModal}
                onClose={handleCerrarModalApertura}
                cajas={cajas}
            />

            <CierreCajaModal
                show={showCierreModal}
                onClose={handleCerrarModalCierre}
                cajaAbierta={cajaAbiertaHoy}
                montoEsperado={cajaAbiertaHoy ? cajaAbiertaHoy.monto_apertura + totalMovimientos : 0}
            />
        </AppLayout>
    );
}
