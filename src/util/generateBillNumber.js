import pool from "../config/db.js";
export const generateBillNumber = async () => {
  const result = await pool.query(
    `
    SELECT bill_number
    FROM purchases
    WHERE bill_number IS NOT NULL
    ORDER BY bill_number DESC
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    return "RJ-0001";
  }

  const lastBill = result.rows[0].bill_number;

  const lastNumber = parseInt(lastBill.split("-")[1]);

  const nextNumber = lastNumber + 1;

  return `RJ-${String(nextNumber).padStart(4, "0")}`;
};