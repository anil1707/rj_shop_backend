import pool from "../config/db.js";

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!phone || !name) {
      return res.status(400).json({
        message: "Phone and Name is required field"
      });
    }

    if (phone.length < 10) {
      return res.status(400).json({
        message: "Phone number should be of length 10"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO customers (name, phone, address)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, phone, address || null]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};

export const updateCustomer = async (req, res) => {
  try {

    const { id } = req.params;
    const { name, phone, address } = req.body;

    console.log("bodsdf", req?.body)

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone are required"
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits"
      });
    }

    const result = await pool.query(
      `
      UPDATE customers
      SET
        name = $1,
        phone = $2,
        address = $3
      WHERE id = $4
      RETURNING *
      `,
      [name, phone, address || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      message: "Customer updated successfully",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};

export const getCustomers = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.address,
        c.created_at,

        COALESCE(p.total_amount,0) -
        COALESCE(t.total_paid,0) AS balance,

        CASE 
          WHEN p.total_amount IS NULL THEN true
          ELSE false
        END AS is_new_user

      FROM customers c

      -- total purchases
      LEFT JOIN (
        SELECT 
          customer_id,
          SUM(total_amount) AS total_amount
        FROM purchases
        GROUP BY customer_id
      ) p
      ON c.id = p.customer_id

      -- total payments (bill + item payments)
      LEFT JOIN (
        SELECT 
          pr.customer_id,
          SUM(t.amount) AS total_paid
        FROM transactions t

        LEFT JOIN purchases pr
        ON (
              t.purchase_id = pr.id
              OR t.purchase_item_id IN (
                  SELECT id
                  FROM purchase_items
                  WHERE purchase_id = pr.id
              )
           )

        WHERE t.is_auto = false

        GROUP BY pr.customer_id
      ) t
      ON c.id = t.customer_id

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

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.address,

        COALESCE(p.total_amount,0) -
        COALESCE(t.total_paid,0) AS balance,

        CASE 
          WHEN p.total_amount IS NULL THEN true
          ELSE false
        END AS is_new_user

      FROM customers c

      -- total purchases
      LEFT JOIN (
        SELECT 
          customer_id,
          SUM(total_amount) AS total_amount
        FROM purchases
        GROUP BY customer_id
      ) p
      ON c.id = p.customer_id

      -- total payments (bill + item payments)
      LEFT JOIN (
        SELECT 
          pr.customer_id,
          SUM(t.amount) AS total_paid
        FROM transactions t

        LEFT JOIN purchases pr
        ON (
              t.purchase_id = pr.id
              OR t.purchase_item_id IN (
                  SELECT id
                  FROM purchase_items
                  WHERE purchase_id = pr.id
              )
           )

        WHERE t.is_auto = false

        GROUP BY pr.customer_id
      ) t
      ON c.id = t.customer_id

      WHERE c.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};