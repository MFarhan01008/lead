const db = require('../db/connection');

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

function getRestaurants() {
  return db.prepare('SELECT * FROM restaurants ORDER BY name').all().map((r) => ({
    ...r,
    delivery_areas: parseJson(r.delivery_areas, []),
    delivery_charges: parseJson(r.delivery_charges, {}),
    faqs: parseJson(r.faqs, [])
  }));
}

function getRestaurantById(id) {
  const r = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
  if (!r) return null;
  return {
    ...r,
    delivery_areas: parseJson(r.delivery_areas, []),
    delivery_charges: parseJson(r.delivery_charges, {}),
    faqs: parseJson(r.faqs, [])
  };
}

function getMenuByRestaurant(restaurantId) {
  return db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY name').all(restaurantId);
}

function updateRestaurant(restaurantId, payload) {
  db.prepare(`
    UPDATE restaurants
    SET name = ?, staff_whatsapp = ?, delivery_areas = ?, delivery_charges = ?, faqs = ?
    WHERE id = ?
  `).run(
    payload.name,
    payload.staff_whatsapp,
    JSON.stringify(payload.delivery_areas),
    JSON.stringify(payload.delivery_charges),
    JSON.stringify(payload.faqs),
    restaurantId
  );
}

function replaceMenu(restaurantId, items) {
  db.prepare('DELETE FROM menu_items WHERE restaurant_id = ?').run(restaurantId);
  const stmt = db.prepare('INSERT INTO menu_items (restaurant_id, name, description, price) VALUES (?, ?, ?, ?)');
  items.forEach((item) => stmt.run(restaurantId, item.name, item.description || '', Number(item.price)));
}

module.exports = {
  getRestaurants,
  getRestaurantById,
  getMenuByRestaurant,
  updateRestaurant,
  replaceMenu
};
