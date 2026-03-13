-- Settings Tablosu Şema ve Veri Düzeltme
-- 1. 'value' kolonu eksikse ekle
ALTER TABLE settings ADD COLUMN IF NOT EXISTS value JSONB;

-- 2. Mevcut verileri (v1 gibi) temizle veya hazırla (opsiyonel, v1 genelde ayrı kolonlar kullanıyor ama bütünlük için value da tutulabilir)
-- Not: v1 satırı GameContext'te çoklu kolonlarla güncelleniyor, bu yüzden ona dokunmuyoruz.

-- 3. Eksik olan hashrate_settings ve google_ads_config satırlarını ekle (yada güncelle)
-- Hem alt çizgili hem boşluklu hallerini ekliyoruz ki frontend'deki tuhaflıklar (çeviri vb.) hata vermesin.

INSERT INTO settings (id, value)
VALUES 
  ('hashrate_settings', '{"autoBotListing":true,"hashRateTiers":{"t1":0.05,"t2":0.08,"t3":0.15},"miningDifficulty":50}'),
  ('google_ads_config', '{"bannerEnabled":false,"interstitialEnabled":false,"rewardedEnabled":true,"testMode":true}'),
  ('hashrate settings', '{"autoBotListing":true,"hashRateTiers":{"t1":0.05,"t2":0.08,"t3":0.15},"miningDifficulty":50}'),
  ('google ads config', '{"bannerEnabled":false,"interstitialEnabled":false,"rewardedEnabled":true,"testMode":true}')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- 4. RLS kontrolü (zaten kapalı olması lazım ama garantiye alalım)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
