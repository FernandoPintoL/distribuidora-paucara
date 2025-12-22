# Technical Specification - Create Entregas Refactor (Option B)

## Overview
Refactor the delivery creation interface to use a persistent grid layout where the sales list is always visible on the left, and the form panel dynamically updates on the right based on selection.

## Architecture

### Component Hierarchy
```
CreateEntregasUnificado
├─ Header
├─ Main Grid (12 cols)
│  ├─ Panel Left (4/12) - STICKY
│  │  └─ Card
│  │     ├─ BatchVentaSelector
│  │     └─ SummaryCard (NUEVA)
│  └─ Panel Right (8/12) - SCROLLABLE
│     └─ renderDynamicFormPanel()
│        ├─ State: 0 ventas → EmptyState
│        ├─ State: 1 venta → SimpleEntregaForm
│        └─ State: 2+ ventas → BatchUI
└─ Footer Sticky (appears only when selectedCount >= 1)
   ├─ Button: Cancel
   └─ Button: Create X Entregas
```

## State Management

### Local State (CreateEntregasUnificado)
```typescript
const [selectedVentaIds, setSelectedVentaIds] = useState<number[]>([]);
const [showFooter, setShowFooter] = useState(false);

// Computed
const selectedVentas = useMemo(
  () => ventas.filter(v => selectedVentaIds.includes(v.id)),
  [ventas, selectedVentaIds]
);

const totals = useMemo(() => {
  return {
    count: selectedVentaIds.length,
    pesoTotal: selectedVentas.reduce((sum, v) => sum + (v.peso || 0), 0),
    montoTotal: selectedVentas.reduce((sum, v) => sum + (v.total || 0), 0),
  };
}, [selectedVentas]);
```

### Hook State (useEntregaBatch)
- Only used when `selectedVentaIds.length >= 2`
- Handles batch form data, optimization, preview
- Reset when: user deselects all, switches from batch to single

## Key Behaviors

### Selection Change Handler
```typescript
const handleToggleVenta = (ventaId: number) => {
  setSelectedVentaIds(prev => {
    const updated = prev.includes(ventaId)
      ? prev.filter(id => id !== ventaId)
      : [...prev, ventaId];

    // Footer visibility
    setShowFooter(updated.length > 0);

    // If going from 2+ to <2, reset batch state
    if (prev.length >= 2 && updated.length < 2) {
      resetEntregaBatchState();
    }

    // If deselecting with active optimization, reset preview
    if (prev.length >= 2 && updated.length >= 2) {
      clearOptimizationPreview();
    }

    return updated;
  });
};
```

### Responsive Behavior

#### Desktop (lg: 1024px+)
- Grid 4/8 layout
- Left panel sticky (top: 1.5rem)
- Right panel scrollable
- Footer stays at bottom

#### Mobile (< 1024px)
- Stack vertical
- Left panel: Full width, Stack 1st
- Right panel: Full width, Stack 2nd
- Both independently scrollable
- Footer: Bottom of page (or sticky if space allows)

## Components

### New Component: SummaryCard
Location: `components/SummaryCard.tsx`

```typescript
interface SummaryCardProps {
  totalVentas: number;
  pesoTotal: number;
  montoTotal: number;
}

export default function SummaryCard({
  totalVentas,
  pesoTotal,
  montoTotal,
}: SummaryCardProps) {
  return (
    <Card className="mt-4 bg-gray-50 dark:bg-slate-800">
      <div className="p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Ventas</p>
          <p className="text-lg font-bold">{totalVentas}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Peso Total</p>
          <p className="text-lg font-bold">{pesoTotal.toFixed(1)} kg</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Monto</p>
          <p className="text-lg font-bold">Bs {montoTotal.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
```

### Modified Component: SimpleEntregaForm
- No "Back" button (user uses checkbox to deselect)
- Compact, single-panel form
- Submit button in footer (not in form)
- Error handling with AlertCircle icon

### Enhanced Component: CreateEntregasUnificado
Key additions:
1. Grid layout (4/8 split)
2. Left panel sticky positioning
3. Dynamic right panel based on selection count
4. Footer visibility toggle
5. Summary metrics display
6. Reset logic on deselection

## Styling Considerations

### Colors & Classes
- Header: `text-gray-900 dark:text-gray-100`
- Card background: `bg-white dark:bg-slate-900`
- Summary: `bg-gray-50 dark:bg-slate-800`
- Empty state: `bg-blue-50 dark:bg-blue-900/20`
- Borders: `border-gray-200 dark:border-gray-700`

### Spacing (Tailwind)
- Container: `max-w-7xl mx-auto px-4`
- Gap between panels: `gap-6`
- Sticky offset: `lg:top-6`
- Card padding: `p-4` or `p-6`

### Responsive Classes
- Grid: `grid grid-cols-1 lg:grid-cols-12 gap-6`
- Left: `lg:col-span-4`
- Right: `lg:col-span-8`
- Sticky: `lg:sticky lg:top-6`

## Form Submission Flow

### Single Venta (selectedCount === 1)
1. User fills SimpleEntregaForm
2. Clicks "Crear Entrega" in footer
3. Submit via SimpleEntregaForm's onSubmit callback
4. POST `/api/entregas` with single venta data
5. Redirect to `/logistica/entregas`

### Multiple Ventas (selectedCount >= 2)
1. User selects vehículo, chofer
2. Optional: Enable optimization
3. Optional: View preview
4. Clicks "Crear X Entregas" in footer
5. POST `/api/entregas/batch` with batch data
6. Redirect to `/logistica/entregas`

## Testing Checklist

### Functional
- [ ] 0 ventas: Show empty state message
- [ ] 1 venta: Show SimpleEntregaForm
- [ ] 2+ ventas: Show batch UI with optimization option
- [ ] Footer: Only visible when selectedCount >= 1
- [ ] Selection: Toggle venta checkbox updates right panel immediately
- [ ] Deselect all: Footer disappears, right panel shows empty state
- [ ] Deselect with optimization: Preview clears, optimization resets
- [ ] Summary: Updates correctly with weight, amount, count

### Responsive
- [ ] Desktop (1024px+): Grid 4/8 layout with sticky left
- [ ] Tablet (768px): Grid stacks properly
- [ ] Mobile (<768px): Full width stack vertical
- [ ] Scroll: Left panel remains sticky on desktop
- [ ] Footer: Visible and accessible on all sizes

### UX
- [ ] No data loss on selection change
- [ ] Smooth transitions between states
- [ ] Clear visual feedback on interactions
- [ ] Accessible color contrast
- [ ] Dark mode support

## Performance Notes

### Optimization Techniques
1. **useMemo**: Calculate totals only when selectedVentas changes
2. **useCallback**: Memoize event handlers to prevent re-renders
3. **Lazy Loading**: Defer heavy optimization calculations
4. **Conditional Rendering**: Don't render batch UI when count < 2

### Potential Bottlenecks
- Large venta lists (>100 items): Consider pagination/virtualization
- Heavy optimization calculations: Already handled by service
- Image loading in list: Use lazy loading if applicable

## Error Handling

### User-Facing Errors
- Required field missing: Show in SimpleEntregaForm error div
- API submission error: Toast notification with retry option
- Optimization failed: Show error in preview area

### Edge Cases
- Rapid clicking checkboxes: Debounce state updates
- Selecting while optimizing: Disable checkboxes during loading
- Network timeout: Graceful fallback and retry UI
