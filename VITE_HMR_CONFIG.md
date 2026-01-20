# Configuración de Vite HMR (Hot Module Replacement)

## Problema
La página no se actualiza automáticamente cuando guardas cambios. Necesitas actualizar manualmente en el navegador.

## Solución

### Opción 1: Desarrollo Local (Localhost)
Si estás desarrollando en la misma máquina donde corre Vite:

```bash
npm run dev
# Accede a: http://localhost:5173
# O: http://127.0.0.1:5173
```

**Este debería funcionar automáticamente sin configuración adicional.**

---

### Opción 2: Desarrollo desde IP Específica
Si accedes a la web usando una IP (ej: `192.168.1.100:8000`):

```bash
# Linux/Mac
VITE_HMR_HOST=192.168.1.100 npm run dev

# Windows (PowerShell)
$env:VITE_HMR_HOST = "192.168.1.100"; npm run dev

# Windows (CMD)
set VITE_HMR_HOST=192.168.1.100 && npm run dev
```

---

### Opción 3: Configuración en .env.local
Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_HMR_HOST=192.168.1.100
VITE_HMR_PROTOCOL=ws
VITE_HMR_PORT=5173
```

Luego solo ejecuta:
```bash
npm run dev
```

---

### Opción 4: Hostname en lugar de IP
Si usas un hostname (ej: `distribuidora.local`):

```bash
# Linux/Mac
VITE_HMR_HOST=distribuidora.local npm run dev

# O en .env.local
VITE_HMR_HOST=distribuidora.local
```

---

## Diagnóstico

### Verificar que Vite está escuchando:
```bash
# En la terminal, deberías ver algo como:
VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173
  ➜  ws://localhost:5173
```

### Verificar en el navegador:
1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Filtra por "ws" (WebSocket)
4. Deberías ver una conexión a `ws://HOST:5173/__vite_ping`
5. Si no la ves, el HMR no está conectando

### Si dice "ws://localhost:5173" pero accedes desde otro IP:
- El navegador intenta conectarse a `localhost` desde tu máquina
- No puede encontrar ese host
- **SOLUCIÓN**: Usa la opción 2 o 3 arriba

---

## Checklist

- [ ] Vite está corriendo con `npm run dev`
- [ ] Accedes a la URL correcta (http://IP:8000 o http://localhost:8000)
- [ ] La consola del navegador (F12) NO muestra errores de WebSocket
- [ ] El archivo WebSocket en Network muestra estado "101 Switching Protocols"
- [ ] Cambias un archivo y ves el cambio sin actualizar (F5)

---

## Problemas Comunes

### "ws://localhost:5173 can't be reached"
**Causa**: Accedes desde otro IP pero HMR intenta conectar a localhost
**Solución**: Usa `VITE_HMR_HOST` con el IP correcto

### Vite rebuildea pero no actualiza la página
**Causa**: WebSocket conectó pero hay otros errores en el código
**Solución**: Revisa la consola del navegador para errores

### "ERR_NAME_NOT_RESOLVED"
**Causa**: El hostname que especificaste no existe o no es accesible
**Solución**: Usa `127.0.0.1` o un IP que puedas alcanzar

---

## Referencia Rápida

| Escenario | Comando |
|-----------|---------|
| Localhost | `npm run dev` |
| IP Específica | `VITE_HMR_HOST=192.168.1.100 npm run dev` |
| Hostname | `VITE_HMR_HOST=distribuidora.local npm run dev` |
| Puerto Diferente | `VITE_HMR_PORT=3000 npm run dev` |

---

## Más Información

- [Documentación oficial Vite HMR](https://vitejs.dev/config/server-options.html#server-hmr)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
