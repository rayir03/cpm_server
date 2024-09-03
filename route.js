// routes.js
const express = require('express');
const pool = require('./db'); // Importa la conexión de la base de datos

const router = express.Router();


// Ruta para obtener información completa de usuarios
router.get('/user-details', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
            u.user_id,
            u.username,
            u.role,
            p.location_id,
            p.location_type,
            w.number_of_boxes,
            w.total_minutes,
            w.average_boxes_per_minute
        FROM 
            users u
        JOIN 
            weekly_operations w ON u.user_id = w.user_id
        JOIN 
            locations p ON w.product_id = p.location_id;
      `);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener la información de los usuarios' });
    }
  });

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener un usuario por ID
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Crear un nuevo usuario
router.post('/users', async (req, res) => {
  const { username, role } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, role) VALUES ($1, $2) RETURNING *',
      [username, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Actualizar un usuario existente
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, role = $2 WHERE user_id = $3 RETURNING *',
      [username, role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar un usuario
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Obtener operaciones semanales por producto
router.get('/weekly-operations/:product_id', async (req, res) => {
  const { product_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        u.username,
        p.product_type,
        wo.week_start,
        SUM(wo.number_of_boxes) AS total_boxes,
        SUM(wo.total_minutes) AS total_minutes,
        AVG(wo.average_boxes_per_minute) AS average_boxes_per_minute
      FROM
        weekly_operations wo
      JOIN users u ON wo.user_id = u.user_id
      JOIN products p ON wo.product_id = p.product_id
      WHERE wo.product_id = $1
      GROUP BY u.username, p.product_type, wo.week_start
      ORDER BY wo.week_start;`,
      [product_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener operaciones semanales' });
  }
});

// Crear una nueva operación semanal
router.post('/weekly-operations', async (req, res) => {
    const { user_id, product_id, week_start, number_of_boxes, total_minutes } = req.body;
  
    // Validar datos recibidos
    if (
      typeof user_id !== 'number' || 
      typeof product_id !== 'number' ||
      typeof number_of_boxes !== 'number' ||
      typeof total_minutes !== 'number' ||
      !Date.parse(week_start)
    ) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
  
    // Manejo de división por cero
    const average_boxes_per_minute = total_minutes === 0 ? null : number_of_boxes / total_minutes;
  
    try {
      const result = await pool.query(
        `INSERT INTO weekly_operations (user_id, product_id, week_start, number_of_boxes, total_minutes, average_boxes_per_minute)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [user_id, product_id, week_start, number_of_boxes, total_minutes, average_boxes_per_minute]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error al insertar en weekly_operations:', err);
      res.status(500).json({ error: 'Error al crear operación semanal' });
    }
  });

module.exports = router;
