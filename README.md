# Restaurant WhatsApp Order Assistant MVP

A starter MVP built with **Node.js + Express + SQLite** for handling multi-restaurant WhatsApp ordering flows.

## Features

- Multi-restaurant support
- Restaurant profile: menu items, prices, FAQs, delivery areas, delivery charges, staff WhatsApp number
- WhatsApp webhook placeholder for:
  - menu questions (`MENU`, `FAQ`)
  - order placement (`ORDER <item name>`)
  - order detail collection (name, phone, delivery/pickup, address)
  - order confirmation and summary (`CONFIRM`)
- Staff notification via WhatsApp API placeholder logger
- Admin dashboard:
  - view restaurants
  - edit restaurant details
  - edit menu
  - view recent orders
- Clean, simple UI using server-rendered EJS

## Tech Stack

- Node.js
- Express
- SQLite (`better-sqlite3`)
- EJS templates

## Project Structure

- `src/server.js` – app entrypoint
- `src/routes/whatsapp.js` – WhatsApp flow API
- `src/routes/admin.js` – admin dashboard routes
- `src/services/` – business logic and WhatsApp placeholder
- `src/db/` – DB connection and initialization/seed
- `src/views/` – dashboard UI
- `public/styles.css` – clean UI styles

## Quick Start

```bash
npm install
npm run init-db
npm start
```

Open dashboard:

- `http://localhost:3000/admin`

### Simulate WhatsApp incoming message

`POST /whatsapp/incoming`

Body:

```json
{
  "restaurantId": 1,
  "fromPhone": "+15551234567",
  "message": "menu"
}
```

Sample flow:

1. `menu`
2. `order paneer wrap`
3. `<full name>`
4. `<phone>`
5. `delivery` or `pickup`
6. `<address>` (if delivery)
7. `confirm`

On confirm, order is stored and a placeholder staff WhatsApp notification is logged.

## PostgreSQL Note

This MVP currently uses SQLite for speed. You can swap to PostgreSQL by replacing `src/db/connection.js` and adapting SQL bindings.
