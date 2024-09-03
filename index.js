// server.js
const express = require('express');
const app = express();
const routes = require('./route'); 
const cors = require('cors');

app.use(express.json());
app.use(cors()); // Middleware para parsear JSON
app.use('/api', routes); // Usa las rutas bajo el prefijo /api

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
