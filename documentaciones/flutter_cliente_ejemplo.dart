// Ejemplo de cómo enviar datos de cliente desde Flutter
// Asegúrate de que los valores booleanos sean booleanos reales (true/false)
// NO uses strings "true"/"false" ni números 1/0

import 'dart:convert';
import 'package:http/http.dart' as http;

class ClienteService {
  static const String baseUrl = 'https://tu-api.com/api';

  // ✅ EJEMPLO CORRECTO - Booleanos como valores reales
  static Future<Map<String, dynamic>> crearClienteCorrecto() async {
    final response = await http.post(
      Uri.parse('$baseUrl/clientes'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TU_TOKEN_AQUI',
      },
      body: jsonEncode({
        "nombre": "María González",
        "razon_social": "Empresa S.R.L.",
        "nit": "7654321",
        "email": "maria@example.com",
        "telefono": "77888999",
        "whatsapp": "77888999",
        "fecha_nacimiento": "1990-05-15",
        "genero": "F",
        "limite_credito": 2000.00,
        "activo": true, // ✅ BOOLEANO REAL
        "observaciones": "Cliente VIP",
        "direcciones": [
          {
            "direccion": "Av. 6 de Agosto #123",
            "ciudad": "La Paz",
            "departamento": "La Paz",
            "codigo_postal": "0000",
            "es_principal": true, // ✅ BOOLEANO REAL
          },
        ],
      }),
    );

    return jsonDecode(response.body);
  }

  // ❌ EJEMPLO INCORRECTO - Evita estos formatos
  static Future<Map<String, dynamic>> crearClienteIncorrecto() async {
    final response = await http.post(
      Uri.parse('$baseUrl/clientes'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TU_TOKEN_AQUI',
      },
      body: jsonEncode({
        "nombre": "María González",
        "activo": "true", // ❌ STRING en lugar de boolean
        "direcciones": [
          {
            "direccion": "Av. 6 de Agosto #123",
            "es_principal": 1, // ❌ NÚMERO en lugar de boolean
          },
        ],
      }),
    );

    return jsonDecode(response.body);
  }

  // ✅ FORMA RECOMENDADA - Usando variables booleanas
  static Future<Map<String, dynamic>> crearClienteRecomendado({
    required String nombre,
    required bool activo,
    List<Map<String, dynamic>>? direcciones,
  }) async {
    // Asegurarse de que los booleanos sean realmente booleanos
    final Map<String, dynamic> clienteData = {
      "nombre": nombre,
      "activo": activo, // Ya es boolean
    };

    if (direcciones != null) {
      clienteData["direcciones"] = direcciones.map((dir) {
        return {
          ...dir,
          "es_principal": dir["es_principal"] as bool, // Asegurar tipo
        };
      }).toList();
    }

    final response = await http.post(
      Uri.parse('$baseUrl/clientes'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TU_TOKEN_AQUI',
      },
      body: jsonEncode(clienteData),
    );

    return jsonDecode(response.body);
  }
}

// Ejemplo de uso:
void ejemploUso() async {
  // ✅ Correcto
  final cliente1 = await ClienteService.crearClienteRecomendado(
    nombre: "Juan Pérez",
    activo: true, // Boolean real
    direcciones: [
      {
        "direccion": "Calle Principal 123",
        "es_principal": false, // Boolean real
      },
    ],
  );

  // ❌ Incorrecto - Evita esto
  // final cliente2 = await ClienteService.crearClienteIncorrecto();
}
