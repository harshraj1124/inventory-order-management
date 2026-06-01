# Inventory & Order Management System

A full-stack web application for managing products, customers, and orders — with real-time inventory tracking, automatic stock reduction on orders, and low-stock alerts.

---

## Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Frontend       | React 19, TypeScript, Vite        |
| Backend        | Python 3.12, FastAPI, SQLModel    |
| Database       | PostgreSQL 16                     |
| Containerization | Docker, Docker Compose          |
| Frontend server | nginx (alpine)                   |

---

## Features

- **Products** — Add, edit, delete, and list products. SKU is enforced unique.
- **Customers** — Add, delete, and list customers. Email is enforced unique.
- **Orders** — Place orders against a customer and product. Cancelling restores stock.
- **Inventory tracking** — Stock reduces automatically when an order is placed.
- **Low stock alerts** — Dashboard highlights products with 5 or fewer units left.
- **Dashboard** — Summary cards for total products, customers, orders, and revenue.
- **Validation** — Orders are rejected if stock is insufficient. All inputs validated on both frontend and backend.

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── config.py        # Settings from environment variables
│   │   ├── database.py      # SQLModel engine and session
│   │   ├── models.py        # Product, Customer, Order models
│   │   ├── main.py          # FastAPI app entry point
│   │   └── routers/
│   │       ├── products.py  # CRUD endpoints for products
│   │       ├── customers.py # CRUD endpoints for customers
│   │       └── orders.py    # Order creation, retrieval, cancellation
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── api.ts           # Fetch wrapper for backend calls
│   │   ├── types.ts         # TypeScript types
│   │   └── styles.css       # Application styles
│   ├── nginx.conf           # nginx config for serving the SPA
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Running Locally with Docker

This is the recommended way to run the full stack.

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd inventory-manager
```

**2. Create your environment file**

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development. No changes needed.

**3. Build and start all services**

```bash
docker compose up --build
```

This starts three containers:
- `inventory_db` — PostgreSQL database
- `inventory_backend` — FastAPI API on port `8000`
- `inventory_frontend` — React app served via nginx on port `80`

**4. Open in browser**

```
Frontend → http://localhost
Backend  → http://localhost:8000/docs   (interactive API docs)
```

**5. Stop the application**

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```

---

## Environment Variables

| Variable              | Description                              | Default                                                             |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| `POSTGRES_DB`         | Database name                            | `inventory_db`                                                      |
| `POSTGRES_USER`       | Database user                            | `inventory_user`                                                    |
| `POSTGRES_PASSWORD`   | Database password                        | `inventory_password`                                                |
| `DATABASE_URL`        | Full SQLAlchemy connection string        | `postgresql+psycopg://inventory_user:inventory_password@db:5432/inventory_db` |
| `BACKEND_CORS_ORIGINS`| Allowed frontend origin(s)              | `http://localhost`                                                  |
| `VITE_API_BASE_URL`   | Backend URL used by the frontend         | `http://localhost:8000`                                             |

---

## API Reference

### Health

```
GET /health
```

### Products

```
GET    /products
POST   /products
GET    /products/{id}
PATCH  /products/{id}
DELETE /products/{id}
```

### Customers

```
GET    /customers
POST   /customers
GET    /customers/{id}
PATCH  /customers/{id}
DELETE /customers/{id}
```

### Orders

```
GET    /orders
POST   /orders
GET    /orders/{id}
DELETE /orders/{id}
```

Full interactive docs are available at `/docs` when the backend is running.

---

## Business Rules

- Product SKU must be unique.
- Customer email must be unique (stored lowercase).
- Product stock cannot go below zero.
- An order cannot be placed if requested quantity exceeds available stock.
- Placing an order automatically deducts stock.
- Cancelling an order automatically restores stock.
- Order total is calculated by the backend (`unit_price × quantity`).

---

## Deployment

### Backend — Render / Railway / Fly.io

1. Push your code to GitHub.
2. Create a new web service and point it to the `backend/` directory.
3. Set the build command to:
   ```
   pip install -r requirements.txt
   ```
4. Set the start command to:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
5. Add the following environment variables in the hosting dashboard:
   - `DATABASE_URL` — connection string from your hosted PostgreSQL
   - `BACKEND_CORS_ORIGINS` — your deployed frontend URL (e.g. `https://your-app.vercel.app`)

### Frontend — Vercel / Netlify

1. Import your GitHub repository.
2. Set the **root directory** to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add the environment variable:
   - `VITE_API_BASE_URL` — your deployed backend URL (e.g. `https://your-api.onrender.com`)

---

## Live Deployment

| Service  | URL |
|----------|-----|
| Frontend | https://inventory-order-management-lac.vercel.app |
| Backend API | https://inventory-backend-8vlb.onrender.com |
| API Docs | https://inventory-backend-8vlb.onrender.com/docs |

## Docker Hub

The backend image is available at:

```
docker pull <your-dockerhub-username>/inventory-backend:latest
```
