// Ejemplo completo de cómo enviar imágenes desde Flutter a la API
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';

class ClienteApiService {
  static const String baseUrl = 'https://tu-api.com/api';

  // ✅ EJEMPLO CORRECTO: Crear cliente con imágenes usando MultipartRequest
  static Future<Map<String, dynamic>> crearClienteConImagenes({
    required String nombre,
    required bool activo,
    File? fotoPerfil,
    File? ciAnverso,
    File? ciReverso,
    List<Map<String, dynamic>>? direcciones,
  }) async {
    try {
      // Crear MultipartRequest
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/clientes'),
      );

      // Agregar headers de autenticación si es necesario
      request.headers['Authorization'] = 'Bearer TU_TOKEN_AQUI';

      // Agregar campos de texto
      request.fields['nombre'] = nombre;
      request.fields['activo'] = activo
          .toString(); // Importante: convertir a string
      request.fields['telefono'] = '70000001';
      request.fields['email'] = 'cliente@example.com';

      // Agregar direcciones si existen
      if (direcciones != null) {
        for (int i = 0; i < direcciones.length; i++) {
          var dir = direcciones[i];
          request.fields['direcciones[$i][direccion]'] = dir['direccion'];
          request.fields['direcciones[$i][ciudad]'] = dir['ciudad'] ?? '';
          request.fields['direcciones[$i][departamento]'] =
              dir['departamento'] ?? '';
          request.fields['direcciones[$i][es_principal]'] =
              (dir['es_principal'] ?? false).toString();
        }
      }

      // Agregar archivos de imagen
      if (fotoPerfil != null) {
        var mimeType = lookupMimeType(fotoPerfil.path) ?? 'image/jpeg';
        var fileStream = http.ByteStream(fotoPerfil.openRead());
        var length = await fotoPerfil.length();

        var multipartFile = http.MultipartFile(
          'foto_perfil', // Nombre del campo (DEBE coincidir con el backend)
          fileStream,
          length,
          filename: 'foto_perfil.jpg',
          contentType: MediaType.parse(mimeType),
        );
        request.files.add(multipartFile);
      }

      if (ciAnverso != null) {
        var mimeType = lookupMimeType(ciAnverso.path) ?? 'image/jpeg';
        var fileStream = http.ByteStream(ciAnverso.openRead());
        var length = await ciAnverso.length();

        var multipartFile = http.MultipartFile(
          'ci_anverso', // Nombre del campo
          fileStream,
          length,
          filename: 'ci_anverso.jpg',
          contentType: MediaType.parse(mimeType),
        );
        request.files.add(multipartFile);
      }

      if (ciReverso != null) {
        var mimeType = lookupMimeType(ciReverso.path) ?? 'image/jpeg';
        var fileStream = http.ByteStream(ciReverso.openRead());
        var length = await ciReverso.length();

        var multipartFile = http.MultipartFile(
          'ci_reverso', // Nombre del campo
          fileStream,
          length,
          filename: 'ci_reverso.jpg',
          contentType: MediaType.parse(mimeType),
        );
        request.files.add(multipartFile);
      }

      // Enviar la petición
      var response = await request.send();
      var responseData = await response.stream.bytesToString();
      var jsonResponse = jsonDecode(responseData);

      if (response.statusCode == 201) {
        print('✅ Cliente creado exitosamente');
        print('📁 Imágenes guardadas en:');
        if (jsonResponse['data']['cliente']['foto_perfil'] != null) {
          print(
            '  - Foto perfil: ${jsonResponse['data']['cliente']['foto_perfil']}',
          );
        }
        if (jsonResponse['data']['cliente']['ci_anverso'] != null) {
          print(
            '  - CI Anverso: ${jsonResponse['data']['cliente']['ci_anverso']}',
          );
        }
        if (jsonResponse['data']['cliente']['ci_reverso'] != null) {
          print(
            '  - CI Reverso: ${jsonResponse['data']['cliente']['ci_reverso']}',
          );
        }
        return jsonResponse;
      } else {
        print('❌ Error al crear cliente: ${response.statusCode}');
        print('Respuesta: $jsonResponse');
        throw Exception(
          'Error: ${jsonResponse['message'] ?? 'Error desconocido'}',
        );
      }
    } catch (e) {
      print('❌ Error de conexión: $e');
      throw e;
    }
  }

  // ✅ EJEMPLO CORRECTO: Actualizar cliente con imágenes
  static Future<Map<String, dynamic>> actualizarClienteConImagenes({
    required int clienteId,
    required String nombre,
    required bool activo,
    File? fotoPerfil,
    File? ciAnverso,
    File? ciReverso,
  }) async {
    try {
      var request = http.MultipartRequest(
        'PUT', // o 'POST' si usas method spoofing
        Uri.parse('$baseUrl/clientes/$clienteId'),
      );

      request.headers['Authorization'] = 'Bearer TU_TOKEN_AQUI';

      // Agregar campos de texto
      request.fields['nombre'] = nombre;
      request.fields['activo'] = activo.toString();

      // Agregar archivos (solo si se proporcionan nuevos)
      if (fotoPerfil != null) {
        var mimeType = lookupMimeType(fotoPerfil.path) ?? 'image/jpeg';
        var fileStream = http.ByteStream(fotoPerfil.openRead());
        var length = await fotoPerfil.length();

        request.files.add(
          http.MultipartFile(
            'foto_perfil',
            fileStream,
            length,
            filename: 'foto_perfil.jpg',
            contentType: MediaType.parse(mimeType),
          ),
        );
      }

      if (ciAnverso != null) {
        var mimeType = lookupMimeType(ciAnverso.path) ?? 'image/jpeg';
        var fileStream = http.ByteStream(ciAnverso.openRead());
        var length = await ciAnverso.length();

        request.files.add(
          http.MultipartFile(
            'ci_anverso',
            fileStream,
            length,
            filename: 'ci_anverso.jpg',
            contentType: MediaType.parse(mimeType),
          ),
        );
      }

      if (ciReverso != null) {
        var mimeType = lookupMimeType(ciReverso.path) ?? 'image/jpeg';
        var fileStream = http.ByteStream(ciReverso.openRead());
        var length = await ciReverso.length();

        request.files.add(
          http.MultipartFile(
            'ci_reverso',
            fileStream,
            length,
            filename: 'ci_reverso.jpg',
            contentType: MediaType.parse(mimeType),
          ),
        );
      }

      var response = await request.send();
      var responseData = await response.stream.bytesToString();
      return jsonDecode(responseData);
    } catch (e) {
      print('❌ Error al actualizar cliente: $e');
      throw e;
    }
  }
}

// 📝 NOTAS IMPORTANTES:
//
// 1. **Content-Type**: NO establecer manualmente Content-Type cuando uses MultipartRequest
//    Dart/http lo establece automáticamente como 'multipart/form-data'
//
// 2. **Nombres de campos**: Deben coincidir exactamente con los esperados por el backend:
//    - 'foto_perfil'
//    - 'ci_anverso'
//    - 'ci_reverso'
//
// 3. **Valores booleanos**: Convertir a string con .toString()
//    - true.toString() = "true"
//    - false.toString() = "false"
//
// 4. **MIME Types**: Usar lookupMimeType() para detectar automáticamente el tipo de archivo
//
// 5. **Tamaño máximo**: El backend valida máximo 5MB por archivo (5120 KB)
//
// 6. **Campos opcionales**: Solo enviar archivos si realmente se van a actualizar
//
// 7. **Verificación**: Después de enviar, verificar en la respuesta que las rutas de imagen
//    se hayan guardado correctamente en los campos del cliente
