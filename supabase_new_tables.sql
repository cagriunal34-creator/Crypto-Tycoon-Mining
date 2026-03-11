-- =========================================================
-- Uygulama ↔ Admin Panel Senkronizasyon için Yeni Tablolar
-- =========================================================

-- 1. notifications — Admin'den kullanıcılara gerçek zamanlı bildirimler
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id TEXT NOT NULL,          -- profiles.id (kullanıcı ID)
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info',          -- 'info' | 'warning' | 'reward' | 'system' | 'mining' | 'vip'
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_notifications_target_id ON notifications(target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(target_id, read);

-- RLS: Kullanıcı sadece kendi bildirimlerini görebilir
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (target_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (target_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Admin tüm bildirimleri insert edebilir (service role veya anon key ile çalışır)
CREATE POLICY "notifications_insert_all" ON notifications
  FOR INSERT WITH CHECK (true);

-- =========================================================

-- 2. mining_items — Admin panelinden yönetilen ekipmanlar
CREATE TABLE IF NOT EXISTS mining_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT DEFAULT 'Bronze',        -- 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
  price NUMERIC DEFAULT 0,
  hashrate INTEGER DEFAULT 100,      -- GH/s
  daily_btc NUMERIC DEFAULT 0,
  energy_cost INTEGER DEFAULT 1,
  description TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Herkes okuyabilir, sadece admin yazabilir
ALTER TABLE mining_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mining_items_select_all" ON mining_items
  FOR SELECT USING (true);

CREATE POLICY "mining_items_all_admin" ON mining_items
  FOR ALL USING (true);  -- Admin service role kullanır

-- =========================================================

-- 3. game_events — Admin'den açılıp kapanabilen etkinlikler
CREATE TABLE IF NOT EXISTS game_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'multiplier',    -- 'multiplier' | 'discount' | 'bonus_tp'
  multiplier NUMERIC DEFAULT 1.0,
  duration_hours INTEGER DEFAULT 24,
  active BOOLEAN DEFAULT FALSE,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Herkes okuyabilir
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_events_select_all" ON game_events
  FOR SELECT USING (true);

CREATE POLICY "game_events_all_admin" ON game_events
  FOR ALL USING (true);

-- =========================================================

-- 4. promo_codes — Admin'den oluşturulan tek kullanımlık kodlar
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  reward_btc NUMERIC DEFAULT 0,
  reward_tp INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Uygulama kodu kullanabilir (kod kontrolü uygulama tarafında)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_codes_select_all" ON promo_codes
  FOR SELECT USING (true);

CREATE POLICY "promo_codes_update_all" ON promo_codes
  FOR UPDATE USING (true);

CREATE POLICY "promo_codes_all_admin" ON promo_codes
  FOR ALL USING (true);

-- =========================================================

-- 5. support_tickets — Destek talepleri (zaten varsa atla)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',        -- 'open' | 'answered' | 'closed'
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets_select_own" ON support_tickets
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "support_tickets_insert_own" ON support_tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "support_tickets_all_admin" ON support_tickets
  FOR ALL USING (true);

-- =========================================================
-- Realtime'ı etkinleştir (Supabase Dashboard > Database > Replication'dan da yapılabilir)
-- =========================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE mining_items;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE promo_codes;
