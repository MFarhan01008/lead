const db = require('./connection');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      staff_whatsapp TEXT NOT NULL,
      delivery_areas TEXT NOT NULL,
      delivery_charges TEXT NOT NULL,
      faqs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT,
      order_type TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      customer_phone TEXT NOT NULL,
      state TEXT NOT NULL,
      cart TEXT NOT NULL,
      draft_order TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(restaurant_id, customer_phone),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) AS count FROM restaurants').get().count;
  if (count === 0) {
    const insertRestaurant = db.prepare(`
      INSERT INTO restaurants (name, staff_whatsapp, delivery_areas, delivery_charges, faqs)
      VALUES (?, ?, ?, ?, ?)
    `);

    const restaurantId = insertRestaurant.run(
      'Spice Garden',
      '+15550000001',
      JSON.stringify(['Downtown', 'Riverside', 'Midtown']),
      JSON.stringify({ Downtown: 3, Riverside: 5, Midtown: 4 }),
      JSON.stringify([
        { q: 'What are your opening hours?', a: '10:00 AM - 11:00 PM daily.' },
        { q: 'Do you have vegan options?', a: 'Yes, we have multiple vegan curries and wraps.' }
      ])
    ).lastInsertRowid;

    const insertMenu = db.prepare('INSERT INTO menu_items (restaurant_id, name, description, price) VALUES (?, ?, ?, ?)');
    [
      ['Paneer Wrap', 'Grilled paneer, mint chutney, onions', 8.5],
      ['Chicken Biryani', 'Aromatic basmati rice with chicken', 13.0],
      ['Chana Masala', 'Spiced chickpea curry', 9.0]
    ].forEach((item) => insertMenu.run(restaurantId, item[0], item[1], item[2]));
  }
}

initDb();
console.log('Database initialized.');
