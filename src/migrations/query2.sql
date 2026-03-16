ALTER TABLE transactions
ADD COLUMN purchase_item_id INTEGER;


ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_purchase_item
FOREIGN KEY (purchase_item_id)
REFERENCES purchase_items(id)
ON DELETE SET NULL;


ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_purchase
FOREIGN KEY (purchase_id)
REFERENCES purchases(id)
ON DELETE SET NULL;


ALTER TABLE transactions
ADD COLUMN transaction_source VARCHAR DEFAULT 'BILL';

ALTER TABLE transactions
ADD CONSTRAINT chk_transaction_reference
CHECK (
    purchase_id IS NOT NULL
    OR purchase_item_id IS NOT NULL
);