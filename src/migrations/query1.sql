
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  bill_number TEXT,
  total_amount NUMERIC,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id),
  item_name TEXT,
  quantity INTEGER,
  weight NUMERIC,
  price NUMERIC,
  total NUMERIC
);

ALTER TABLE transactions
ADD COLUMN purchase_id UUID REFERENCES purchases(id);