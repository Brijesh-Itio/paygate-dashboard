# PayGate API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### POST `/auth/login`
Login and receive a JWT token.

**Body:**
```json
{ "email": "admin@paygate.com", "password": "Admin@123" }
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": { "id": "...", "name": "Admin User", "email": "admin@paygate.com", "role": "admin" }
}
```

### POST `/auth/logout`
 Authenticated. Logs out the current user.

### GET `/auth/me`
 Authenticated. Returns current user profile.

### POST `/auth/register`
 Admin only. Creates a new user.
```json
{ "name": "New User", "email": "user@example.com", "password": "Secure@123", "role": "user" }
```

---

## Payments

### POST `/payments/create-intent`
 Authenticated. Creates a Stripe PaymentIntent and stores in DB.

**Body:**
```json
{
  "amount": 49.99,
  "currency": "usd",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "description": "Order #1234"
}
```
**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx",
  "payment": { ... }
}
```

### GET `/payments`
 Authenticated. List payments with filtering, search, pagination.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Per page (default: 20) |
| status | string | Filter by status |
| search | string | Search name/email/ID |
| startDate | ISO date | From date |
| endDate | ISO date | To date |
| sortBy | string | Field to sort (default: createdAt) |
| sortOrder | asc/desc | Sort direction |

### GET `/payments/:id`
 Authenticated. Get full payment details including Stripe response and timeline.

### POST `/payments/refund`
 Admin only. Issue a refund for a payment.
```json
{ "paymentId": "mongo_id", "amount": 25.00, "reason": "requested_by_customer" }
```

### GET `/payments/export/csv`
 Admin only. Download all payments as CSV and pdf format also

---

## Dashboard

### GET `/dashboard/stats`
 Authenticated. Returns aggregate statistics.

**Response:**
```json
{
  "stats": {
    "totalTransactions": 150,
    "successfulPayments": 120,
    "failedPayments": 20,
    "pendingPayments": 10,
    "totalRevenue": 15420.50,
    "totalRefunded": 320.00
  },
  "dailyRevenue": [
    { "date": "2024-01-01", "revenue": 1200.00, "count": 12 }
  ]
}
```

### GET `/dashboard/revenue-report`
 Authenticated. Revenue report by period.

**Query:** `period=daily|weekly|monthly`, `startDate`, `endDate`

### GET `/dashboard/recent-transactions`
 Authenticated. Last 10 transactions.

---

## Refunds

### GET `/refunds`
 Authenticated. List all refunds.

### GET `/refunds/stats`
 Admin only. Aggregate refund statistics.

### GET `/refunds/:refundId`
 Authenticated. Get specific refund detail.

---

## Reports

### GET `/reports/summary`
 Admin only. Full report with top customers.

### GET `/reports/export/pdf`
 Admin only. Download formatted PDF report.

**Query:** `startDate`, `endDate`

### GET `/reports/export/csv`
 Admin only. Download full transaction CSV for reporting.

---

## Webhooks

### POST `/webhooks/stripe`
 Public (Stripe signature verified). Receives Stripe events.

Handled events:
- `payment_intent.succeeded` → marks payment as succeeded
- `payment_intent.payment_failed` → marks payment as failed
- `payment_intent.processing` → marks payment as processing
- `payment_intent.canceled` → marks payment as canceled
- `charge.refunded` → updates refund records
- `charge.dispute.created` → logs dispute in timeline 

---

## Error Responses

All errors return:
```json
{ "error": "Human-readable message", "success": false }
```

| Code | Meaning |
|------|---------|
| 400 | Validation error / Bad request |
| 401 | Missing or invalid JWT |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Server error |
