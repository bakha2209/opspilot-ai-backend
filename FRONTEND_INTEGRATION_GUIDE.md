# OpsPilot AI Frontend Integration Guide

This document is the frontend contract for the current OpsPilot AI backend.
It is based on the implemented NestJS controllers, DTOs, services, entities,
Socket.IO gateway, and Python AI service.

Use it as the source of truth while building the web application. Swagger is
also available at `http://localhost:4000/docs` when the backend is running.

## 1. Backend addresses

| Purpose | Development URL |
|---|---|
| REST API | `http://localhost:4000/api/v1` |
| Swagger | `http://localhost:4000/docs` |
| Uploaded files | `http://localhost:4000/uploads/{storedName}` |
| Socket.IO server | `http://localhost:4000/realtime` |
| Health check | `GET http://localhost:4000/api/v1/health` |

Recommended frontend environment:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_BACKEND_ORIGIN=http://localhost:4000
```

For Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:4000
```

The Python AI service is backend-internal. The browser must not call port
`8001` or any `/internal/ai/*` route directly.

## 2. Global API behavior

### 2.1 Authentication

Authenticated requests require:

```http
Authorization: Bearer <accessToken>
```

Login and signup return a JWT access token valid for one day. There is
currently no refresh-token or logout endpoint. Frontend behavior should be:

1. Save the access token after signup/login.
2. Attach it to every protected request.
3. On HTTP `401`, clear local authentication state and redirect to login.
4. Optionally validate a stored token on application startup with
   `GET /auth/profile`.

For better XSS resistance, an application-owned memory store plus a secure
cookie/BFF is preferable. If the frontend is a pure SPA, `localStorage` is the
simplest current integration, with the usual XSS tradeoff.

### 2.2 Success envelope

Normal REST responses use:

```ts
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  error: null;
}
```

Example:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  },
  "error": null
}
```

### 2.3 Error envelope

Errors use:

```ts
export interface ApiErrorResponse {
  success: false;
  message: string | string[];
  error: unknown;
  timestamp: string;
}
```

Validation errors often have a string array in `message`:

```json
{
  "success": false,
  "message": [
    "conversationId must be a UUID"
  ],
  "error": {
    "message": [
      "conversationId must be a UUID"
    ],
    "error": "Bad Request",
    "statusCode": 400
  },
  "timestamp": "2026-06-24T12:00:00.000Z"
}
```

Suggested error helper:

```ts
export function getApiErrorMessage(error: unknown): string {
  const value = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };

  const message = value.response?.data?.message;

  if (Array.isArray(message)) return message.join(", ");
  return message ?? value.message ?? "Something went wrong";
}
```

### 2.4 Validation rules

The backend:

- removes no unknown fields; it rejects them with HTTP `400`;
- transforms numeric query parameters where configured;
- validates UUID fields strictly;
- uses camelCase in REST DTOs, except the nested AI action fields
  `tool_name` and `confirmation_message`.

Do not send UI-only fields in API payloads.

### 2.5 Common HTTP statuses

| Status | Meaning | Frontend behavior |
|---|---|---|
| `200`/`201` | Success | Read `data` |
| `400` | Validation or business input error | Show field/form message |
| `401` | Missing, invalid, or expired JWT | Clear auth and login |
| `403` | Role/company access denied | Show forbidden page/toast |
| `404` | Resource not found | Show not-found state |
| `409` | Duplicate or invalid state transition | Show backend message |
| `500` | Server/downstream failure | Show retry UI and log details |

## 3. Shared frontend TypeScript types

Dates are ISO strings over JSON, even though backend entities use `Date`.

```ts
export type UUID = string;
export type ISODateString = string;

export interface BaseEntity {
  id: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt?: ISODateString | null;
}

export type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "OPERATIONS_MANAGER"
  | "WAREHOUSE_STAFF";

export type UserStatus = "ACTIVE" | "INACTIVE" | "INVITED" | "BLOCKED";
export type CompanyStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
export type ProductStatus = "ACTIVE" | "INACTIVE";
export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export type StockMovementType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "ADJUSTMENT";

export type ReorderRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ORDERED";

export type NotificationType =
  | "LOW_STOCK"
  | "SYSTEM"
  | "REORDER"
  | "AI_ALERT";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}
```

### 3.1 Domain models

```ts
export interface Company extends BaseEntity {
  name: string;
  businessNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  status: CompanyStatus;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  companyId?: UUID | null;
  company?: Company | null;
}

export interface UploadedFile extends BaseEntity {
  companyId?: UUID | null;
  uploadedBy?: UUID | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number | string;
  storageType: string;
  filePath: string;
  fileUrl: string;
}

export interface Product extends BaseEntity {
  companyId: UUID;
  name: string;
  sku: string;
  description?: string | null;
  barcode?: string | null;
  unit: string;
  safetyStock: number;
  status: ProductStatus;
  mainImageId?: UUID | null;
  mainImage?: UploadedFile | null;
}

export interface Warehouse extends BaseEntity {
  companyId: UUID;
  name: string;
  code: string;
  location?: string | null;
  status: WarehouseStatus;
}

export interface Inventory extends BaseEntity {
  companyId: UUID;
  warehouseId: UUID;
  productId: UUID;
  quantity: number;
  warehouse?: Warehouse;
  product?: Product;
}

export interface StockMovement extends BaseEntity {
  companyId: UUID;
  warehouseId: UUID;
  productId: UUID;
  inventoryId?: UUID | null;
  userId?: UUID | null;
  type: StockMovementType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  reason?: string | null;
  memo?: string | null;
  warehouse?: Warehouse;
  product?: Product;
  user?: User | null;
}

export interface ReorderRequest extends BaseEntity {
  companyId: UUID;
  warehouseId: UUID;
  productId: UUID;
  requestedByUserId?: UUID | null;
  approvedByUserId?: UUID | null;
  currentQuantity: number;
  safetyStock: number;
  recommendedQuantity: number;
  aiReason?: string | null;
  status: ReorderRequestStatus;
  memo?: string | null;
  warehouse?: Warehouse;
  product?: Product;
  requestedByUser?: User | null;
  approvedByUser?: User | null;
}

export interface Notification extends BaseEntity {
  companyId: UUID;
  userId?: UUID | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLog extends BaseEntity {
  companyId?: UUID | null;
  userId?: UUID | null;
  action: string;
  resourceType: string;
  resourceId?: UUID | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  user?: User | null;
}

export interface CompanyIntegration extends BaseEntity {
  companyId: UUID;
  telegramEnabled: boolean;
  telegramChatId?: string | null;
}
```

The `fileSize` database column is `bigint`. Depending on serialization and
database driver behavior, treat it as `number | string`.

## 4. Role and navigation matrix

`SUPER_ADMIN` is platform-wide. All other roles are company-scoped.

| Feature | Super Admin | Company Admin | Operations Manager | Warehouse Staff |
|---|---:|---:|---:|---:|
| Platform companies | Full | Own company read/update | No | No |
| Company users | No company context | Full | Read | No |
| Products | Read all | CRUD | Create/read/update | Read |
| Warehouses | Read all | CRUD | Create/read/update | Read |
| Inventory | Read all | Read/move/adjust | Read/move/adjust | Read/stock in/out |
| Reorder requests | No | Read/approve/reject | Read/approve/reject | No |
| Dashboard | No | Yes | Yes | Yes, except pending-reorder route |
| Notifications | Read all | Yes | Yes | Yes |
| Files | No | Upload/read/delete | Upload/read/delete | Read |
| Audit logs | Read all | Yes | Yes | No |
| AI chat | No | Yes | Yes | No |
| Telegram settings | No | Read/update | Read | No |

Hide unauthorized controls in the UI, but do not treat hiding as security; the
backend remains authoritative.

## 5. Recommended API client

Axios example:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("opspilot_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("opspilot_access_token");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);
```

Do not manually set `Content-Type` when uploading `FormData`; the browser must
add the multipart boundary.

## 6. Authentication

### Signup

`POST /auth/signup` — public

```ts
export interface SignupInput {
  companyName: string;       // max 150
  businessNumber?: string;  // max 100
  email: string;             // valid email, max 150
  name: string;              // max 100
  password: string;          // 8..50 characters
}
```

Response data:

```ts
{
  accessToken: string;
  user: User;
  company: Company;
}
```

### Login

`POST /auth/login` — public

```ts
export interface LoginInput {
  email: string;
  password: string; // 8..50 characters
}
```

Response data:

```ts
{
  accessToken: string;
  user: User;
}
```

### Current profile

`GET /auth/profile` — any authenticated role

Response data: `User`

There are currently no refresh-token, logout, forgot-password, reset-password,
or email-verification endpoints.

## 7. Companies

### Routes

| Method | Route | Role | Body | Response data |
|---|---|---|---|---|
| `POST` | `/companies` | Super Admin | `CreateCompanyInput` | `Company` |
| `GET` | `/companies` | Super Admin | — | `Company[]` |
| `GET` | `/companies/:id` | Super Admin, Company Admin | — | `Company` |
| `PATCH` | `/companies/:id` | Super Admin, Company Admin | partial input | `Company` |
| `DELETE` | `/companies/:id` | Super Admin | — | `{ id }` |

```ts
export interface CreateCompanyInput {
  name: string;
  businessNumber?: string;
  email?: string;
  phone?: string;
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;
```

Company Admin should always use their own `user.companyId` as `:id`.

## 8. Company users

| Method | Route | Role | Response data |
|---|---|---|---|
| `POST` | `/users/company` | Company Admin | `User` |
| `GET` | `/users/company` | Company Admin, Operations Manager | `User[]` |
| `PATCH` | `/users/company/:userId/role` | Company Admin | `User` |
| `DELETE` | `/users/company/:userId` | Company Admin | `{ id }` |

Create body:

```ts
export interface CreateCompanyUserInput {
  email: string;
  name: string;
  password: string;
  role: "OPERATIONS_MANAGER" | "WAREHOUSE_STAFF";
}
```

Role update body:

```ts
export interface UpdateUserRoleInput {
  role: "OPERATIONS_MANAGER" | "WAREHOUSE_STAFF";
}
```

Important behavior:

- Company admins cannot create or assign `SUPER_ADMIN` or `COMPANY_ADMIN`.
- A user cannot delete their own account.
- Duplicate email returns `409`.

## 9. Products

### List

`GET /products?page=1&limit=20&search=motor`

Available to every role. Response data is `PaginatedData<Product>`.

Query:

```ts
{
  page?: number;   // default 1, minimum 1
  limit?: number;  // default 20, range 1..100
  search?: string; // company users: name, SKU, or barcode
}
```

### Other routes

| Method | Route | Role | Response data |
|---|---|---|---|
| `POST` | `/products` | Company Admin, Operations Manager | `Product` |
| `GET` | `/products/:id` | All roles | `Product` |
| `PATCH` | `/products/:id` | Company Admin, Operations Manager | `Product` |
| `DELETE` | `/products/:id` | Company Admin | `{ id }` |

Create body:

```ts
export interface CreateProductInput {
  name: string;          // required, max 200
  sku: string;           // required, max 100
  description?: string;
  barcode?: string;      // max 100
  unit?: string;         // max 30, backend default "EA"
  safetyStock?: number;  // integer >= 0, backend default 0
  mainImageId?: UUID;
}

export type UpdateProductInput = Partial<CreateProductInput>;
```

Image workflow:

1. Upload an image with `POST /files/upload`.
2. Read `response.data.id`.
3. Send that UUID as `mainImageId` when creating/updating the product.
4. Render `product.mainImage.fileUrl` against the backend origin.

```ts
export function resolveFileUrl(fileUrl?: string | null): string | null {
  if (!fileUrl) return null;
  if (/^https?:\/\//.test(fileUrl)) return fileUrl;
  return `${import.meta.env.VITE_BACKEND_ORIGIN}${fileUrl}`;
}
```

SKU must be unique inside a company; duplicate SKU returns `409`.

## 10. Warehouses

| Method | Route | Role | Response data |
|---|---|---|---|
| `POST` | `/warehouses` | Company Admin, Operations Manager | `Warehouse` |
| `GET` | `/warehouses` | All roles | `Warehouse[]` |
| `GET` | `/warehouses/:id` | All roles | `Warehouse` |
| `PATCH` | `/warehouses/:id` | Company Admin, Operations Manager | `Warehouse` |
| `DELETE` | `/warehouses/:id` | Company Admin | `{ id }` |

```ts
export interface CreateWarehouseInput {
  name: string;      // required, max 150
  code: string;      // required, max 50
  location?: string; // max 255
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;
```

Warehouse code must be unique inside a company.

## 11. Inventory

### List inventory

`GET /inventory` — all roles

Response data: `Inventory[]`, normally with `product` and `warehouse`.

### Stock in

`POST /inventory/stock-in`

Roles: Company Admin, Operations Manager, Warehouse Staff.

### Stock out

`POST /inventory/stock-out`

Roles: Company Admin, Operations Manager, Warehouse Staff.

Both use:

```ts
export interface StockMovementInput {
  warehouseId: UUID;
  productId: UUID;
  quantity: number; // integer >= 1
  reason?: string;  // max 255
  memo?: string;
}
```

### Manual adjustment

`POST /inventory/adjust`

Roles: Company Admin, Operations Manager.

```ts
export interface AdjustInventoryInput {
  warehouseId: UUID;
  productId: UUID;
  quantity: number; // absolute resulting quantity, integer >= 0
  reason?: string;  // max 255
  memo?: string;
}
```

The adjustment `quantity` is the final stock count, not a delta.

All three mutation routes return the saved `Inventory`. Transaction-created
inventory responses may contain IDs and quantities without populated
`product`/`warehouse` relations. Refetch inventory after mutation if the UI
needs fully populated relation objects.

Business behavior:

- Stock-out below zero returns `400 "Insufficient inventory quantity"`.
- Reaching `quantity <= product.safetyStock` creates a low-stock notification.
- The same event automatically creates one pending reorder request if one does
  not already exist for that product and warehouse.
- Automatic recommended reorder quantity is currently
  `max(safetyStock * 3, 50)`.

## 12. Stock movements

| Method | Route | Role | Response data |
|---|---|---|---|
| `GET` | `/stock-movements` | All roles | `StockMovement[]` |
| `GET` | `/stock-movements/product/:productId` | Company Admin, Operations Manager, Warehouse Staff | `StockMovement[]` |

Lists are newest first and include `warehouse`, `product`, and `user`.
There is currently no pagination or date filtering.

## 13. Reorder requests

| Method | Route | Role | Response data |
|---|---|---|---|
| `GET` | `/reorder-requests` | Company Admin, Operations Manager | `ReorderRequest[]` |
| `PATCH` | `/reorder-requests/:id/approve` | Company Admin, Operations Manager | `ReorderRequest` |
| `PATCH` | `/reorder-requests/:id/reject` | Company Admin, Operations Manager | `ReorderRequest` |

Approve/reject requests have no request body.

Only a `PENDING` request can be approved or rejected. Otherwise the backend
returns `409`. The list includes warehouse, product, requester, and approver
relations.

There is no public manual-create endpoint. Reorders are currently created by
low-stock automation or the confirmed AI action.

## 14. Dashboard

All dashboard routes are company-scoped.

### Summary

`GET /dashboard/summary`

Roles: Company Admin, Operations Manager, Warehouse Staff.

```ts
export interface DashboardSummary {
  totalWarehouses: number;
  totalProducts: number;
  totalInventoryItems: number;
  lowStockCount: number;
  pendingReorderCount: number;
  unreadNotificationCount: number;
}
```

The summary may be cached for up to 60 seconds.

### Overview

`GET /dashboard/overview`

```ts
export interface DashboardOverview {
  lowStockItems: Inventory[];
  pendingReorders: ReorderRequest[];
  recentStockMovements: StockMovement[]; // maximum 10
  unreadNotificationCount: number;
}
```

Roles: Company Admin, Operations Manager, Warehouse Staff.

### Focused routes

| Route | Response data | Roles |
|---|---|---|
| `GET /dashboard/low-stock` | `Inventory[]` | Admin, Manager, Staff |
| `GET /dashboard/pending-reorders` | `ReorderRequest[]` | Admin, Manager |
| `GET /dashboard/recent-stock-movements` | `StockMovement[]`, max 10 | Admin, Manager, Staff |

Low stock means `inventory.quantity <= product.safetyStock`.

## 15. Notifications and realtime updates

### REST routes

| Method | Route | Role | Response data |
|---|---|---|---|
| `GET` | `/notifications` | All roles | `Notification[]` |
| `GET` | `/notifications/unread` | Company Admin, Operations Manager, Warehouse Staff | `Notification[]` |
| `PATCH` | `/notifications/:id/read` | Company Admin, Operations Manager, Warehouse Staff | `Notification` |

There is currently no mark-all-read endpoint and no notification pagination.

### Socket.IO connection

Install:

```bash
npm install socket.io-client
```

Connect to the `/realtime` namespace:

```ts
import { io } from "socket.io-client";

const socket = io(
  `${import.meta.env.VITE_BACKEND_ORIGIN}/realtime`,
  {
    auth: {
      token: localStorage.getItem("opspilot_access_token"),
    },
    transports: ["websocket"],
  },
);

socket.on("connected", (payload) => {
  console.log("Realtime connected", payload);
});

socket.on("notification.created", (notification: Notification) => {
  // Add notification to cache and increment unread count.
});

socket.on("error", (payload) => {
  console.error("Realtime error", payload);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection failed", error);
});
```

The token may also be supplied through an Authorization header, query string,
or `access_token` cookie, but `auth.token` is recommended.

Currently implemented server events:

| Event | Payload |
|---|---|
| `connected` | `{ message, userId, companyId }` |
| `notification.created` | Notification-like object |
| `error` | `{ message }` |

Optional connectivity test:

```ts
socket.emit("ping", { source: "frontend" });

socket.on("pong", (response) => {
  console.log("Realtime pong", response);
});
```

After `notification.created`, invalidate/refetch:

- notifications;
- unread notification count;
- dashboard summary/overview;
- reorder requests if `notification.type === "REORDER"`;
- low-stock inventory if `notification.type === "LOW_STOCK"`.

## 16. File uploads

### Upload

`POST /files/upload`

Roles: Company Admin, Operations Manager.

```ts
async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post<ApiResponse<UploadedFile>>(
    "/files/upload",
    form,
    {
      headers: {
        // Deliberately do not set Content-Type.
      },
    },
  );

  return response.data.data;
}
```

### Other routes

| Method | Route | Role | Response data |
|---|---|---|---|
| `GET` | `/files` | Company Admin, Operations Manager, Warehouse Staff | `UploadedFile[]` |
| `DELETE` | `/files/:id` | Company Admin, Operations Manager | `{ id }` |

The current backend does not enforce an explicit MIME allowlist or file-size
limit in the files module. The frontend should still validate images for UX,
but backend validation should be added before treating uploads as hardened.

## 17. Audit logs

### Paginated list

`GET /audit-logs`

Roles: Super Admin, Company Admin, Operations Manager.

Query:

```ts
export interface AuditLogQuery {
  page?: number;         // default 1
  limit?: number;        // default 20, max 100
  action?: string;
  resourceType?: string;
  resourceId?: UUID;
  userId?: UUID;
  startDate?: string;    // ISO date/date-time
  endDate?: string;      // ISO date/date-time
}
```

Response data: `PaginatedData<AuditLog>`.

Known action values:

```ts
export type AuditAction =
  | "AUTH_LOGIN"
  | "COMPANY_CREATED"
  | "COMPANY_UPDATED"
  | "USER_CREATED"
  | "USER_ROLE_UPDATED"
  | "USER_DELETED"
  | "WAREHOUSE_CREATED"
  | "WAREHOUSE_UPDATED"
  | "WAREHOUSE_DELETED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "INVENTORY_STOCK_IN"
  | "INVENTORY_STOCK_OUT"
  | "INVENTORY_ADJUSTED"
  | "REORDER_CREATED"
  | "REORDER_APPROVED"
  | "REORDER_REJECTED";
```

### Resource history

`GET /audit-logs/resource/:resourceType/:resourceId`

Roles: Company Admin, Operations Manager.

Response data: `AuditLog[]`.

Current resource types include `Product`, `Inventory`, and `ReorderRequest`.

## 18. Company integrations

### Read

`GET /company-integrations/me`

Roles: Company Admin, Operations Manager.

Response data: `CompanyIntegration`. A default row is created automatically
when one does not exist.

### Update

`PATCH /company-integrations/me`

Role: Company Admin.

```ts
export interface UpdateCompanyIntegrationInput {
  telegramEnabled?: boolean;
  telegramChatId?: string; // max 100
}
```

If Telegram is enabled, the UI should require a chat ID even though the
current DTO does not enforce that cross-field rule.

## 19. AI chat

Use `/ai-chat`, not `/ai-copilot`, for the full conversational UI.

`/ai-copilot/chat` is a simple legacy/stateless low-stock summary endpoint.
It does not support conversations, tool confirmation, or real AI orchestration.

### AI types

```ts
export interface AiConversation extends BaseEntity {
  companyId: UUID;
  userId: UUID;
  title: string;
  lastMessageAt: ISODateString;
}

export type AiMessageRole = "user" | "assistant";

export interface AiMessage extends BaseEntity {
  conversationId: UUID;
  role: AiMessageRole;
  content: string;
}

export interface ConfirmedAction {
  tool_name: "create_reorder_request";
  arguments: {
    warehouseId: UUID;
    productId: UUID;
    recommendedQuantity: number;
    reason?: string;
  };
  confirmation_message: string;
}

export interface RecommendedAction {
  type:
    | "VIEW_LOW_STOCK"
    | "VIEW_REORDER_REQUESTS"
    | "VIEW_STOCK_MOVEMENTS"
    | "VIEW_DASHBOARD"
    | "CONFIRM_ACTION"
    | "NO_ACTION"
    | string;
  label: string;
  payload: Record<string, unknown>;
}

export interface AiChatResult {
  answer: string;
  recommended_actions: RecommendedAction[];
  pending_action: ConfirmedAction | null;
  raw_model_output?: string | null;
}

export interface ChatInput {
  conversationId: UUID;
  message: string;
  confirmedAction?: ConfirmedAction;
}
```

Notice that the AI response uses snake_case:

- `recommended_actions`
- `pending_action`
- `tool_name`
- `confirmation_message`

Do not silently convert only some fields. Either use the wire format above or
normalize the entire AI result in one adapter.

### Conversation routes

| Method | Route | Body | Response data |
|---|---|---|---|
| `POST` | `/ai-chat/conversations` | `{ title: string }` | `AiConversation` |
| `GET` | `/ai-chat/conversations` | — | `AiConversation[]` |
| `GET` | `/ai-chat/conversations/:id/messages` | — | `AiMessage[]` |
| `POST` | `/ai-chat/chat` | `ChatInput` | `AiChatResult` |
| `POST` | `/ai-chat/chat/stream` | `ChatInput` | SSE stream |

All routes require Company Admin or Operations Manager.

### Standard message flow

```ts
async function sendChat(input: ChatInput): Promise<AiChatResult> {
  const response = await api.post<ApiResponse<AiChatResult>>(
    "/ai-chat/chat",
    input,
  );

  return response.data.data;
}
```

The backend saves both the user message and the assistant's `answer`.

### Reorder confirmation flow

AI write actions use a mandatory two-step flow.

#### Step 1: request

```json
{
  "conversationId": "conversation-uuid",
  "message": "Create reorder request for the lowest stock product"
}
```

Expected result:

```json
{
  "answer": "The lowest-stock product is ... Please confirm...",
  "recommended_actions": [
    {
      "type": "CONFIRM_ACTION",
      "label": "Confirm reorder",
      "payload": {
        "warehouseId": "...",
        "productId": "...",
        "recommendedQuantity": 10
      }
    }
  ],
  "pending_action": {
    "tool_name": "create_reorder_request",
    "arguments": {
      "warehouseId": "...",
      "productId": "...",
      "recommendedQuantity": 10,
      "reason": "..."
    },
    "confirmation_message": "Confirm reorder creation"
  }
}
```

Nothing is created at this stage.

#### Step 2: explicit confirmation

Store the exact `pending_action` returned by step 1. On confirmation, send:

```ts
await sendChat({
  conversationId,
  message: "Yes, create it",
  confirmedAction: pendingAction,
});
```

Do not reconstruct IDs from labels or ask the model to invent them. Submit the
exact action object returned by the backend.

Suggested UI states:

```ts
type ChatActionState =
  | { status: "idle" }
  | { status: "awaiting-confirmation"; action: ConfirmedAction }
  | { status: "submitting"; action: ConfirmedAction }
  | { status: "completed" }
  | { status: "failed"; message: string };
```

Disable the confirmation button while submitting. If the create endpoint
returns `409 "Pending reorder request already exists"`, show that message and
refresh the reorder list.

### Streaming

`POST /ai-chat/chat/stream` returns server-sent events but requires a POST body
and bearer header, so the browser's native `EventSource` is not suitable.
Use `fetch()` and read the response stream.

```ts
export async function streamChat(
  input: ChatInput,
  token: string,
  onToken: (token: string) => void,
): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/ai-chat/chat/stream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok || !response.body) {
    const error = await response.json().catch(() => null);
    throw new Error(
      Array.isArray(error?.message)
        ? error.message.join(", ")
        : error?.message ?? "AI stream failed",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      if (event.includes("data: [DONE]")) return;

      const dataLines = event
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6));

      for (const tokenValue of dataLines) {
        onToken(tokenValue);
      }
    }
  }
}
```

Current limitation: streaming forwards raw model tokens and does not provide
the same convenient parsed `AiChatResult` envelope. Use non-stream
`POST /ai-chat/chat` for action-producing messages and confirmations. Streaming
is best limited to read-only conversational answers until the stream protocol
emits structured final metadata.

## 20. Legacy AI copilot

`POST /ai-copilot/chat`

Roles: Company Admin, Operations Manager.

Body:

```ts
{ message: string } // max 5000
```

Response:

```ts
{
  answer: string;
  recommendedActions: Array<{
    type: string;
    label: string;
    payload: Record<string, unknown>;
  }>;
}
```

This endpoint currently ignores message meaning and only reports the number of
low-stock inventory items. Do not use it for the main chat screen.

## 21. Suggested frontend routes

```text
/login
/signup
/dashboard
/products
/products/new
/products/:id
/warehouses
/inventory
/stock-movements
/reorders
/notifications
/ai
/team
/audit-logs
/settings/company
/settings/integrations
/admin/companies
```

Suggested access:

- `/admin/companies`: `SUPER_ADMIN`
- `/team`: Company Admin; read-only for Operations Manager
- `/audit-logs`: Super Admin, Company Admin, Operations Manager
- `/ai`: Company Admin, Operations Manager
- `/reorders`: Company Admin, Operations Manager
- all inventory operations: follow the role matrix in section 4

## 22. Suggested cache/query keys

For TanStack Query:

```ts
export const queryKeys = {
  profile: ["auth", "profile"] as const,
  companies: ["companies"] as const,
  companyUsers: ["users", "company"] as const,
  products: (params: object) => ["products", params] as const,
  product: (id: UUID) => ["products", id] as const,
  warehouses: ["warehouses"] as const,
  inventory: ["inventory"] as const,
  stockMovements: ["stock-movements"] as const,
  productMovements: (id: UUID) =>
    ["stock-movements", "product", id] as const,
  reorders: ["reorder-requests"] as const,
  dashboardSummary: ["dashboard", "summary"] as const,
  dashboardOverview: ["dashboard", "overview"] as const,
  notifications: ["notifications"] as const,
  unreadNotifications: ["notifications", "unread"] as const,
  files: ["files"] as const,
  auditLogs: (params: object) => ["audit-logs", params] as const,
  integration: ["company-integrations", "me"] as const,
  conversations: ["ai-chat", "conversations"] as const,
  messages: (conversationId: UUID) =>
    ["ai-chat", "messages", conversationId] as const,
};
```

After inventory mutation, invalidate:

```ts
[
  queryKeys.inventory,
  queryKeys.stockMovements,
  queryKeys.reorders,
  queryKeys.dashboardSummary,
  queryKeys.dashboardOverview,
  queryKeys.notifications,
  queryKeys.unreadNotifications,
]
```

After approve/reject, invalidate reorders, dashboard, notifications, and the
resource's audit history.

## 23. UI implementation checklist

### Foundation

- Configure API and backend-origin environment variables.
- Build a typed API client and global error normalizer.
- Build auth storage, startup profile check, and `401` handling.
- Implement role-aware route guards and component-level permission checks.
- Use ISO date parsing and the user's locale/time zone for display.

### Core screens

- Dashboard summary cards and overview lists.
- Paginated/searchable products table.
- Product form with upload-first image workflow.
- Warehouse CRUD.
- Inventory table with warehouse/product filters on the frontend.
- Stock-in, stock-out, and absolute-adjustment dialogs.
- Movement history.
- Reorder list with approve/reject confirmation dialogs.
- Notification center plus realtime toast/badge updates.
- Team management.
- Audit log filters and before/after JSON viewer.
- Telegram integration settings.

### AI

- Conversation list and create-conversation UI.
- Ordered message history.
- Optimistic user message while waiting for AI.
- Explicit pending-action confirmation card.
- Exact `pending_action` preservation.
- Non-stream requests for write actions.
- Graceful handling when AI/Ollama is unavailable.

### UX details

- Confirm destructive operations.
- Disable duplicate submissions.
- Display backend `409` messages directly.
- Refetch relations after inventory mutations.
- Show empty states for no inventory, no low stock, and no conversations.
- Use skeletons for dashboard and table loading.
- Keep notification badge synchronized with REST and Socket.IO.

## 24. Current backend limitations relevant to frontend

These are current implementation facts, not frontend bugs:

1. JWT expires after one day and has no refresh endpoint.
2. Most lists are not paginated; products and audit logs are paginated.
3. Product status and warehouse status exist but are not accepted by create or
   update DTOs, so the frontend cannot currently toggle active/inactive.
4. Reorder status `ORDERED` exists but there is no route to set it.
5. There is no manual public reorder-create endpoint.
6. There is no mark-all-notifications-read endpoint.
7. File upload has no explicit size or MIME restrictions.
8. AI streaming does not emit parsed final action metadata.
9. The legacy `/ai-copilot/chat` and full `/ai-chat/chat` response naming is
   inconsistent (`recommendedActions` versus `recommended_actions`).
10. Company update currently accepts an ID path parameter. Company Admin UI
    must use only the authenticated user's own `companyId`.
11. Company Admin has no list-companies route, so load their company with
    `GET /companies/{user.companyId}`.
12. Socket.IO currently broadcasts company notifications; user-targeted room
    support exists internally but no distinct user-only public event is emitted.

## 25. Smoke-test sequence for the frontend

Use this order to validate a new frontend:

1. Signup and store token.
2. Load `/auth/profile`.
3. Create a warehouse.
4. Upload an image.
5. Create a product with the uploaded `mainImageId`.
6. Stock in the product.
7. Load inventory and movement history.
8. Stock out or adjust until quantity is at/below safety stock.
9. Observe `notification.created`.
10. Load the automatically created pending reorder.
11. Approve or reject the reorder.
12. Create an AI conversation.
13. Ask for the lowest-stock product.
14. Ask to create a reorder and verify the confirmation card.
15. Submit the exact pending action and verify the reorder list.
16. Verify dashboard and audit logs update.

## 26. Minimal health check

```ts
const response = await api.get<
  ApiResponse<{ service: string; timestamp: string }>
>("/health");
```

Expected `data.service`:

```text
OpsPilot AI Backend
```
