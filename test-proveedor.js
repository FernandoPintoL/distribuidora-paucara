import http from 'http';

// Función para probar la creación de un proveedor con autenticación
async function testProveedorCreation() {
    console.log('🚀 Iniciando prueba de creación de proveedor con autenticación...\n');

    try {
        // Paso 1: Obtener la página de login para extraer el token CSRF
        console.log('📄 Paso 1: Obteniendo página de login...');
        const loginHtml = await new Promise((resolve, reject) => {
            const req = http.get('http://127.0.0.1:8000/login', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
        });

        // Extraer token CSRF de la página de login
        const csrfMatch = loginHtml.match(/<meta name="csrf-token" content="([^"]+)"/);
        if (!csrfMatch) {
            console.log('❌ No se encontró el token CSRF en la página de login');
            return;
        }
        const csrfToken = csrfMatch[1];
        console.log('✅ Token CSRF obtenido:', csrfToken.substring(0, 20) + '...');

        // Paso 2: Hacer login
        console.log('\n🔐 Paso 2: Realizando login...');
        const loginData = new URLSearchParams({
            email: 'admin@paucara.test',
            password: 'password',
            remember: 'on'
        }).toString();

        const loginResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: '127.0.0.1',
                port: 8000,
                path: '/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'http://127.0.0.1:8000/login',
                    'User-Agent': 'Node.js Test Script'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                let cookies = '';

                // Capturar cookies de la respuesta
                if (res.headers['set-cookie']) {
                    cookies = res.headers['set-cookie'].join('; ');
                }

                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data, cookies }));
            });
            req.on('error', reject);
            req.write(loginData);
            req.end();
        });

        console.log('📊 Respuesta login:', loginResponse.statusCode);

        if (loginResponse.statusCode !== 302 && loginResponse.statusCode !== 200) {
            console.log('❌ Login fallido');
            console.log('Respuesta:', loginResponse.data);
            return;
        }

        console.log('🍪 Cookies obtenidas:', loginResponse.cookies ? 'Sí' : 'No');

        // Paso 3: Acceder a la página de proveedores con las cookies de sesión
        console.log('\n📄 Paso 3: Accediendo a página de proveedores...');
        const proveedoresHtml = await new Promise((resolve, reject) => {
            const options = {
                hostname: '127.0.0.1',
                port: 8000,
                path: '/proveedores',
                method: 'GET',
                headers: {
                    'Cookie': loginResponse.cookies,
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Node.js Test Script'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            });
            req.on('error', reject);
            req.end();
        });

        // Extraer token CSRF actualizado de la página de proveedores
        const newCsrfMatch = proveedoresHtml.match(/<meta name="csrf-token" content="([^"]+)"/);
        const currentCsrfToken = newCsrfMatch ? newCsrfMatch[1] : csrfToken;

        console.log('✅ Token CSRF actualizado:', currentCsrfToken.substring(0, 20) + '...');

        // Paso 4: Crear proveedor
        console.log('\n📝 Paso 4: Creando proveedor...');
        const proveedorData = {
            nombre: 'Proveedor de Prueba',
            razon_social: 'Proveedor de Prueba S.A.',
            nit: '123456789',
            telefono: '+591 2 1234567',
            email: 'prueba@proveedor.com',
            direccion: 'Av. Principal 123',
            contacto: 'Juan Pérez',
            activo: true,
            modal: true
        };

        const postData = JSON.stringify(proveedorData);

        const createResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: '127.0.0.1',
                port: 8000,
                path: '/proveedores',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': currentCsrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'http://127.0.0.1:8000/proveedores',
                    'Cookie': loginResponse.cookies,
                    'Accept': 'application/json',
                    'User-Agent': 'Node.js Test Script'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data }));
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log('� Respuesta creación:', createResponse.statusCode);
        console.log('📄 Respuesta:', createResponse.data);

        if (createResponse.statusCode === 200 || createResponse.statusCode === 201) {
            console.log('✅ ¡Proveedor creado exitosamente!');
        } else {
            console.log('❌ Error al crear proveedor');
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

testProveedorCreation();