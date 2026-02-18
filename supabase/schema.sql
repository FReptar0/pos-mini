-- ============================================
-- TABLAS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  sku text,
  category text DEFAULT 'General',
  cost_price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  min_stock integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  type text CHECK (type IN ('individual', 'bulk_daily')) DEFAULT 'individual',
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]',
  total_revenue numeric(10,2) DEFAULT 0,
  total_cost numeric(10,2) DEFAULT 0,
  total_profit numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  type text CHECK (type IN ('income','expense','sale','restock')) NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'General',
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  related_sale_id uuid REFERENCES sales(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users UNIQUE NOT NULL,
  business_name text DEFAULT 'Mi Negocio',
  currency text DEFAULT 'MXN',
  accent_color text DEFAULT '#10b981'
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_products" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_sales" ON sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_cash" ON cash_movements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_settings" ON settings FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: updated_at automático en products
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
