# AURELIA — Full-stack Perfume Store

A luxury perfume storefront based on the supplied Aurelia Cloud Edition files. The frontend and backend are in separate folders.

## Folder structure

```text
aurelia-perfume-fullstack/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── theme.css
│   └── script.js
└── backend/
    ├── server.js
    ├── package.json
    └── data/
        ├── products.json
        ├── orders.json
        └── newsletter.json
```

## Requirements
- Node.js 18 or newer
- Internet access for Google Fonts and the external Unsplash product photos (the page includes a generated-image fallback)

## Run locally
1. Extract the ZIP.
2. Open a terminal in `aurelia-perfume-fullstack/backend`.
3. Install packages:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000`.

The Express backend serves the frontend and exposes:
- `GET /api/health` — server status
- `GET /api/products` — product catalogue; optional `category`, `search`, and `sort` query parameters
- `GET /api/products/:id` — one product by ID or name
- `POST /api/newsletter` — validates and stores an email subscription in the local JSON file
- `POST /api/orders` — stores a demo order from product IDs and quantities only

## Demo and security notes
- Checkout in the supplied frontend is a visual preview and does not process real payments.
- The order API intentionally stores cart lines only; it does not collect card, UPI, name, address, or other payment/shipping details.
- Newsletter emails are stored in `backend/data/newsletter.json` locally. Use test emails for development.
- JSON files are suitable for a college/demo project, not a production store. Production deployment should use a database, HTTPS, authentication for admin routes, rate limiting, and a real payment provider.
- Product descriptions, prices, ratings and imagery are demo content. External photos require internet access.
