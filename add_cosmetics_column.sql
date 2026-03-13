-- Profiles tablosuna kozmetik sütunu ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cosmetics JSONB DEFAULT '{"owned": [], "equipped": {}}'::jsonb;

-- Örnek: Mevcut kullanıcılar için varsayılan değerleri kontrol et (zaten default var ama güvenceye alalım)
UPDATE profiles SET cosmetics = '{"owned": [], "equipped": {}}'::jsonb WHERE cosmetics IS NULL;
