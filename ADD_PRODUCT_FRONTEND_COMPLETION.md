### Add Product Frontend Completion

This document provides a concise technical rundown of the new Add Product feature implemented in the Warehouse Manager view. It enumerates routes, UI entry points, data contract expectations, and success/error handling so the backend team can verify and align API behavior.

---

## Overview
- Purpose: Allow warehouse management roles to create new products to be sold.
- Frontend adds a dedicated page with validation, dynamic custom fields, and clean API integration.
- Production build validated (React CRA): Compiles successfully.

---

## UX Entry Points
- Enhanced Warehouse Dashboard → Inventory tab header action → “Add Product” button
  - File: `src/pages/EnhancedWarehouseDashboard.js`
- Test Warehouse Dashboard → Inventory tab header action → “Add Product” button
  - File: `src/pages/TestWarehouseDashboard.js`
- Direct URL: `/warehouse/products/new`

---

## Route and Access Control
- Route added in `src/App.js`:
  - Path: `/warehouse/products/new`
  - Access: `['warehouse', 'warehouse_manager', 'owner', 'admin']`
  - Component: `AddProduct` (`src/pages/AddProduct.js`)
- Protected by app’s `ProtectedRoute`. Backend should still enforce role-based permissions server-side.

---

## Component Summary: `src/pages/AddProduct.js`
- Fields:
  - name: string, required, min length 2
  - price: number (Rands), required, >= 0
  - currency: string, defaults to `ZAR`
  - color: string, required (selected label)
  - fabric: string, optional (selected label)
  - sku: string, optional
  - description: string, optional
  - attributes: object map of dynamic key/value pairs (e.g., `{ "Wood Type": "Oak" }`)
- Validation (client-side): name, price, color required; numeric checks on price; non-empty attribute keys.
- Dynamic fields: Add arbitrary attribute key/value pairs from UI; can remove or edit before submit.
- Submit flow:
  - Sends POST to `/products/` with JSON body (see Data Contract below)
  - JWT added via `Authorization: Bearer <token>` if present in `localStorage` (key: `oox_token`)
  - On 2xx, shows success alert, resets form, navigates to `/warehouse`
  - On 4xx/5xx, shows error extracted from backend JSON or statusText

---

## API Integration
- Base: `REACT_APP_API_BASE` (defaults to `https://internaloox-1.onrender.com/api`)
- Endpoint helper added in `src/components/api.js`:
  - `createProduct(data)` → `POST /products/`
  - Also uses `getColors()` → `GET /colors/` and `getFabrics()` → `GET /fabrics/` for dropdowns
- Error handling expectations:
  - 400 validation errors may be returned as an object of `{ field: [errors] }` or `{ error: string }`
  - The shared API helper aggregates field errors into a readable message

---

## Data Contract

### Request: POST `/products/`
Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT>` (required for authenticated users)

Body (JSON)
```json
{
  "name": "L-Shaped Couch",
  "sku": "OOX-LC-001",
  "description": "Modern L-shaped couch with storage",
  "price": 12999.99,
  "currency": "ZAR",
  "color": "Charcoal Gray",
  "fabric": "Suede",
  "attributes": {
    "Wood Type": "Oak",
    "Leg Color": "Black"
  }
}
```
Notes
- `fabric` is optional and may be omitted or `null`.
- `attributes` is an open-ended key/value object for dynamic fields.
- Frontend currently submits `color` and `fabric` as labels/strings. If backend requires IDs, consider supporting both forms or returning a mapping from `/colors/` and `/fabrics/` for us to send IDs.

### Successful Response: 201 Created
Example
```json
{
  "id": 123,
  "name": "L-Shaped Couch",
  "sku": "OOX-LC-001",
  "description": "Modern L-shaped couch with storage",
  "price": 12999.99,
  "currency": "ZAR",
  "color": "Charcoal Gray",
  "fabric": "Suede",
  "attributes": {
    "Wood Type": "Oak",
    "Leg Color": "Black"
  },
  "created_at": "2025-08-10T12:34:56Z"
}
```
Frontend uses `response.name` for success message.

### Validation Error: 400
Possible formats we handle
```json
{ "error": "Color is required" }
```
```json
{ "name": ["This field is required."], "price": ["A valid number is required."] }
```
Both variants are surfaced to the user in a single, readable alert.

---

## Reference Data: Colors & Fabrics
- `GET /colors/` and `GET /fabrics/` used to populate dropdowns.
- The frontend normalizes both of these response shapes:
  - Array: `[ { "id": 1, "name": "Charcoal Gray" } ]`
  - Paginated-ish: `{ "results": [ ... ] }`
- We render option labels using `item.name || item.label || value`.
- Frontend currently submits the selected label as a string value for `color` and `fabric`.

Backend alignment options
- Accept string labels for `color`/`fabric` (recommended for simplicity), or
- Publish IDs and require `{ color_id, fabric_id }` instead; if so, we can adjust quickly.

---

## Security & Roles
- Frontend: display route limited to `warehouse`, `warehouse_manager`, `owner`, `admin`.
- Backend: must enforce role-based access control server-side.
- Auth: Bearer JWT in `Authorization` header; ensure CORS allows frontend origin.

---

## Backend Checklist
- [ ] Implement `POST /api/products/` to create products with the above schema
- [ ] Support `attributes` as a JSON object for dynamic fields
- [ ] Accept string names for `color`/`fabric` OR provide/requite IDs and document it
- [ ] Return 201 JSON with created product including `name` for success toast
- [ ] Return 400 with either `{ error: string }` or `{ field: [errors] }` (both handled)
- [ ] Enforce role-based permissions (warehouse manager/admin/owner) for product creation
- [ ] Ensure CORS configured for frontend origin

---

## Files Touched
- `src/pages/AddProduct.js` — new page and form
- `src/components/api.js` — added `createProduct`; uses `getColors`, `getFabrics`
- `src/App.js` — added route `/warehouse/products/new`
- `src/pages/EnhancedWarehouseDashboard.js` — added “Add Product” button in Inventory header
- `src/pages/TestWarehouseDashboard.js` — added “Add Product” button in Inventory tab

---

## Build Status
- `npm run build` completed successfully.
- Artifact path: `build/`

If backend confirms any differences (e.g., IDs vs labels for color/fabric), we can update the payload mapping within a few lines in `AddProduct.js` and/or `api.js` without changing the user experience.