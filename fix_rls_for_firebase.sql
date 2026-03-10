-- Supabase RLS Politikalarını Firebase Auth ile Uyumlu Hale Getir (Geçici Çözüm)
-- Firebase Auth UID'lerini 'anon' rolü üzerinden kabul etmek için politikaları esnetiyoruz.

-- Row Level Security'yi kapat (Veya politikaları herkese aç)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE guilds DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;

-- Not: Güvenlik için ileride Firebase JWT -> Supabase JWT bridge kurulmalıdır.
-- Şu anki aşamada uygulamanın çalışması için RLS devre dışı bırakıldı.
