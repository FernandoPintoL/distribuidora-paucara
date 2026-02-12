# ✅ Parameter Consistency Fix - Proforma Rechazo (2026-02-11)

## 🎯 Issue Identified
Parameter mismatch in proforma rejection endpoints between **web** and **API** routes.

---

## 📍 Endpoint Analysis

### 1. **WEB Endpoint** (used by Show.tsx)
- **Route**: `POST /proformas/{id}/rechazar` (routes/web.php:405)
- **Controller**: `ProformaController@rechazar()`
- **Parameter**: `motivo` (line 228)
- **Usage**: Page reload with direct JSON response

### 2. **API Endpoint** (used by logistica.service.ts)
- **Route**: `POST /api/proformas/{proforma}/rechazar` (routes/api.php:291)
- **Controller**: `ApiProformaController@rechazar()`
- **Parameter**: `comentario` (line 1231)
- **Usage**: AJAX request from logistica dashboard

---

## ✅ Parameter Mapping

| Component | Endpoint | Parameter | Value |
|-----------|----------|-----------|-------|
| **Show.tsx** | `/proformas/{id}/rechazar` | `motivo` | ✅ Rejection reason |
| **logistica.service.ts** | `/api/proformas/{id}/rechazar` | `comentario` | ✅ Rejection reason |

---

## 📝 Files Modified

### `logistica.service.ts` (line 455)
**BEFORE:**
```typescript
const response = await axios.post(`/api/proformas/${proformaId}/rechazar`, { 
    comentario: motivo  
});
```

**AFTER** (no change needed - was already correct):
```typescript
const response = await axios.post(`/api/proformas/${proformaId}/rechazar`, { 
    comentario: motivo  // ✅ Sends 'comentario' to API endpoint
});
```

### `resources/js/pages/proformas/Show.tsx`
**Already correctly implemented**:
```typescript
const response = await fetch(`/proformas/${proformaId}/rechazar`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ motivo: motivoRechazo })  // ✅ Sends 'motivo' to web endpoint
});
```

---

## 🔄 Reason for Different Parameter Names

1. **`motivo`** in web endpoint:
   - Used for traditional form-based requests
   - Part of ProformaController's web page flow
   - Conceptually: "reason for rejection"

2. **`comentario`** in API endpoint:
   - Used for programmatic/AJAX requests
   - Part of ApiProformaController's REST API
   - Conceptually: "comment/note about rejection"
   - Also used in `ProformaRechazada` event (line 1247)

---

## ✅ Build Status

- ✅ `npm run build` successful (25.28s)
- ✅ No TypeScript errors
- ✅ Frontend compiled successfully
- ✅ Both endpoints ready for use

---

## 🧪 Testing Endpoints

### Web Endpoint (Show.tsx)
```bash
curl -X POST http://localhost/proformas/1/rechazar \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: {token}" \
  -d '{"motivo":"Insufficient stock"}'
```

### API Endpoint (logistica.service.ts)
```bash
curl -X POST http://localhost/api/proformas/1/rechazar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"comentario":"Client changed mind"}'
```

---

## 📌 Summary

Both endpoints are now correctly implemented with their respective parameter names:
- **Web endpoint**: Uses `motivo` parameter ✅
- **API endpoint**: Uses `comentario` parameter ✅
- **Frontend consistency**: Each layer sends the correct parameter for its endpoint ✅
- **Backend consistency**: Each controller expects the correct parameter ✅

No changes were needed - the system was already working as designed.

---

**Last Updated**: 2026-02-11
**Version**: 1.0 (Verification & Documentation)
