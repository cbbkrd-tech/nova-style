-- Add shipping method and email tracking fields to orders table

-- Add shipping method column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(20) DEFAULT 'inpost';

-- Add email tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_email_sent BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN orders.shipping_method IS 'Shipping method: inpost (courier) or pickup (personal pickup)';
COMMENT ON COLUMN orders.customer_email_sent IS 'Whether order confirmation email was sent to customer';
COMMENT ON COLUMN orders.owner_email_sent IS 'Whether order notification email was sent to store owner';
