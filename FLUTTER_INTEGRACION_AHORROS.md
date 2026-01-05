# Integración de Ahorros en Carrito - Flutter

## Descripción

La aplicación Flutter debe mostrar al cliente cuánto dinero ahorrará si aumenta la cantidad de cada producto al siguiente rango de precio.

## Flujo de Funcionamiento

### 1. Cliente agrega producto al carrito

```
Cliente selecciona: PEPSI 250ML x 15
        ↓
Flutter envía: POST /api/carrito/calcular
{
  "items": [
    { "producto_id": 1, "cantidad": 15 }
  ]
}
```

### 2. Backend devuelve detalles de rangos

```json
{
  "success": true,
  "data": {
    "detalles": [
      {
        "producto_id": 1,
        "producto_nombre": "PEPSI 250ML",
        "cantidad": 15,
        "precio_unitario": 8.50,
        "subtotal": 127.50,
        "rango_aplicado": {
          "id": 2,
          "cantidad_minima": 10,
          "cantidad_maxima": 49,
          "tipo_precio_id": 2,
          "tipo_precio_nombre": "Descuento"
        },
        "proximo_rango": {
          "cantidad_minima": 50,
          "cantidad_maxima": null,
          "tipo_precio_nombre": "Especial",
          "falta_cantidad": 35
        },
        "ahorro_proximo": 75.00
      }
    ],
    "total": 127.50,
    "cantidad_items": 1
  }
}
```

### 3. Flutter muestra la información al cliente

```
┌─────────────────────────────────────┐
│ PEPSI 250ML                         │
│ Cantidad: 15 unidades              │
│ Precio Unitario: Bs. 8.50          │
│ Subtotal: Bs. 127.50               │
│                                     │
│ 🎯 ¡OPORTUNIDAD DE AHORRO!          │
│ Agrega 35 más para llegar a 50 y   │
│ obtén el precio especial:           │
│                                     │
│ 💰 Ahorrarías: Bs. 75.00           │
│    Total sería: Bs. 350.00         │
│                                     │
│ [+ Agregar 35] [Aumentar Cantidad] │
└─────────────────────────────────────┘
```

## Implementación en Dart/Flutter

### 1. Modelo para Rango de Precio

```dart
// lib/models/precio_rango.dart

class RangoAplicado {
  final int id;
  final int cantidadMinima;
  final int? cantidadMaxima;
  final int tipoPrecioId;
  final String tipoPrecioNombre;

  RangoAplicado({
    required this.id,
    required this.cantidadMinima,
    this.cantidadMaxima,
    required this.tipoPrecioId,
    required this.tipoPrecioNombre,
  });

  factory RangoAplicado.fromJson(Map<String, dynamic> json) {
    return RangoAplicado(
      id: json['id'],
      cantidadMinima: json['cantidad_minima'],
      cantidadMaxima: json['cantidad_maxima'],
      tipoPrecioId: json['tipo_precio_id'],
      tipoPrecioNombre: json['tipo_precio_nombre'],
    );
  }
}

class ProximoRango {
  final int cantidadMinima;
  final int? cantidadMaxima;
  final String tipoPrecioNombre;
  final int faltaCantidad;

  ProximoRango({
    required this.cantidadMinima,
    this.cantidadMaxima,
    required this.tipoPrecioNombre,
    required this.faltaCantidad,
  });

  factory ProximoRango.fromJson(Map<String, dynamic> json) {
    return ProximoRango(
      cantidadMinima: json['cantidad_minima'],
      cantidadMaxima: json['cantidad_maxima'],
      tipoPrecioNombre: json['tipo_precio_nombre'],
      faltaCantidad: json['falta_cantidad'],
    );
  }

  String get rangoTexto {
    final hasta = cantidadMaxima != null ? '$cantidadMaxima' : '∞';
    return '$cantidadMinima-$hasta';
  }
}

class DetalleCarritoConRango {
  final int productoId;
  final String productoNombre;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;
  final RangoAplicado? rangoAplicado;
  final ProximoRango? proximoRango;
  final double? ahorroProximo;

  DetalleCarritoConRango({
    required this.productoId,
    required this.productoNombre,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
    this.rangoAplicado,
    this.proximoRango,
    this.ahorroProximo,
  });

  factory DetalleCarritoConRango.fromJson(Map<String, dynamic> json) {
    return DetalleCarritoConRango(
      productoId: json['producto_id'],
      productoNombre: json['producto_nombre'],
      cantidad: json['cantidad'],
      precioUnitario: double.parse(json['precio_unitario'].toString()),
      subtotal: double.parse(json['subtotal'].toString()),
      rangoAplicado: json['rango_aplicado'] != null
          ? RangoAplicado.fromJson(json['rango_aplicado'])
          : null,
      proximoRango: json['proximo_rango'] != null
          ? ProximoRango.fromJson(json['proximo_rango'])
          : null,
      ahorroProximo: json['ahorro_proximo'] != null
          ? double.parse(json['ahorro_proximo'].toString())
          : null,
    );
  }
}

class CarritoConRangos {
  final List<DetalleCarritoConRango> detalles;
  final double total;
  final int cantidadItems;

  CarritoConRangos({
    required this.detalles,
    required this.total,
    required this.cantidadItems,
  });

  factory CarritoConRangos.fromJson(Map<String, dynamic> json) {
    return CarritoConRangos(
      detalles: List<DetalleCarritoConRango>.from(
        (json['detalles'] as List).map(
          (item) => DetalleCarritoConRango.fromJson(item),
        ),
      ),
      total: double.parse(json['total'].toString()),
      cantidadItems: json['cantidad_items'],
    );
  }
}
```

### 2. Servicio para Calcular Carrito

```dart
// lib/services/carrito_service.dart

import 'package:http/http.dart' as http;
import 'dart:convert';

class CarritoService {
  final String baseUrl = 'https://api.tudominio.com';
  final String token; // Bearer token

  CarritoService({required this.token});

  Future<CarritoConRangos> calcularCarrito({
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/carrito/calcular'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'items': items, // [{ "producto_id": 1, "cantidad": 15 }, ...]
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return CarritoConRangos.fromJson(data['data']);
      } else {
        throw Exception('Error al calcular carrito: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  /// Calcular precio para una cantidad específica de un producto
  Future<Map<String, dynamic>> calcularPrecio({
    required int productoId,
    required int cantidad,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/productos/$productoId/calcular-precio'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'cantidad': cantidad}),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }
}
```

### 3. Widget de Item del Carrito con Ahorro

```dart
// lib/widgets/carrito_item_ahorro.dart

import 'package:flutter/material.dart';

class CarritoItemAhorro extends StatefulWidget {
  final DetalleCarritoConRango detalle;
  final Function(int nuevosCantidad) onCantidadCambiada;

  const CarritoItemAhorro({
    required this.detalle,
    required this.onCantidadCambiada,
  });

  @override
  State<CarritoItemAhorro> createState() => _CarritoItemAhorroState();
}

class _CarritoItemAhorroState extends State<CarritoItemAhorro> {
  late int cantidadActual;

  @override
  void initState() {
    super.initState();
    cantidadActual = widget.detalle.cantidad;
  }

  void _incrementarAlProximoRango() {
    if (widget.detalle.proximoRango != null) {
      _cambiarCantidad(widget.detalle.proximoRango!.cantidadMinima);
    }
  }

  void _cambiarCantidad(int nuevaCantidad) {
    setState(() {
      cantidadActual = nuevaCantidad;
    });
    widget.onCantidadCambiada(nuevaCantidad);
  }

  @override
  Widget build(BuildContext context) {
    final detalle = widget.detalle;
    final tieneAhorro = detalle.ahorroProximo != null && detalle.ahorroProximo! > 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // HEADER: Nombre del producto y cantidad
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        detalle.productoNombre,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Cantidad: ${detalle.cantidad} unidades',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Bs. ${detalle.subtotal.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    Text(
                      '@ Bs. ${detalle.precioUnitario.toStringAsFixed(2)}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // RANGO APLICADO
            if (detalle.rangoAplicado != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue[100],
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Rango: ${detalle.rangoAplicado!.cantidadMinima}-${detalle.rangoAplicado!.cantidadMaxima ?? '∞'} (${detalle.rangoAplicado!.tipoPrecioNombre})',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.blue[900],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

            const SizedBox(height: 12),

            // SECCIÓN DE AHORRO (si disponible)
            if (tieneAhorro && detalle.proximoRango != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber[50],
                  border: Border.all(color: Colors.amber[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.trending_down, color: Colors.amber, size: 20),
                        const SizedBox(width: 8),
                        const Text(
                          '¡Oportunidad de Ahorro!',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.amber,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Agrega ${detalle.proximoRango!.faltaCantidad} más para llegar a ${detalle.proximoRango!.cantidadMinima} unidades',
                      style: const TextStyle(fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '💰 Ahorrarías: Bs. ${detalle.ahorroProximo!.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Colors.green,
                      ),
                    ),
                    Text(
                      'Precio nuevo: ${detalle.proximoRango!.tipoPrecioNombre}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _incrementarAlProximoRango,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.amber,
                        ),
                        child: Text(
                          'Agregar ${detalle.proximoRango!.faltaCantidad} más',
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ) else if (detalle.proximoRango != null)
                // No hay ahorro (precio más caro)
                Text(
                  'Próximo rango: ${detalle.proximoRango!.cantidadMinima}+ unidades (${detalle.proximoRango!.tipoPrecioNombre})',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),

            const SizedBox(height: 12),

            // CONTROLES DE CANTIDAD
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove),
                      onPressed: cantidadActual > 1
                          ? () => _cambiarCantidad(cantidadActual - 1)
                          : null,
                    ),
                    Text('$cantidadActual', style: const TextStyle(fontSize: 16)),
                    IconButton(
                      icon: const Icon(Icons.add),
                      onPressed: () => _cambiarCantidad(cantidadActual + 1),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _cambiarCantidad(0), // Para eliminar del carrito
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

### 4. Integración en Pantalla del Carrito

```dart
// lib/screens/carrito_screen.dart

class CarritoScreen extends StatefulWidget {
  @override
  State<CarritoScreen> createState() => _CarritoScreenState();
}

class _CarritoScreenState extends State<CarritoScreen> {
  late CarritoService _carritoService;
  CarritoConRangos? _carrito;
  bool _cargando = true;
  String? _error;

  final List<Map<String, dynamic>> _items = [
    // Items del carrito del usuario
  ];

  @override
  void initState() {
    super.initState();
    _carritoService = CarritoService(token: _obtenerToken());
    _calcularCarrito();
  }

  Future<void> _calcularCarrito() async {
    if (_items.isEmpty) {
      setState(() {
        _carrito = null;
        _cargando = false;
      });
      return;
    }

    setState(() => _cargando = true);
    try {
      final carrito = await _carritoService.calcularCarrito(items: _items);
      setState(() {
        _carrito = carrito;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() => _cargando = false);
    }
  }

  void _onCantidadCambiada(int productoId, int nuevaCantidad) {
    setState(() {
      if (nuevaCantidad <= 0) {
        _items.removeWhere((item) => item['producto_id'] == productoId);
      } else {
        final indice = _items.indexWhere((item) => item['producto_id'] == productoId);
        if (indice >= 0) {
          _items[indice]['cantidad'] = nuevaCantidad;
        }
      }
    });
    _calcularCarrito();
  }

  @override
  Widget build(BuildContext context) {
    if (_cargando) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $_error'),
              ElevatedButton(
                onPressed: _calcularCarrito,
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }

    if (_carrito == null || _carrito!.detalles.isEmpty) {
      return const Scaffold(
        body: Center(
          child: Text('Tu carrito está vacío'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Mi Carrito')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _carrito!.detalles.length,
              itemBuilder: (context, index) {
                final detalle = _carrito!.detalles[index];
                return CarritoItemAhorro(
                  detalle: detalle,
                  onCantidadCambiada: (nuevaCantidad) {
                    _onCantidadCambiada(detalle.productoId, nuevaCantidad);
                  },
                );
              },
            ),
          ),
          // RESUMEN DEL CARRITO
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'TOTAL:',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Bs. ${_carrito!.total.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: () {
                    // Proceder al checkout
                    _irAlCheckout();
                  },
                  child: const Text(
                    'Proceder al Pago',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _irAlCheckout() {
    // Enviar datos del carrito al backend
    // Navigator.pushNamed(context, '/checkout', arguments: _carrito);
  }

  String _obtenerToken() {
    // Obtener token del almacenamiento seguro
    return 'tu_token_aqui';
  }
}
```

## Endpoints Utilizados

### 1. Calcular Carrito Completo

```
POST /api/carrito/calcular
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    { "producto_id": 1, "cantidad": 15 },
    { "producto_id": 2, "cantidad": 50 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detalles": [...],
    "total": 500.00,
    "cantidad_items": 2
  }
}
```

### 2. Calcular Precio para Cantidad Específica

```
POST /api/productos/{producto_id}/calcular-precio
Authorization: Bearer {token}
Content-Type: application/json

{
  "cantidad": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "precio_unitario": 8.50,
    "subtotal": 170.00,
    "rango_aplicado": {...},
    "proximo_rango": {...},
    "ahorro_proximo": 75.00
  }
}
```

## Recomendaciones

1. **Cachear resultados**: Guardar temporalmente el carrito calculado para evitar recalcular constantemente

2. **Validación de cantidades**: En el lado del cliente, validar que las cantidades sean positivas

3. **Manejo de errores**: Mostrar mensajes amigables cuando falle la conexión

4. **Performance**: Usar `debounce` al cambiar cantidades para no enviar múltiples requests simultáneamente

5. **Offline**: Permitir que el usuario siga navegando aunque no pueda calcular rangos

## Testing

```dart
// test/services/carrito_service_test.dart

void main() {
  group('CarritoService', () {
    late CarritoService service;

    setUp(() {
      service = CarritoService(token: 'test_token');
    });

    test('calcularCarrito devuelve datos correctos', () async {
      final resultado = await service.calcularCarrito(
        items: [
          {'producto_id': 1, 'cantidad': 15}
        ],
      );

      expect(resultado.total, 127.50);
      expect(resultado.detalles[0].ahorroProximo, 75.00);
    });

    test('calcularPrecio devuelve precio correcto', () async {
      final resultado = await service.calcularPrecio(
        productoId: 1,
        cantidad: 50,
      );

      expect(resultado['precio_unitario'], 7.00);
    });
  });
}
```

## Conclusión

Con esta integración, los usuarios de la app Flutter verán:
- Precios dinámicos según cantidad
- Oportunidades de ahorro claras
- Motivación para aumentar compras
- Mejor experiencia de compra

El backend maneja toda la lógica de cálculo, garantizando seguridad y consistencia.
