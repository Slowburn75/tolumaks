# Tolumak System Audit — What to Change & Improve

**Date:** 2026-07-29  
**Scope:** Full stack — NestJS backend, Next.js frontend, Prisma schema, auth, payments, cart/orders, admin, deployment  
**Stack:** Next.js 14 · NestJS 10 · Prisma · Neon PostgreSQL · Paystack · Flutterwave · Cloudinary · JWT

This document is a complete system review: what is broken, what must change, and what should be improved before production.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical (Fix Before Production)](#1-critical-fix-before-production)
3. [High — Money, Cart & Order Flows](#2-high--money-cart--order-flows)
4. [High — Auth & Session Reliability](#3-high--auth--session-reliability)
5. [Medium — Data Model & API Design](#4-medium--data-model--api-design)
6. [Medium — Frontend Architecture](#5-medium--frontend-architecture)
7. [Medium — Ops, Security & Quality](#6-medium--ops-security--quality)
8. [README Claims vs Reality](#7-readme-claims-vs-reality)
9. [Strengths to Keep](#8-strengths-to-keep)
10. [Recommended Roadmap](#9-recommended-roadmap)
11. [File Reference Map](#10-file-reference-map)

---

## Executive Summary

Tolumak is a full-stack fashion e-commerce platform with a solid modular scaffold: NestJS modules, Prisma domain models (products, variants, orders, coupons, reviews, banners), dual payment providers, and a premium-looking Next.js storefront + admin.

It is **not yet production-safe**. The highest-risk gaps are:

| Area | Risk |
|------|------|
| Payment webhooks | Unauthenticated; anyone can mark orders paid |
| Payment amounts | Never verified against order total |
| Inventory | Decremented before payment; cancel does not restore stock |
| Shipping totals | Frontend and backend disagree |
| Auth | JWT fallback secrets; access token in localStorage; no refresh on 401 |
| Admin UI | Only checks for any token, not ADMIN role |
| Uploads | Any logged-in user can upload/delete media |

**Bottom line:** Fix P0 (safety & money) before real payments. Treat the rest as iterative hardening and product polish.

---

## 1. Critical (Fix Before Production)

### 1.1 Payment webhooks are unauthenticated

**Where:** `backend/src/modules/payments/payments.controller.ts`, `payments.service.ts`

`POST /api/payments/webhook/paystack` and `POST /api/payments/webhook/flutterwave` accept any body and can mark orders as paid. There is no signature verification (`x-paystack-signature`, Flutterwave secret hash).

**Change:**
- Verify HMAC signatures before mutating order/payment state.
- Reject unsigned or invalid payloads with `401`.
- Prefer raw body for signature verification (Nest may parse JSON before verify).

---

### 1.2 Payment amount is never checked against order total

**Where:** `PaymentsService.verifyPaystack`, `verifyFlutterwave`, webhook handlers

On verify/webhook, only `metadata.orderId` (or similar) is used. A successful payment of ₦1 could still mark a ₦50,000 order as paid if references/metadata are abused.

**Change:**
- Compare gateway `amount` (and currency) to `order.total` before setting `PAID`.
- Reject mismatches; log for fraud review.

---

### 1.3 Stock decremented at order create, not at payment

**Where:** `backend/src/modules/orders/orders.service.ts` (`create`, `cancelOrder`)

`OrdersService.create` decrements `stockQuantity` and increments coupon `usedCount` immediately for `PENDING` orders. Abandoned checkouts lock inventory. Cancel does **not** restore stock or reverse coupon usage.

**Change:**
- Prefer reserve-on-create with TTL, or decrement only after successful payment.
- On cancel / refund / payment timeout: restore stock, reverse coupon `usedCount`, write inventory logs.
- Use database transactions for all of the above.

---

### 1.4 Admin UI is not role-gated on the frontend

**Where:** `frontend/src/components/layout/AdminLayout.tsx`

Only checks that *any* JWT exists in `localStorage`. A normal user token can open `/admin/*` (API returns 403 for mutations, but shell and some UI still load).

**Change:**
- Require `user.role === 'ADMIN'`.
- Add Next.js `middleware.ts` for `/admin` routes.
- Redirect non-admins to storefront or 403 page.

---

### 1.5 Hardcoded JWT secret fallbacks

**Where:** `auth.service.ts`, `jwt.strategy.ts`, `auth.module.ts`, `auth.controller.ts`

```ts
process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production'
```

If env vars are missing in production, tokens are signed with a known default.

**Change:**
- Fail fast at boot if `JWT_SECRET` / `JWT_REFRESH_SECRET` are missing when `NODE_ENV === 'production'`.
- Never ship default secrets.

---

### 1.6 Access token in `localStorage` (XSS → account takeover)

**Where:** `frontend/src/hooks/useAuth.ts`, `frontend/src/lib/api.ts`

Auth is persisted via Zustand + `localStorage` (`tolumak-auth`). Any XSS steals the session.

**Change:**
- Prefer httpOnly cookies for access + refresh (or short-lived cookie + BFF).
- If Bearer tokens remain: enforce strict CSP, sanitize all user HTML, avoid `dangerouslySetInnerHTML`.

---

### 1.7 Refresh token stored plaintext in DB

**Where:** Prisma `User.refreshToken`, `AuthService.login` / `refresh`

The raw JWT is stored. A database leak equals full session hijack for all users.

**Change:**
- Store only a hash of the refresh token; compare hashes on refresh.
- Support token families / rotation with revocation of the chain on reuse.

---

### 1.8 Uploads open to any authenticated user

**Where:** `backend/src/modules/uploads/uploads.controller.ts`

Uses only `JwtAuthGuard` — any customer can upload images/videos and delete by `publicId`.

**Change:**
- Restrict upload/delete to `ADMIN` (or Cloudinary signed upload policies for client-direct uploads).
- Rate-limit upload endpoints.

---

## 2. High — Money, Cart & Order Flows

### 2.1 Shipping fee mismatch (checkout lies about price)

| Source | Logic |
|--------|--------|
| Frontend `deliveryMethods` (`lib/constants.ts`) | standard ₦1,500 / express ₦3,500 / pickup ₦0 |
| Backend `OrdersService.create` | hardcodes `subtotal >= 50000 ? 0 : 2500` |

Checkout UI shows one total; the charged total is different. Coupon is not applied in checkout UI (`discount={0}` in `CheckoutForm`).

**Change:**
- Single source of truth for shipping (config table or shared constants + API quote endpoint).
- Apply coupons server-side only; display server-computed totals in checkout.
- Never trust client-sent line totals for payment amount.

---

### 2.2 Variant stock is decorative

**Where:** `CartService`, `OrdersService`, Prisma `ProductVariant`

Cart/order checks only `product.stockQuantity`, never `ProductVariant.stock` for size/color. Specific variants can oversell while product total looks fine.

**Change:**
- Resolve variant by size/color on add-to-cart and order create.
- Decrement variant stock and keep product aggregate in sync (or drop product-level stock if variants always own inventory).

---

### 2.3 Order creation is not transactional

**Where:** `OrdersService.create`

Stock updates, inventory logs, coupon increments, and order create are separate awaits. Partial failure leaves inconsistent state. Concurrent orders can race past stock checks.

**Change:**
- Wrap in `prisma.$transaction`.
- Use conditional updates (`WHERE stockQuantity >= qty`) to avoid races.
- Fail the whole order if any item cannot be reserved.

---

### 2.4 Cancel order API wrong on frontend

**Where:** `frontend/src/lib/api.ts`

```ts
cancelOrder: (id) => api.patch(`/admin/orders/${id}/status`, { status: 'CANCELLED' })
```

Users hit an **admin** route. Backend already has `POST /orders/:id/cancel`.

**Change:**
- Call `POST /orders/:id/cancel`.
- Ensure cancel restores stock and coupon usage (see 1.3).

---

### 2.5 Contact form does not contact anyone

**Where:** `frontend/src/lib/api.ts` → `contactApi.send`

```ts
api.post("/newsletter/subscribe", { email: data.email })
```

Ignores name, subject, and message.

**Change:**
- Real contact endpoint that emails store staff or stores inquiries.
- Or integrate a form service; stop reusing newsletter.

---

### 2.6 No payment verification after Paystack redirect

**Where:** `PaystackButton.tsx`, checkout success page

Button redirects to `authorization_url`. Success flow does not call `verify`. Relies solely on webhooks (which are currently unsecured).

**Change:**
- On success/callback route, call verify with reference.
- Show paid vs pending clearly; poll or webhook as backup.

---

### 2.7 Bank transfer is incomplete

**Where:** `CheckoutForm.tsx`

Hardcoded GTBank details. No pending-payment admin workflow, no proof upload, no reconciliation.

**Change:**
- Either remove bank transfer, or implement pending bank payments + admin confirm + notifications.

---

## 3. High — Auth & Session Reliability

### 3.1 No automatic token refresh on 401

**Where:** `frontend/src/lib/api.ts`

Never refreshes. Access token expires (15m) → silent API failures until re-login.

**Change:**
- On 401, call `/auth/refresh` (with credentials), retry once, then logout.
- Queue concurrent requests during refresh.

---

### 3.2 Refresh flow incomplete on client

**Issues:**
- Backend sets refresh in **httpOnly cookie**; login response body does not always include refresh.
- Frontend `fetch` never sets `credentials: 'include'`.
- Cookie `sameSite: 'lax'` + cross-origin (Vercel frontend ↔ Railway/Render API) often fails without `SameSite=None; Secure` and correct domain setup.

**Change:**
- Align cookie strategy for cross-site API, **or** return refresh in body and rotate carefully.
- Always send `credentials: 'include'` if cookies are used.

---

### 3.3 Logout is local-only

**Where:** `useAuth.ts`

Clears store; never calls `POST /auth/logout` (server-side refresh not cleared).

**Change:**
- Always call logout API, then clear client state (cart keys, etc.).

---

### 3.4 Missing email verification UI

Backend emails `/verify-email?token=...` but there is **no** frontend route under `app/(auth)/`.

**Change:**
- Add `verify-email` page that posts the token to `POST /auth/verify-email`.

---

### 3.5 Auth refresh controller accesses private service field

**Where:** `auth.controller.ts`

```ts
this.authService['jwtService'].verify(...)
```

Fragile and poorly typed.

**Change:**
- Public method on `AuthService`, or use `JwtRefreshStrategy` properly.

---

## 4. Medium — Data Model & API Design

### 4.1 No DB indexes beyond unique keys

**Where:** `backend/prisma/schema.prisma`

Hot paths (products by status/gender, orders by userId/status, reviews by productId) will slow as data grows. No `@@index` declarations found.

**Change — add indexes such as:**
- `Product(status, createdAt)`, `Product(isFeatured)`, `Product(isNewArrival)`, `Product(isBestSeller)`
- `Order(userId, createdAt)`, `Order(status)`, `Order(paymentStatus)`
- `Review(productId)`, `Review(isApproved)`
- `CartItem(cartId)`, `Payment(reference)`

---

### 4.2 Guest cart claimed but not implemented

README claims guest + logged-in cart. Schema: `Cart.userId @unique` only. Local cart exists (`tolumak-cart`) but never merges on login.

**Change:**
- Guest session cart + merge on login, **or** drop the guest claim from docs.

---

### 4.3 `TransformInterceptor` / `HttpExceptionFilter` never registered

**Where:** `backend/src/common/interceptors/transform.interceptor.ts`, `filters/http-exception.filter.ts`

Defined but not wired in `main.ts` / `AppModule`. Response shape is inconsistent; frontend uses `res.data || res` hacks everywhere.

**Change:**
- Register globally.
- Standardize `{ success, data, meta, timestamp }` once.
- Single client unwrapper + typed responses.

---

### 4.4 Admin settings are stubs

**Where:** `admin.controller.ts`

```ts
getSettings() → hardcoded object
updateSettings() → echoes body
```

**Change:**
- Persist in DB (`StoreSettings` model), or remove settings UI until real.

---

### 4.5 Coupon: no per-user limit / stacking rules

Only global `usageLimit`. Same user can reuse a code until global limit.

**Change:**
- Optional `maxPerUser` + coupon usage table `(userId, couponId)`.

---

### 4.6 Reviews: no verified-purchase check

Anyone authenticated can review any product.

**Change:**
- Require a delivered order containing that product before review create.

---

### 4.7 Product filter / sort FE–BE mismatch

| Frontend | Backend expects |
|----------|-----------------|
| `sort=price_asc` / `price_desc` | `sortBy=price` + `sortOrder` |
| `isOnSale` / sale filter | Not consistently mapped |
| `ageGroup=kids` | Enum `CHILDREN` |
| gender lowercased in URL | Uppercased in shop fetch (OK if always mapped) |

**Change:**
- Document one query-param contract.
- Map sort values explicitly on the shop page.
- Align ageGroup and sale filters with Prisma enums/fields.

---

### 4.8 Fragile API response unwrapping

Shop, home, admin, cart all use patterns like:

```ts
const data = Array.isArray(res) ? res : res?.data || [];
```

Breaks if interceptor wraps twice or shape changes.

**Change:**
- One `request<T>()` helper that unwraps `{ data }` and throws typed errors.

---

## 5. Medium — Frontend Architecture

### 5.1 Almost everything is `"use client"`

Home, shop, product pages fetch in the browser. Little SSR/SSG for SEO, LCP, or crawlers.

**Change:**
- Server Components for product listing, product detail, home sections.
- Client only for cart, auth, checkout interactions.
- Use App Router data fetching properly.

---

### 5.2 No route protection middleware

No `frontend/src/middleware.ts` for `/admin`, `/dashboard`, `/checkout`.

**Change:**
- Next middleware (cookie-based or edge-safe JWT decode) for auth + role.

---

### 5.3 Cart optimistic sync is fire-and-forget

**Where:** `useCart.ts`

```ts
cartApi.addToCart(...).catch(() => {});
```

Server failure leaves local cart wrong; no toast. `fetchCart` auth check is weak.

**Change:**
- Await API when logged in; rollback + toast on error.
- Merge guest cart on login.
- `clearCart` should call `DELETE /cart` on the server.

---

### 5.4 Hardcoded trends / marketing data

- Admin dashboard fake trends: `trend={12}` etc.
- Home hero uses Unsplash slides, not admin banners API.

**Change:**
- Wire `BannersModule` to homepage.
- Show real MoM deltas from admin dashboard API.

---

### 5.5 Dependency hygiene

Frontend pins many `@radix-ui/*` packages to `"latest"` — non-reproducible builds.

**Change:**
- Lock exact versions.
- Add Dependabot or Renovate.

---

### 5.6 Next.js is outdated (14.1.0)

Security and App Router fixes land on newer 14.x / 15.

**Change:**
- Upgrade deliberately with regression tests on shop, checkout, admin.

---

## 6. Medium — Ops, Security & Quality

### 6.1 Zero automated tests

Backend has `"test": "jest"` but no meaningful suite for payments, orders, auth, coupons.

**Priority test targets:**
1. Order total calculation (subtotal, shipping, coupon)
2. Stock race / insufficient stock
3. Payment verify amount match
4. Webhook signature accept/reject
5. Coupon validation edge cases
6. Role guards (USER vs ADMIN)

---

### 6.2 No `.env.example`

Only real `.env` / `.env.local` (gitignored). Onboarding friction; secrets can be mishandled.

**Change:**
- Commit `backend/.env.example` and `frontend/.env.example` with placeholder values only.

---

### 6.3 Rate limiting too coarse

Global Throttler: 100 req/min. Auth and forgot-password need tighter limits (brute force, email spam).

**Change:**
- Stricter throttles on `/auth/*` and payment init endpoints.

---

### 6.4 Swagger / OpenAPI missing

No generated API docs for frontend or mobile consumers.

**Change:**
- `@nestjs/swagger` + export OpenAPI; optionally generate TS client.

---

### 6.5 Logging & observability missing

Silent `catch {}` around emails and Cloudinary deletes. No structured logs, request IDs, or error tracking (e.g. Sentry).

**Change:**
- Structured logger (Nest Logger or pino).
- Capture exceptions; never swallow payment/order errors silently.

---

### 6.6 Dockerfile installs devDependencies in production

```dockerfile
RUN npm install --include=dev
```

Larger image and attack surface.

**Change:**
- Multi-stage build; production deps only in runtime image.

---

### 6.7 Default admin credentials in README + bootstrap

`admin@tolumak.com` / `Admin123!` auto-created on deploy via `backend/bootstrap.js`.

**Change:**
- Force password change on first login in production.
- Never seed known passwords in prod; use one-time setup secrets.

---

### 6.8 CORS allowlist hardcodes a Vercel URL

Works for one deploy; brittle for preview deployments.

**Change:**
- Env-driven list only (`FRONTEND_URL`, `FRONTEND_URLS`).

---

### 6.9 No monorepo shared types

`backend/` and `frontend/` duplicate domain types (Product, Order, User, etc.).

**Change:**
- Shared `packages/types`, or generate types from OpenAPI.

---

## 7. README Claims vs Reality

| Claimed | Reality |
|---------|---------|
| Guest cart | Local only; no guest session on server |
| Invoice downloads | Not implemented |
| Real-time dashboard charts | Partial; some fake trends |
| Production-ready | Critical payment/stock/auth holes remain |
| Email verification flow | Backend only; no frontend page |
| Banner management | Admin exists; storefront often ignores API |
| Invoice / full order lifecycle emails | Minimal HTML emails; many paths skip if SMTP unset |

---

## 8. Strengths to Keep

- Clear modular Nest structure (auth, products, orders, payments, admin, coupons, reviews, banners).
- Solid Prisma domain model for fashion retail (variants, inventory log, multi-status orders).
- Password hashing (bcrypt cost 12), class-validator DTOs, helmet, global throttling present.
- Dual payment providers (Paystack + Flutterwave) fit the Nigerian market.
- Broad admin surface (products, orders, customers, coupons, reviews, banners, newsletter).
- UI stack (Tailwind + shadcn/Radix) is coherent and premium-looking.
- Role guards on backend admin endpoints are generally correct when used.
- Soft-delete style product archive (`ARCHIVED`) is sensible for order history.

---

## 9. Recommended Roadmap

### P0 — Safety & money (1–2 weeks)

1. Webhook signature verification + amount/currency checks  
2. Order / payment / stock in transactions; restore stock on cancel  
3. Shipping and coupon totals from server only  
4. Fail boot if JWT secrets missing; hash refresh tokens  
5. Admin role check on frontend + middleware  
6. Fix cancel endpoint, contact form, upload authorization  

### P1 — Auth & cart reliability (1 week)

7. Token refresh interceptor + `credentials` / cookie alignment  
8. Proper logout + session revoke  
9. Cart merge + error handling on sync  
10. Verify-email page + payment verify on callback  

### P2 — Product correctness (1 week)

11. Variant-level inventory  
12. Filter/sort contract alignment  
13. DB indexes + transaction hardening  
14. Register response interceptor; clean API client  

### P3 — Product quality (ongoing)

15. SSR for shop/product SEO  
16. Tests for critical paths  
17. Settings persistence, real contact form, banners on home  
18. Observability, `.env.example`, Docker multi-stage  
19. Upgrade Next.js + lock dependency versions  

---

## 10. File Reference Map

### Backend (high impact)

| Path | Notes |
|------|--------|
| `backend/src/main.ts` | CORS, validation; missing global filter/interceptor |
| `backend/src/app.module.ts` | Throttler; module wiring |
| `backend/src/modules/auth/*` | JWT, refresh, email, profile |
| `backend/src/modules/orders/*` | Create/cancel/status; stock & shipping bugs |
| `backend/src/modules/payments/*` | Init/verify/webhooks — critical security |
| `backend/src/modules/cart/*` | User cart only |
| `backend/src/modules/products/*` | Filters, CRUD, archive |
| `backend/src/modules/uploads/*` | Auth too open |
| `backend/src/modules/admin/*` | Dashboard + stub settings |
| `backend/prisma/schema.prisma` | Domain model; needs indexes |
| `backend/bootstrap.js` | Auto-seeds default admin on deploy |
| `backend/Dockerfile` | Prod install of dev deps |

### Frontend (high impact)

| Path | Notes |
|------|--------|
| `frontend/src/lib/api.ts` | All API clients; cancel/contact bugs |
| `frontend/src/hooks/useAuth.ts` | localStorage session |
| `frontend/src/hooks/useCart.ts` | Local + weak server sync |
| `frontend/src/components/checkout/CheckoutForm.tsx` | Totals, payment flow |
| `frontend/src/components/checkout/PaystackButton.tsx` | Redirect only |
| `frontend/src/components/layout/AdminLayout.tsx` | Token-only gate |
| `frontend/src/lib/constants.ts` | Shipping methods, sorts |
| `frontend/src/app/(store)/shop/page.tsx` | Filter/sort mapping |
| `frontend/src/components/home/PremiumHomePage.tsx` | Client-only home |

---

## How to Use This Doc

1. Treat **Section 1 (Critical)** as a release blocker checklist.  
2. Track P0–P3 items in issues or a project board (one issue per numbered item works well).  
3. Re-run this audit after P0: payment, inventory, and auth should be re-verified end-to-end.  
4. Update this file when items are closed (add a “Resolved” section with date and PR links).

---

## Resolved (2026-07-29)

Bank-transfer checkout path + bulk hardening pass:

- Shipping FE/BE alignment, bank transfer order flow, stock restore on cancel, admin confirm payment
- JWT fail-fast in production, hashed refresh tokens, stricter auth throttles
- Uploads restricted to ADMIN; payment webhooks require signatures + amount checks (card init disabled)
- Contact form endpoint + storage; coupon maxPerUser + usage tracking; verified-purchase reviews
- Variant-aware cart/order stock; DB indexes; response interceptor + exception filter registered
- Token refresh on 401, credentials include, logout API, verify-email page, guest cart merge
- Admin layout + middleware role/session gates (basic; full role design still open)
- Admin settings persisted; homepage banners API; dashboard MoM trends; Docker multi-stage; `.env.example`
- Shop filter/sort alignment

**Still intentionally deferred / product work:** deeper multi-role admin model, SSR/SEO rewrite, full test suite, OpenAPI/Swagger, moving access tokens out of localStorage to pure httpOnly cookies.

*Generated from a full-repo audit of Tolumak. Revisit after major refactors or before any production go-live.*
