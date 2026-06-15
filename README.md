# 💳 PayGate — Payment Gateway Dashboard

## Key Features

###  Secure Authentication

* JWT-based authentication system
* Role-based access control for **Admins** and **Users**
* Protected routes across both frontend and backend
* Automatic logout handling when authentication expires

###  Interactive Dashboard

* View total revenue and transaction statistics at a glance
* Monitor payment success rates
* Explore payment trends through visual charts and reports
* Track recent transactions in real time

###  Payment Management

* Create and manage Stripe Payment Intents
* Perform full payment record management
* Search transactions by customer details or payment identifiers
* Filter payments by status and date range
* Paginate large datasets for improved performance

###  Refund Processing

* Allow administrators to initiate refunds directly from the dashboard
* Maintain a complete history of refund activities for each transaction

###  Reporting System

* Generate daily, weekly, or monthly revenue reports
* Export reports in CSV and PDF formats
* Analyze payment trends and business performance over time

### Stripe Webhook Integration

* Automatically synchronize payment statuses with Stripe events
* Handle successful, failed, refunded, and disputed transactions without manual intervention

---

##  Project Structure

```text
payment-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── seed.js
│  
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   └── utils/
│   
└
```

---

##  Getting Started

### Prerequisites

Before running the project, make sure you have the following installed:

* Node.js (version 18 or later)
* MongoDB (local installation or MongoDB Atlas)
* A Stripe account with test API keys

---

##  Installation

Clone the repository and install dependencies for both the frontend and backend applications.

```bash
git clone <repository-url>
cd payment-dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

##  Environment Configuration

### Backend Configuration

Create a `.env` file inside the `backend` directory and add the following variables:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/payment_dashboard

JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

Create a `.env` file inside the `frontend` directory:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

---

##  Obtaining Stripe API Keys

1. Sign in to your Stripe Dashboard.
2. Navigate to the **Developers → API Keys** section.
3. Copy your **Publishable Key** and add it to the frontend environment file.
4. Copy your **Secret Key** and add it to the backend environment file.

---

##  Configuring Stripe Webhooks

For local development, use the Stripe CLI to forward webhook events to your application.

```bash
# Login to Stripe CLI
stripe login

# Forward Stripe events to your local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

After running the command above, Stripe will generate a webhook signing secret. Add that value to your backend `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

---

##  Database Seeding

The application includes a seed script to populate the database with sample users and payment records.

```bash
cd backend
node seed.js
```

The script creates:

### Administrator Account to 

```text
Email: admin@paygate.com
Password: Admin@123
```

### User Account

```text
Email: user@paygate.com
Password: User@123
```

Additionally, 100 sample payment records are generated for testing purposes.

---

##  Running the Application

Start both services in separate terminal windows.

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm start or npm run start
```

The application will be available at:
http://localhost:3000





##  API Overview

### Authentication Endpoints

| Method | Endpoint             | Purpose                                    |
| ------ | -------------------- | ------------------------------------------ |
| POST   | `/api/auth/login`    | Authenticate users and generate JWT tokens |
| POST   | `/api/auth/logout`   | Log users out of the application           |
| GET    | `/api/auth/me`       | Retrieve the currently authenticated user  |
| POST   | `/api/auth/register` | Create a new user account (Admin only)     |

---

### Payment Endpoints

| Method | Endpoint                      | Purpose                                         |
| ------ | ----------------------------- | ----------------------------------------------- |
| POST   | `/api/payments/create-intent` | Create a Stripe Payment Intent                  |
| GET    | `/api/payments`               | Retrieve payments with filtering and pagination |
| GET    | `/api/payments/:id`           | Fetch detailed payment information              |
| POST   | `/api/payments/refund`        | Process refunds (Admin only)                    |
| GET    | `/api/payments/export/csv`    | Export payment data as CSV                      |

#### Supported Query Parameters

* `page`
* `limit`
* `status`
* `search`
* `startDate`
* `endDate`

---

### Dashboard Endpoints

| Method | Endpoint                             | Purpose                               |
| ------ | ------------------------------------ | ------------------------------------- |
| GET    | `/api/dashboard/stats`               | Retrieve dashboard summary statistics |
| GET    | `/api/dashboard/revenue-report`      | Generate revenue reports              |
| GET    | `/api/dashboard/recent-transactions` | Retrieve the latest transactions      |

#### Revenue Report Parameters

```text
period = daily | weekly | monthly
startDate
endDate
```

---

### Webhook Endpoint

| Method | Endpoint               | Purpose                      |
| ------ | ---------------------- | ---------------------------- |
| POST   | `/api/webhooks/stripe` | Handle Stripe webhook events |

The application currently processes the following Stripe events:

* `payment_intent.succeeded`
* `payment_intent.payment_failed`
* `payment_intent.processing`
* `payment_intent.canceled`
* `charge.refunded`
* `charge.dispute.created`

---

### Reports and Refunds

| Method | Endpoint                  | Purpose                         |
| ------ | ------------------------- | ------------------------------- |
| GET    | `/api/refunds`            | Retrieve refund history         |
| GET    | `/api/reports/export/pdf` | Export reports as PDF documents |

---

##  Testing Payments with Stripe

Use the following Stripe test card numbers during development.

| Card Number           | Scenario                          |
| --------------------- | --------------------------------- |
| `4242 4242 4242 4242` | Successful payment                |
| `4000 0000 0000 9995` | Insufficient funds                |
| `4000 0027 6000 3184` | 3D Secure authentication required |
| `4000 0000 0000 0002` | Generic card decline              |

Use any future expiration date and any valid three-digit CVC value.

---

##  Security Measures

The application follows several security best practices, including:

* Password hashing using bcrypt
* JWT-based authentication
* Automatic token cleanup on unauthorized requests
* Rate limiting to reduce abuse
* Secure HTTP headers through Helmet.js
* Stripe webhook signature verification
* Role-based access restrictions

---

##  Database Models

### User Model

The User model contains:

```text
name
email
password (hashed)
role (admin | user)
isActive
lastLogin
```

### Payment Model

The Payment model contains:

```text
paymentIntentId
customerName
customerEmail
amount
currency
status
cardBrand
last4
refunds[]
timeline[]
stripeResponse
failureCode
failureMessage
```

---

##  Technology Stack

| Layer            | Technologies                                   |
| ---------------- | ---------------------------------------------- |
| Frontend         | React 18, Vite, Tailwind CSS, Recharts, Lucide |
| Payment UI       | Stripe Elements, @stripe/react-stripe-js       |
| Backend          | Node.js, Express.js, Mongoose                  |
| Database         | MongoDB                                        |
| Authentication   | JWT, bcryptjs                                  |
| Payments         | Stripe API                                     |
| Validation       | express-validator                              |
| Logging          | Winston                                        |
| Reporting        | csv-writer, PDFKit                             |

#   p a y g a t e - d a s h b o a r d  
 