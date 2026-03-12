-- Eksik Tabloların Oluşturulması

-- 1. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    username TEXT,
    title TEXT,
    message TEXT,
    status TEXT DEFAULT 'open', -- open, answered, closed
    admin_reply TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Subscribers Table
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Mining Items Table
CREATE TABLE IF NOT EXISTS mining_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DOUBLE PRECISION DEFAULT 0,
    hash_rate DOUBLE PRECISION DEFAULT 0,
    type TEXT DEFAULT 'GPU', -- GPU, ASIC
    rarity TEXT DEFAULT 'common',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Game Events Table
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'multiplier',
    multiplier DOUBLE PRECISION DEFAULT 1.0,
    duration_hours INTEGER DEFAULT 24,
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    reward_btc DOUBLE PRECISION DEFAULT 0,
    reward_tp INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES auth.users(id),
    title TEXT,
    body TEXT,
    type TEXT DEFAULT 'info', -- info, success, warning
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Realtime Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE subscribers;
ALTER PUBLICATION supabase_realtime ADD TABLE mining_items;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE promo_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- RLS Policies (Basic Admin/User Access)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON support_tickets FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND "isAdmin" = true));

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = target_id);
CREATE POLICY "Admins can manage all notifications" ON notifications FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND "isAdmin" = true));

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view subscribers" ON subscribers FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND "isAdmin" = true));

ALTER TABLE mining_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view mining items" ON mining_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage mining items" ON mining_items FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND "isAdmin" = true));

ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view game events" ON game_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage game events" ON game_events FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND "isAdmin" = true));

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage promo codes" ON promo_codes FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND "isAdmin" = true));
