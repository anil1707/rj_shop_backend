import pool from "../config/db.js";

export const getDashboard = async (req, res) => {
  try {

    const result = await pool.query(`
      WITH purchase_stats AS (
        SELECT
          COALESCE(SUM(total_amount),0) AS total_sales,
          COALESCE(SUM(CASE WHEN DATE(created_at)=CURRENT_DATE THEN total_amount END),0) AS today_sales,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',CURRENT_DATE) THEN total_amount END),0) AS month_sales
        FROM purchases
      ),

      payment_stats AS (
        SELECT
          COALESCE(SUM(amount),0) AS total_collection,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',CURRENT_DATE) THEN amount END),0) AS month_collection
        FROM transactions
        WHERE type='RECEIVED'
      ),

      counts AS (
        SELECT
          (SELECT COUNT(*) FROM customers) AS total_customers,
          (SELECT COUNT(*) FROM inventory) AS inventory_items
      )

      SELECT
        (p.total_sales - pay.total_collection)::INTEGER AS outstanding_amount,
        p.today_sales::INTEGER AS today_sales,
        c.total_customers::INTEGER,
        c.inventory_items::INTEGER,
        pay.month_collection::INTEGER,
        p.month_sales::INTEGER,
        (p.month_sales - pay.month_collection)::INTEGER AS month_credit

      FROM purchase_stats p
      CROSS JOIN payment_stats pay
      CROSS JOIN counts c
    `);

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};