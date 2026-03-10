-- 🚨 GÜÇLENDİRİLMİŞ NİHAİ SCRIPT: Kısıtlamaları otomatik bulan ve kaldıran sürüm.
-- Bu script, isimleri ne olursa olsun profiles tablosundaki tüm engelleri temizler.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Profiles tablosuna bağlı tüm Foreign Key'leri ve Politikaları otomatik temizle
    FOR r IN (
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE table_name IN ('profiles', 'marketplace', 'guilds', 'withdrawals', 'logs', 'transactions')
        AND constraint_type = 'FOREIGN KEY'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
    END LOOP;

    -- 2. Tüm RLS Politikalarını kaldır
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'settings', 'marketplace', 'guilds', 'withdrawals', 'logs', 'transactions')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. KOLON TİPLERİNİ DEĞİŞTİR (UUID -> TEXT)
-- Tip dönüşümü sırasında verileri korumak için ::text kullanıyoruz.
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE profiles ALTER COLUMN "btcBalance" TYPE DOUBLE PRECISION; -- Ensure precision
ALTER TABLE profiles ALTER COLUMN "referredBy" TYPE TEXT USING "referredBy"::text;

ALTER TABLE marketplace ALTER COLUMN "seller_id" TYPE TEXT USING "seller_id"::text;
ALTER TABLE guilds ALTER COLUMN "leader_id" TYPE TEXT USING "leader_id"::text;
ALTER TABLE withdrawals ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE logs ALTER COLUMN admin_id TYPE TEXT USING admin_id::text;
ALTER TABLE transactions ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4. POLİTİKALARI GERİ YÜKLE (Yeni TEXT formatına ve auth.uid()::text'e uyumlu)
-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));

-- SETTINGS
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);
CREATE POLICY "Settings are manageable by admins" ON settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));

-- MARKETPLACE
CREATE POLICY "Anyone can view market" ON marketplace FOR SELECT USING (true);
CREATE POLICY "Users can manage own listings" ON marketplace FOR ALL USING (auth.uid()::text = "seller_id");
CREATE POLICY "Admins can manage market" ON marketplace FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));

-- GUILDS
CREATE POLICY "Guilds are viewable by everyone" ON guilds FOR SELECT USING (true);
CREATE POLICY "Admins can manage guilds" ON guilds FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));

-- WITHDRAWALS
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Admins can manage all withdrawals" ON withdrawals FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));

-- LOGS
CREATE POLICY "Admins can view logs" ON logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));
CREATE POLICY "Admins can insert logs" ON logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));

-- TRANSACTIONS
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND "isAdmin" = true));
