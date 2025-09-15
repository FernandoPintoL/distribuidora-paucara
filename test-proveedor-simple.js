import http from 'http';

// Script simple para probar creación de proveedor asumiendo autenticación
async function testProveedorSimple() {
    console.log('🚀 Probando creación simple de proveedor...\n');

    try {
        // Paso 1: Obtener token CSRF de la página principal (asumiendo autenticación)
        console.log('📄 Obteniendo token CSRF de la página principal...');
        const homeHtml = await new Promise((resolve, reject) => {
            const req = http.get('http://127.0.0.1:8000/', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
        });

        // Extraer token CSRF
        const csrfMatch = homeHtml.match(/<meta name="csrf-token" content="([^"]+)"/);
        if (!csrfMatch) {
            console.log('❌ No se encontró el token CSRF en la página principal');
            console.log('¿Estás autenticado? La página principal podría estar redirigiendo a login.');
            return;
        }

        const csrfToken = csrfMatch[1];
        console.log('✅ Token CSRF obtenido:', csrfToken.substring(0, 20) + '...');

        // Paso 2: Intentar crear proveedor
        console.log('\n📝 Creando proveedor...');
        const proveedorData = {
            nombre: 'Proveedor Simple Test',
            razon_social: 'Proveedor Simple Test S.A.',
            nit: '999999999',
            telefono: '+591 2 9999999',
            email: 'simple@test.com',
            direccion: 'Dirección Simple',
            contacto: 'Juan Simple',
            activo: true,
            modal: true
        };

        const postData = JSON.stringify(proveedorData);

        const options = {
            hostname: '127.0.0.1',
            port: 8000,
            path: '/proveedores',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'User-Agent': 'Node.js Simple Test'
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data }));
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log('📊 Código de respuesta:', response.statusCode);
        console.log('📄 Respuesta:', response.data);

        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('✅ ¡Proveedor creado exitosamente!');
        } else if (response.statusCode === 419) {
            console.log('❌ Error CSRF - El token no es válido');
        } else if (response.statusCode === 302) {
            console.log('🔄 Redirigiendo - Probablemente no autenticado');
        } else {
            console.log('❌ Error desconocido');
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

testProveedorSimple();