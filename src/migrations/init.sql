CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('GIVEN','RECEIVED')),
  amount NUMERIC NOT NULL,
  note TEXT,
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  weight NUMERIC,
  quantity INTEGER,
  making_charge NUMERIC,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);