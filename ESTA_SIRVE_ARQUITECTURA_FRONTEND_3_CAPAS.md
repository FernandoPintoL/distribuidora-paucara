# Arquitectura Frontend de 3 Capas

## Descripción General

El frontend de la aplicación está organizado en una **arquitectura de 3 capas** que separa claramente las responsabilidades y facilita el mantenimiento, testing y escalabilidad del código.

```
┌─────────────────────────────────────────────────┐
│         PRESENTACIÓN (UI)                       │
│  - Componentes visuales                         │
│  - Páginas                                      │
│  - Layouts                                      │
│  - Hooks de UI                                  │
└───────────────────┬─────────────────────────────┘
                    │ Eventos de usuario
                    ↓
┌─────────────────────────────────────────────────┐
│         APLICACIÓN (Business Logic)             │
│  - Casos de uso                                 │
│  - Hooks de negocio                             │
│  - Validaciones                                 │
│  - Orquestación                                 │
└───────────────────┬─────────────────────────────┘
                    │ Llama servicios
                    ↓
┌─────────────────────────────────────────────────┐
│         INFRAESTRUCTURA (Data Access)           │
│  - Services (API)                               │
│  - Hooks de infraestructura                     │
│  - Integración con APIs externas               │
│  - Llamadas HTTP                                │
└───────────────────┬─────────────────────────────┘
                    │ HTTP Requests
                    ↓
              ┌──────────┐
              │ BACKEND  │
              │ (Laravel)│
              └──────────┘
```

---

## Estructura de Directorios

```
resources/js/
├── presentation/              # CAPA 1: Presentación (UI)
│   ├── components/           # Componentes reutilizables
│   ├── pages/                # Páginas de la aplicación
│   ├── layouts/              # Layouts de página
│   └── hooks/                # Hooks de UI pura
│       ├── use-appearance.tsx
│       ├── use-initials.tsx
│       ├── use-mobile.tsx
│       ├── use-mobile-navigation.ts
│       └── use-search-select.ts
│
├── application/               # CAPA 2: Aplicación (Lógica de negocio)
│   ├── use-cases/            # Casos de uso específicos
│   └── hooks/                # Hooks de lógica de negocio
│       ├── use-generic-form.ts
│       ├── use-categoria-form.ts
│       ├── use-categorias.ts
│       ├── use-generic-entities.ts
│       └── use-auth.ts
│
├── infrastructure/            # CAPA 3: Infraestructura (Acceso a datos)
│   ├── services/             # Servicios de API
│   └── hooks/                # Hooks de infraestructura
│       ├── use-api-search.ts
│       ├── use-google-maps.ts
│       └── use-export.ts
│
├── domain/                    # DOMINIO (Entidades y contratos)
│   ├── entities/             # Definiciones de entidades
│   └── contracts/            # Interfaces y contratos
│
└── config/                    # Configuraciones de módulos
```

---

## Descripción de Capas

### 1. 📱 PRESENTACIÓN (Presentation Layer)

**Ubicación**: `resources/js/presentation/`

**Responsabilidad**: Renderizar la interfaz de usuario y capturar eventos.

**Contiene**:
- **Componentes React**: Componentes visuales reutilizables (botones, cards, modals, etc.)
- **Páginas**: Vistas completas de la aplicación
- **Layouts**: Estructuras de página (header, sidebar, footer)
- **Hooks de UI**: Lógica relacionada exclusivamente con la interfaz

#### Hooks de Presentación

| Hook | Descripción | Ubicación |
|------|-------------|-----------|
| `use-appearance.tsx` | Manejo de tema (dark/light mode) | `presentation/hooks/` |
| `use-initials.tsx` | Generación de iniciales para avatares | `presentation/hooks/` |
| `use-mobile.tsx` | Detección de viewport móvil | `presentation/hooks/` |
| `use-mobile-navigation.ts` | Lógica de navegación móvil | `presentation/hooks/` |
| `use-search-select.ts` | Lógica de componente select con búsqueda | `presentation/hooks/` |

**Ejemplo de uso**:
```typescript
import { useMobile } from '@/presentation/hooks/use-mobile';

function MyComponent() {
  const isMobile = useMobile();

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* contenido */}
    </div>
  );
}
```

---

### 2. 🧠 APLICACIÓN (Application Layer)

**Ubicación**: `resources/js/application/`

**Responsabilidad**: Contener la lógica de negocio, orquestación y validaciones.

**Contiene**:
- **Casos de Uso**: Flujos de negocio específicos
- **Hooks de Negocio**: Lógica de formularios, entidades, autenticación
- **Validaciones**: Reglas de negocio
- **Orquestación**: Coordinación entre presentación e infraestructura

#### Hooks de Aplicación

| Hook | Descripción | Ubicación |
|------|-------------|-----------|
| `use-generic-form.ts` | Lógica genérica de formularios (CRUD) | `application/hooks/` |
| `use-categoria-form.ts` | Lógica específica de formulario de categorías | `application/hooks/` |
| `use-categorias.ts` | Lógica de negocio de categorías | `application/hooks/` |
| `use-generic-entities.ts` | Orquestación genérica de entidades | `application/hooks/` |
| `use-auth.ts` | Lógica de autenticación y permisos | `application/hooks/` |

**Ejemplo de uso**:
```typescript
import { useGenericForm } from '@/application/hooks/use-generic-form';

function ClienteForm({ cliente }) {
  const { data, handleSubmit, handleFieldChange, processing, errors } =
    useGenericForm(cliente, clientesService, initialData);

  return (
    <form onSubmit={handleSubmit}>
      {/* campos del formulario */}
    </form>
  );
}
```

**Características**:
- ✅ No contiene lógica de UI
- ✅ No hace llamadas HTTP directas
- ✅ Orquesta servicios de infraestructura
- ✅ Valida reglas de negocio
- ✅ Maneja estado complejo

---

### 3. 🔌 INFRAESTRUCTURA (Infrastructure Layer)

**Ubicación**: `resources/js/infrastructure/`

**Responsabilidad**: Acceso a datos y comunicación con servicios externos.

**Contiene**:
- **Services**: Clases que se comunican con el backend
- **Hooks de Infraestructura**: Lógica de llamadas a APIs
- **Integración Externa**: Google Maps, servicios de terceros

#### Hooks de Infraestructura

| Hook | Descripción | Ubicación |
|------|-------------|-----------|
| `use-api-search.ts` | Búsqueda en API del backend | `infrastructure/hooks/` |
| `use-google-maps.ts` | Integración con Google Maps API | `infrastructure/hooks/` |
| `use-export.ts` | Exportación de datos (PDF, Excel) | `infrastructure/hooks/` |

**Ejemplo de uso**:
```typescript
import { useGoogleMaps } from '@/infrastructure/hooks/use-google-maps';

function MapComponent() {
  const { geocodeAddress, isLoading, error } = useGoogleMaps();

  const handleSearch = async (address: string) => {
    const coords = await geocodeAddress(address);
    if (coords) {
      console.log('Coordenadas:', coords);
    }
  };

  return (
    <div>
      {/* componente de mapa */}
    </div>
  );
}
```

**Características**:
- ✅ Hace llamadas HTTP
- ✅ Transforma datos del backend
- ✅ Maneja errores de red
- ✅ Integra APIs externas
- ✅ No contiene lógica de negocio

---

### 4. 📦 DOMINIO (Domain Layer)

**Ubicación**: `resources/js/domain/`

**Responsabilidad**: Definir el modelo de datos y contratos.

**Contiene**:
- **Entities**: Definiciones de tipos e interfaces de entidades
- **Contracts**: Interfaces y contratos entre capas

**Ejemplo**:
```typescript
// domain/entities/clientes.ts
export interface Cliente extends BaseEntity {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  localidad_id: number;
  activo: boolean;
}

export interface ClienteFormData extends BaseFormData {
  nombre: string;
  email: string;
  telefono?: string;
  localidad_id: number;
  foto_perfil?: File | null;
}
```

---

## Flujo de Datos

### Ejemplo: Creación de un Cliente

```
1. Usuario hace clic en "Crear Cliente"
   └─→ [PRESENTACIÓN] ClientesCreate.tsx renderiza el formulario

2. Usuario llena el formulario y hace submit
   └─→ [APLICACIÓN] useGenericForm valida y prepara los datos

3. useGenericForm llama al servicio
   └─→ [INFRAESTRUCTURA] clientesService.store(data)

4. Service hace la petición HTTP
   └─→ [BACKEND] Laravel procesa y guarda en la BD

5. Backend responde con el cliente creado
   └─→ [INFRAESTRUCTURA] Service transforma la respuesta

6. Respuesta llega a la aplicación
   └─→ [APLICACIÓN] useGenericForm actualiza el estado

7. Estado actualizado se refleja en la UI
   └─→ [PRESENTACIÓN] Componente muestra notificación de éxito
```

---

## Reglas de Dependencia

### ✅ Permitido

```
PRESENTACIÓN  →  APLICACIÓN  →  INFRAESTRUCTURA
     ↓               ↓               ↓
   DOMINIO       DOMINIO         DOMINIO
```

- Presentación puede usar Aplicación
- Aplicación puede usar Infraestructura
- Todas las capas pueden usar Dominio

### ❌ Prohibido

```
INFRAESTRUCTURA  ↛  APLICACIÓN
INFRAESTRUCTURA  ↛  PRESENTACIÓN
APLICACIÓN       ↛  PRESENTACIÓN
```

- Infraestructura NO puede importar de Aplicación ni Presentación
- Aplicación NO puede importar de Presentación

---

## Guía de Imports

### Imports Correctos por Capa

#### En Presentación:
```typescript
// ✅ Permitido
import { useGenericForm } from '@/application/hooks/use-generic-form';
import { useMobile } from '@/presentation/hooks/use-mobile';
import { Cliente } from '@/domain/entities/clientes';

// ❌ Prohibido
import { useApiSearch } from '@/infrastructure/hooks/use-api-search'; // Saltar capa
```

#### En Aplicación:
```typescript
// ✅ Permitido
import { clientesService } from '@/infrastructure/services/clientes.service';
import { Cliente } from '@/domain/entities/clientes';

// ❌ Prohibido
import { Button } from '@/presentation/components/ui/button'; // Dependencia inversa
```

#### En Infraestructura:
```typescript
// ✅ Permitido
import { Cliente } from '@/domain/entities/clientes';

// ❌ Prohibido
import { useGenericForm } from '@/application/hooks/use-generic-form'; // Dependencia inversa
import { Button } from '@/presentation/components/ui/button'; // Dependencia inversa
```

---

## Ventajas de esta Arquitectura

### 🎯 Separación de Responsabilidades
Cada capa tiene una responsabilidad clara y específica.

### 🧪 Testeable
Cada capa puede ser testeada independientemente.

### 🔄 Reutilizable
Los hooks y servicios pueden ser reutilizados en diferentes contextos.

### 📈 Escalable
Fácil de agregar nuevas funcionalidades sin afectar el código existente.

### 🛠️ Mantenible
El código está organizado de forma lógica y predecible.

### 👥 Colaborativo
Múltiples desarrolladores pueden trabajar en diferentes capas sin conflictos.

---

## Ejemplos Prácticos

### Hook de Presentación (UI)
```typescript
// presentation/hooks/use-mobile.tsx
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
```

### Hook de Aplicación (Negocio)
```typescript
// application/hooks/use-generic-form.ts
export function useGenericForm<T, F>(
  entity: T | null,
  service: BaseService<T, F>,
  initialData: F
) {
  const { data, setData, post, put, processing, errors } = useForm<F>(
    entity ? { ...initialData, ...entity } : initialData
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (entity) {
      router.put(service.updateUrl(entity.id), cleanData);
    } else {
      post(service.storeUrl());
    }
  };

  return { data, handleSubmit, processing, errors };
}
```

### Hook de Infraestructura (Datos)
```typescript
// infrastructure/hooks/use-google-maps.ts
export function useGoogleMaps() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = async (address: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${API_KEY}`
      );
      const data = await response.json();
      return data.results[0]?.geometry?.location || null;
    } catch (err) {
      setError('Error al geocodificar');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geocodeAddress, isLoading, error };
}
```

---

## Migración Completada

### ✅ Archivos Movidos

**Presentación** (5 hooks):
- `use-appearance.tsx`
- `use-initials.tsx`
- `use-mobile.tsx`
- `use-mobile-navigation.ts`
- `use-search-select.ts`

**Aplicación** (5 hooks):
- `use-generic-form.ts`
- `use-categoria-form.ts`
- `use-categorias.ts`
- `use-generic-entities.ts`
- `use-auth.ts`

**Infraestructura** (3 hooks):
- `use-api-search.ts`
- `use-google-maps.ts`
- `use-export.ts`

### ✅ Imports Actualizados

- **35 archivos** actualizados automáticamente
- Todos los imports ahora apuntan a las ubicaciones correctas
- Build de producción exitoso sin errores

---

## Próximos Pasos

1. **Testing**: Crear tests unitarios para cada capa
2. **Documentación de Hooks**: Documentar cada hook individualmente
3. **Ejemplos de Uso**: Crear ejemplos para nuevos desarrolladores
4. **Guías de Estilo**: Establecer convenciones de código por capa

---

## Referencias

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Inertia.js Documentation](https://inertiajs.com/)

---

**Última actualización**: Octubre 2025
**Versión**: 1.0
**Mantenedores**: Equipo de Desarrollo Distribuidora Paucara
