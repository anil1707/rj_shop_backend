import pool from "../config/db.js";

export const addInventory = async (req, res) => {
  try {
    const { name, category, weight, quantity, makingCharge, note } = req.body;

    const result = await pool.query(
      `INSERT INTO inventory
      (name,category,weight,quantity,making_charge,note)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [name, category, weight, quantity, makingCharge, note]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM inventory");

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};