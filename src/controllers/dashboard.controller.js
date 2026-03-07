import pool from "../config/db.js";

export const getDashboard = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT

      /* Outstanding Amount */
      COALESCE(
        SUM(
          CASE 
            WHEN t.type = 'RECEIVED' THEN t.amount
            WHEN t.type = 'GIVEN' THEN -t.amount
          END
        ),0
      )::INTEGER AS outstanding_amount,

      /* Today Sales */
      COALESCE(
        SUM(
          CASE
            WHEN t.type = 'GIVEN'
            AND DATE(t.created_at) = CURRENT_DATE
            THEN t.amount
          END
        ),0
      )::INTEGER AS today_sales,

      /* Total Active Customers */
      (
        SELECT COUNT(*)
        FROM customers
      )::INTEGER AS total_customers,

      /* Inventory Items */
      (
        SELECT COUNT(*)
        FROM inventory
      )::INTEGER AS inventory_items,

      /* This Month Collection */
      COALESCE(
        SUM(
          CASE
            WHEN t.type = 'RECEIVED'
            AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
            THEN t.amount
          END
        ),0
      )::INTEGER AS month_collection,

      /* This Month Sales */
      COALESCE(
        SUM(
          CASE
            WHEN t.type = 'GIVEN'
            AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
            THEN t.amount
          END
        ),0
      )::INTEGER AS month_sales,

      /* This Month Credit */
      COALESCE(
        SUM(
          CASE
            WHEN t.type = 'GIVEN'
            AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
            THEN t.amount
          END
        ),0
      )
      -
      COALESCE(
        SUM(
          CASE
            WHEN t.type = 'RECEIVED'
            AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
            THEN t.amount
          END
        ),0
      )::INTEGER AS month_credit

      FROM transactions t
    `);

    console.log("result", result)

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};