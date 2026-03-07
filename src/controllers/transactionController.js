import pool from "../config/db.js";

export const addTransaction = async (req, res) => {
  try {
    const { customerId, type, amount, note, paymentMethod } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions 
      (customer_id,type,amount,note,payment_method)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [customerId, type, amount, note, paymentMethod]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCustomerTransactions = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      "SELECT * FROM transactions WHERE customer_id=$1 ORDER BY created_at DESC",
      [customerId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCustomerBalance = async (req, res) => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `
      SELECT 
      COALESCE(
        SUM(CASE WHEN type='RECEIVED' THEN amount ELSE 0 END),0
      ) -
      COALESCE(
        SUM(CASE WHEN type='GIVEN' THEN amount ELSE 0 END),0
      ) AS balance
      FROM transactions
      WHERE customer_id=$1
      `,
      [customerId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};