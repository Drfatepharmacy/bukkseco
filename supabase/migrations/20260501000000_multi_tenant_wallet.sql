-- Migration: Multi-tenant and Wallet System
-- Date: 2026-05-01

-- 1. Create Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    custom_domain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants are viewable by everyone
CREATE POLICY "Tenants are viewable by everyone" ON tenants
    FOR SELECT USING (true);

-- Only super_admin can modify tenants
-- (Assuming the super_admin check logic exists or will be added)

-- 2. Add tenant_id to existing tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'vendor_profiles' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE vendor_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'rider_profiles' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE rider_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'farmer_profiles' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE farmer_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'meals' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE meals ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE orders ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'group_buys' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE group_buys ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'reservations' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE reservations ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'support_tickets' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE support_tickets ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'campus_activities' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE campus_activities ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'health_tips' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE health_tips ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'landmarks' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE landmarks ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;
END $$;

-- 3. Create Wallets and Transactions
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'NGN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'payment', 'refund', 'reward'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    reference TEXT UNIQUE, -- Paystack reference or internal order ID
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wallets
            WHERE wallets.id = wallet_transactions.wallet_id
            AND wallets.user_id = auth.uid()
        )
    );

-- 4. Insert Default Tenant (UNIBEN)
INSERT INTO tenants (name, slug, primary_color, secondary_color)
VALUES ('University of Benin', 'uniben', '#FFD700', '#4B0082')
ON CONFLICT (slug) DO NOTHING;
