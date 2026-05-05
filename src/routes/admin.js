const express = require('express');
const { getRestaurants, getRestaurantById, getMenuByRestaurant, updateRestaurant, replaceMenu } = require('../services/restaurantService');
const { listOrders } = require('../services/orderService');

const router = express.Router();

router.get('/', (req, res) => {
  const restaurants = getRestaurants();
  const orders = listOrders();
  res.render('dashboard', { restaurants, orders });
});

router.get('/restaurant/:id', (req, res) => {
  const restaurant = getRestaurantById(Number(req.params.id));
  if (!restaurant) return res.status(404).send('Restaurant not found');
  const menu = getMenuByRestaurant(restaurant.id);
  res.render('restaurant', { restaurant, menu });
});

router.post('/restaurant/:id', (req, res) => {
  const restaurantId = Number(req.params.id);
  const payload = {
    name: req.body.name,
    staff_whatsapp: req.body.staff_whatsapp,
    delivery_areas: req.body.delivery_areas.split(',').map((x) => x.trim()).filter(Boolean),
    delivery_charges: JSON.parse(req.body.delivery_charges_json || '{}'),
    faqs: JSON.parse(req.body.faqs_json || '[]')
  };

  const menu = [];
  const names = Array.isArray(req.body.menu_name) ? req.body.menu_name : [req.body.menu_name];
  const descriptions = Array.isArray(req.body.menu_description) ? req.body.menu_description : [req.body.menu_description];
  const prices = Array.isArray(req.body.menu_price) ? req.body.menu_price : [req.body.menu_price];

  names.forEach((name, idx) => {
    if (name && prices[idx]) menu.push({ name, description: descriptions[idx], price: Number(prices[idx]) });
  });

  updateRestaurant(restaurantId, payload);
  replaceMenu(restaurantId, menu);
  res.redirect(`/admin/restaurant/${restaurantId}`);
});

module.exports = router;
