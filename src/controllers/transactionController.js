import pool from "../config/db.js";


// CREATE TRANSACTION
export const createTransaction = async (req, res) => {
  try {

    const { purchase_id, purchase_item_id, amount, payment_method, note } = req.body;

    if (!purchase_id && !purchase_item_id) {
      return res.status(400).json({
        success: false,
        message: "purchase_id or purchase_item_id is required"
      });
    }

    // ITEM PAYMENT
    if (purchase_item_id) {

      const result = await pool.query(
        `
        INSERT INTO transactions
        (purchase_id, purchase_item_id, amount, payment_method, note, is_auto)
        VALUES ($1,$2,$3,$4,$5,false)
        RETURNING *
        `,
        [purchase_id || null, purchase_item_id, amount, payment_method, note]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }

    // BILL PAYMENT
    if (purchase_id) {

      // create main transaction
      const billTxn = await pool.query(
        `
        INSERT INTO transactions
        (purchase_id, amount, payment_method, note, is_auto)
        VALUES ($1,$2,$3,$4,false)
        RETURNING *
        `,
        [purchase_id, amount, payment_method, note]
      );

      // get items
      const items = await pool.query(
        `
        SELECT 
          pi.id,
          pi.total,
          COALESCE(SUM(t.amount),0) as paid
        FROM purchase_items pi
        LEFT JOIN transactions t
        ON t.purchase_item_id = pi.id
        WHERE pi.purchase_id = $1
        GROUP BY pi.id
        `,
        [purchase_id]
      );

      // create auto transactions for remaining item dues
      for (const item of items.rows) {

        const remaining = Number(item.total) - Number(item.paid);

        if (remaining > 0) {

          await pool.query(
            `
            INSERT INTO transactions
            (purchase_id, purchase_item_id, amount, payment_method, note, is_auto)
            VALUES ($1,$2,$3,$4,'Auto settlement',true)
            `,
            [purchase_id, item.id, remaining, payment_method]
          );

        }

      }

      return res.status(201).json({
        success: true,
        message: "Full payment completed",
        data: billTxn.rows[0]
      });

    }

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};



// GET TRANSACTIONS
export const getTransactions = async (req, res) => {
  try {
    const { purchase_id } = req.query;

    if (!purchase_id) {
      return res.status(400).json({
        success: false,
        message: "purchase_id is required"
      });
    }

    // 1️⃣ PURCHASE SUMMARY
    const purchaseSummary = await pool.query(
      `
      SELECT 
          p.id AS bill_id,
          p.bill_number,
          p.total_amount,
          COALESCE(SUM(t.amount),0) AS paid_amount,
          p.total_amount - COALESCE(SUM(t.amount),0) AS due_amount
      FROM purchases p
      LEFT JOIN transactions t
        ON (
              t.purchase_id = p.id
              OR t.purchase_item_id IN (
                SELECT id
                FROM purchase_items
                WHERE purchase_id = p.id
              )
           )
        AND t.is_auto = false
      WHERE p.id = $1
      GROUP BY p.id, p.bill_number, p.total_amount
      `,
      [purchase_id]
    );

    // 2️⃣ ITEM SUMMARY
    const itemSummary = await pool.query(
      `
      SELECT 
          pi.id,
          pi.item_name,
          pi.weight,
          pi.quantity,
          pi.total,
          COALESCE(SUM(t.amount),0) AS paid_amount,
          pi.total - COALESCE(SUM(t.amount),0) AS due_amount
      FROM purchase_items pi
      LEFT JOIN transactions t
        ON t.purchase_item_id = pi.id
      WHERE pi.purchase_id = $1
      GROUP BY 
          pi.id,
          pi.item_name,
          pi.weight,
          pi.quantity,
          pi.total
      ORDER BY pi.id
      `,
      [purchase_id]
    );

    // 3️⃣ TRANSACTIONS LIST (hide auto ones)
    const transactions = await pool.query(
      `
      SELECT *
      FROM transactions
      WHERE (
          purchase_id = $1
          OR purchase_item_id IN (
              SELECT id
              FROM purchase_items
              WHERE purchase_id = $1
          )
      )
      AND is_auto = false
      ORDER BY created_at DESC
      `,
      [purchase_id]
    );

    res.json({
      success: true,
      purchase_summary: purchaseSummary.rows[0],
      items: itemSummary.rows,
      transactions: transactions.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};



// TRANSACTION SUMMARY
export const getTransactionSummary = async (req, res) => {
  try {

    const { purchase_id, purchase_item_id } = req.query;

    if (!purchase_id && !purchase_item_id) {
      return res.status(400).json({
        success: false,
        message: "purchase_id or purchase_item_id required"
      });
    }

    let summary;
    let transactions;

    // PURCHASE SUMMARY
    if (purchase_id) {

      summary = await pool.query(
        `
        SELECT
            p.id,
            p.bill_number,
            p.total_amount,
            COALESCE(SUM(t.amount),0) AS paid_amount,
            p.total_amount - COALESCE(SUM(t.amount),0) AS due_amount
        FROM purchases p
        LEFT JOIN transactions t
        ON t.purchase_id = p.id
        WHERE p.id = $1
        GROUP BY p.id
        `,
        [purchase_id]
      );

      transactions = await pool.query(
        `
        SELECT *
        FROM transactions
        WHERE purchase_id = $1
        ORDER BY created_at DESC
        `,
        [purchase_id]
      );

    }

    // ITEM SUMMARY
    if (purchase_item_id) {

      summary = await pool.query(
        `
        SELECT
            pi.id,
            pi.item_name,
            pi.total,
            COALESCE(SUM(t.amount),0) AS paid_amount,
            pi.total - COALESCE(SUM(t.amount),0) AS due_amount
        FROM purchase_items pi
        LEFT JOIN transactions t
        ON t.purchase_item_id = pi.id
        WHERE pi.id = $1
        GROUP BY pi.id
        `,
        [purchase_item_id]
      );

      transactions = await pool.query(
        `
        SELECT *
        FROM transactions
        WHERE purchase_item_id = $1
        ORDER BY created_at DESC
        `,
        [purchase_item_id]
      );

    }

    res.json({
      success: true,
      summary: summary.rows[0],
      transactions: transactions.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};


// Update transaction
export const updateTransaction = async (req, res) => {
  try {

    const { id } = req.params;
    const { amount, payment_method, note } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "amount is required"
      });
    }

    const result = await pool.query(
      `
      UPDATE transactions
      SET
        amount = $1,
        payment_method = $2,
        note = $3
      WHERE id = $4
      RETURNING *
      `,
      [amount, payment_method, note, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.json({
      success: true,
      message: "Transaction updated successfully",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};