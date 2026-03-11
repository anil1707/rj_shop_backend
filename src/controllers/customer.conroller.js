import pool from "../config/db.js";

export const createCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if(!phone || !name){
       return res.status(400).json({message: "Phone and Name is required field"})
    }

    if(phone?.length < 10){
        return res.status(400).json({message: "Phone number should be of length 10"})
    }

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

// export const getCustomers = async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT 
//         c.id,
//         c.name,
//         c.phone,
//         c.created_at,

//         COALESCE(
//           SUM(
//             CASE 
//               WHEN t.type = 'RECEIVED' THEN t.amount
//               WHEN t.type = 'GIVEN' THEN -t.amount
//             END
//           ), 0
//         )::INTEGER AS balance,

//         CASE 
//           WHEN COUNT(t.id) = 0 THEN true
//           ELSE false
//         END AS is_new_user

//       FROM customers c
//       LEFT JOIN transactions t
//       ON c.id = t.customer_id

//       GROUP BY c.id
//       ORDER BY c.created_at DESC
//     `);

//     res.json(result.rows);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getCustomers = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.created_at,

        COALESCE(p.total_amount,0) -
        COALESCE(t.total_paid,0) AS balance,

        CASE 
          WHEN p.total_amount IS NULL THEN true
          ELSE false
        END AS is_new_user

      FROM customers c

      LEFT JOIN (
        SELECT 
          customer_id,
          SUM(total_amount) AS total_amount
        FROM purchases
        GROUP BY customer_id
      ) p
      ON c.id = p.customer_id

      LEFT JOIN (
        SELECT 
          pr.customer_id,
          SUM(t.amount) AS total_paid
        FROM transactions t
        JOIN purchases pr
        ON t.purchase_id = pr.id
        WHERE t.type = 'RECEIVED'
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
      SUM(p.total_amount) -
      COALESCE(
        SUM(
          CASE
            WHEN t.type='RECEIVED' THEN t.amount
          END
        ),0
      ) AS balance

      FROM purchases p

      LEFT JOIN transactions t
      ON p.id = t.purchase_id

      WHERE p.customer_id=$1
      `,
      [id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};