/**
 * Component: CajaHeader
 *
 * Responsabilidades:
 * ✅ Renderizar header con título y fecha actual
 * ✅ Información general del módulo de cajas
 */

export function CajaHeader() {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-BO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        💰 Gestión de Cajas
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formattedDate}
                    </div>
                </div>
            </div>
        </div>
    );
}
