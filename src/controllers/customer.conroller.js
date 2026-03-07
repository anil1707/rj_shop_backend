import pool from "../config/db.js";

export const createCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const result = await pool.query(
      "INSERT INTO customers (name, phone) VALUES ($1,$2) RETURNING *",
      [name, phone]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.created_at,

        COALESCE(
          SUM(
            CASE 
              WHEN t.type = 'RECEIVED' THEN t.amount
              WHEN t.type = 'GIVEN' THEN -t.amount
            END
          ), 0
        )::INTEGER AS balance,

        CASE 
          WHEN COUNT(t.id) = 0 THEN true
          ELSE false
        END AS is_new_user

      FROM customers c
      LEFT JOIN transactions t
      ON c.id = t.customer_id

      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );

    const transactions = await pool.query(
      `SELECT * FROM transactions 
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    const balanceResult = await pool.query(`
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN type = 'GIVEN' THEN amount
              WHEN type = 'RECEIVED' THEN -amount
            END
          ),0
        ) AS balance
      FROM transactions
      WHERE customer_id = $1
    `, [id]);

    res.json({
      customer: customer.rows[0],
      transactions: transactions.rows,
      balance: balanceResult.rows[0].balance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};