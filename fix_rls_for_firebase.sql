-- Supabase RLS Politikalarını Firebase Auth ile Uyumlu Hale Getir (Düzeltilmiş Tablo İsimleri)
-- Firebase Auth UID'lerini 'anon' rolü üzerinden kabul etmek için politikaları esnetiyoruz.

-- Row Level Security'yi kapat (Veya politikaları herkese aç)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace DISABLE ROW LEVEL SECURITY; -- market_listings -> marketplace olarak düzeltildi
ALTER TABLE guilds DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Not: Güvenlik için ileride Firebase JWT -> Supabase JWT bridge kurulmalıdır.
-- Şu anki aşamada uygulamanın çalışması için RLS devre dışı bırakıldı.
