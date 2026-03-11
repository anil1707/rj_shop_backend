import pool from "../config/db.js";
import { generateBillNumber } from "../util/generateBillNumber.js";

// to add new bill/new purchase
export const createPurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    const { customerId, items, totalAmount } = req.body;

    if(!customerId || items?.length < 0 || !totalAmount){
        return res?.status(400).json({message: "Failed to add purchase"})
    }

    await client.query("BEGIN");

    const billNumber = await generateBillNumber();

    const purchaseResult = await client.query(
      `
      INSERT INTO purchases (customer_id, bill_number, total_amount)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [customerId, billNumber, totalAmount]
    );

    const purchaseId = purchaseResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `
        INSERT INTO purchase_items
        (purchase_id,item_name,weight,price,quantity,total)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          purchaseId,
          item.item_name,
          item.weight,
          item.price,
          item.quantity,
          item.total,
        ]
      );
    }

    await client.query("COMMIT");

    res.json(purchaseResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const getCustomerPurchases = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.bill_number,
        p.total_amount,
        p.created_at,

        COALESCE(
          SUM(
            CASE
              WHEN t.type = 'RECEIVED' THEN t.amount
              ELSE 0
            END
          ), 0
        ) AS total_paid,

        p.total_amount -
        COALESCE(
          SUM(
            CASE
              WHEN t.type = 'RECEIVED' THEN t.amount
              ELSE 0
            END
          ), 0
        ) AS remaining_amount

      FROM purchases p

      LEFT JOIN transactions t
      ON p.id = t.purchase_id

      WHERE p.customer_id = $1

      GROUP BY p.id

      ORDER BY p.created_at DESC
      `,
      [id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPurchaseDetails = async (req, res) => {
  try {

    const { id } = req.params;

    const purchase = await pool.query(
      "SELECT * FROM purchases WHERE id=$1",
      [id]
    );

    const items = await pool.query(
      "SELECT * FROM purchase_items WHERE purchase_id=$1",
      [id]
    );

    const transactions = await pool.query(
      "SELECT * FROM transactions WHERE purchase_id=$1 ORDER BY created_at DESC",
      [id]
    );

    res.json({
      purchase: purchase.rows[0],
      items: items.rows,
      transactions: transactions.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};