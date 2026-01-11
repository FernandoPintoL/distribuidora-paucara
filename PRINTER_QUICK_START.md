# Inicio Rápido: Impresora Térmica

## ⚡ 3 Pasos para Imprimir Automáticamente

### 1️⃣ Obtén la IP de tu Impresora
- En el panel de la impresora térmica → Configuración → Red
- Anota la **IP** (ej: `192.168.1.100`)

### 2️⃣ Edita `.env`
```env
PRINTER_HOST=192.168.1.100    # Tu IP aquí
PRINTER_PORT=9100             # Puerto estándar
PRINTER_PAPER_WIDTH=58         # 58 o 80 mm
PRINTER_ENABLED=true           # Activar impresión
```

### 3️⃣ Prueba la Conexión
```bash
php artisan printer:test
```

Si ves ✅ **Conexión exitosa** → ¡Listo!

## 🎯 Listo para Usar

Cuando crees una venta:
1. Ventas → Nueva Venta
2. Rellena datos y haz clic en Guardar
3. **El ticket se imprime automáticamente** en tu térmica 🖨️

## 🔴 Si Algo Falla

```bash
# Ver detalles de error
php artisan printer:test --verbose

# Ver logs
tail -f storage/logs/laravel.log
```

**Checklist:**
- [ ] IP correcta de la impresora
- [ ] Impresora encendida y en red
- [ ] `ping 192.168.1.100` responde
- [ ] Puerto 9100 habilitado en impresora
- [ ] `PRINTER_ENABLED=true` en `.env`

## 📖 Documentación Completa
Ver: `PRINTER_SETUP.md`

---

¿Problemas? Ejecuta el comando de prueba y revisa los logs.
