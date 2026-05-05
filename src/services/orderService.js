const db = require('../db/connection');

function listOrders() {
  return db.prepare('SELECT * FROM orders ORDER BY datetime(created_at) DESC').all().map((o) => ({
    ...o,
    items: JSON.parse(o.items)
  }));
}

function createOrder(order) {
  const result = db.prepare(`
    INSERT INTO orders (
      restaurant_id, customer_name, customer_phone, customer_address,
      order_type, items, total, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)
  `).run(
    order.restaurant_id,
    order.customer_name,
    order.customer_phone,
    order.customer_address || '',
    order.order_type,
    JSON.stringify(order.items),
    order.total,
    new Date().toISOString()
  );

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
}

module.exports = { listOrders, createOrder };
