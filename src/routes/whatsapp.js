const express = require('express');
const db = require('../db/connection');
const { getRestaurantById, getMenuByRestaurant } = require('../services/restaurantService');
const { createOrder } = require('../services/orderService');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const router = express.Router();

function getConversation(restaurantId, customerPhone) {
  return db.prepare('SELECT * FROM conversations WHERE restaurant_id = ? AND customer_phone = ?').get(restaurantId, customerPhone);
}

function saveConversation(restaurantId, customerPhone, state, cart, draftOrder) {
  db.prepare(`
    INSERT INTO conversations (restaurant_id, customer_phone, state, cart, draft_order, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(restaurant_id, customer_phone)
    DO UPDATE SET state=excluded.state, cart=excluded.cart, draft_order=excluded.draft_order, updated_at=excluded.updated_at
  `).run(restaurantId, customerPhone, state, JSON.stringify(cart), JSON.stringify(draftOrder), new Date().toISOString());
}

function reply(res, message) {
  return res.json({ reply: message });
}

router.post('/incoming', (req, res) => {
  const { restaurantId, fromPhone, message } = req.body;
  if (!restaurantId || !fromPhone || !message) return res.status(400).json({ error: 'restaurantId, fromPhone, message are required' });

  const restaurant = getRestaurantById(Number(restaurantId));
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  const menu = getMenuByRestaurant(restaurant.id);
  const lower = message.trim().toLowerCase();
  const existing = getConversation(restaurant.id, fromPhone);
  const state = existing ? existing.state : 'start';
  const cart = existing ? JSON.parse(existing.cart) : [];
  const draft = existing ? JSON.parse(existing.draft_order) : {};

  if (lower === 'menu') {
    const msg = menu.map((i) => `- ${i.name}: $${i.price.toFixed(2)}`).join('\n');
    saveConversation(restaurant.id, fromPhone, state, cart, draft);
    return reply(res, `Menu for ${restaurant.name}:\n${msg}\n\nTo order: type \"order <item name>\"`);
  }

  if (lower.startsWith('faq')) {
    const faqText = restaurant.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
    return reply(res, faqText || 'No FAQs available.');
  }

  if (lower.startsWith('order ')) {
    const itemName = message.slice(6).trim().toLowerCase();
    const item = menu.find((m) => m.name.toLowerCase() === itemName);
    if (!item) return reply(res, 'Item not found. Type MENU to see available items.');
    cart.push({ item_id: item.id, name: item.name, price: item.price, qty: 1 });
    saveConversation(restaurant.id, fromPhone, 'collect_name', cart, draft);
    return reply(res, `Added ${item.name}. Please share your full name.`);
  }

  if (state === 'collect_name') {
    draft.customer_name = message.trim();
    saveConversation(restaurant.id, fromPhone, 'collect_phone', cart, draft);
    return reply(res, 'Please share your phone number.');
  }

  if (state === 'collect_phone') {
    draft.customer_phone = message.trim();
    saveConversation(restaurant.id, fromPhone, 'collect_type', cart, draft);
    return reply(res, 'Delivery or Pickup?');
  }

  if (state === 'collect_type') {
    const type = lower.includes('pick') ? 'pickup' : 'delivery';
    draft.order_type = type;
    if (type === 'pickup') {
      draft.customer_address = 'Pickup';
      saveConversation(restaurant.id, fromPhone, 'confirm', cart, draft);
      return reply(res, 'Type CONFIRM to place order.');
    }
    saveConversation(restaurant.id, fromPhone, 'collect_address', cart, draft);
    return reply(res, `Please provide delivery address. Serviceable areas: ${restaurant.delivery_areas.join(', ')}`);
  }

  if (state === 'collect_address') {
    draft.customer_address = message.trim();
    saveConversation(restaurant.id, fromPhone, 'confirm', cart, draft);
    return reply(res, 'Type CONFIRM to place order.');
  }

  if (state === 'confirm' && lower === 'confirm') {
    const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    const deliveryCharge = draft.order_type === 'delivery' ? 5 : 0;
    const total = subtotal + deliveryCharge;
    const order = createOrder({
      restaurant_id: restaurant.id,
      customer_name: draft.customer_name,
      customer_phone: draft.customer_phone,
      customer_address: draft.customer_address,
      order_type: draft.order_type,
      items: cart,
      total
    });

    db.prepare('DELETE FROM conversations WHERE restaurant_id = ? AND customer_phone = ?').run(restaurant.id, fromPhone);
    const summary = `Order #${order.id}\nName: ${draft.customer_name}\nPhone: ${draft.customer_phone}\nType: ${draft.order_type}\nAddress: ${draft.customer_address}\nItems: ${cart.map((i) => `${i.name} x${i.qty}`).join(', ')}\nTotal: $${total.toFixed(2)}`;
    sendWhatsAppMessage(restaurant.staff_whatsapp, `New order for ${restaurant.name}\n${summary}`);
    return reply(res, `Thanks! Your order is placed.\n${summary}`);
  }

  return reply(res, 'Try: MENU, FAQ, ORDER <item name>, or CONFIRM');
});

module.exports = router;
