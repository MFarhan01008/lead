const express = require('express');
const path = require('path');
require('./db/init');

const whatsappRoutes = require('./routes/whatsapp');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => res.redirect('/admin'));
app.use('/admin', adminRoutes);
app.use('/whatsapp', whatsappRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
