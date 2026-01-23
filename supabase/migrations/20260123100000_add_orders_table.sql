-- Orders table for P24 payment integration
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,

    -- Customer info
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),

    -- Shipping address
    shipping_street VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(10) NOT NULL,

    -- Order details
    items JSONB NOT NULL,
    subtotal INTEGER NOT NULL, -- in grosze (1/100 PLN)
    shipping_cost INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL,

    -- P24 specific
    p24_order_id INTEGER,
    p24_token VARCHAR(100),

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, payment_started, paid, verified, cancelled, refunded

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_email ON orders(customer_email);

-- RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow insert from Edge Functions (service role)
CREATE POLICY "Service role can manage orders" ON orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();
