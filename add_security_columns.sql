-- settings tablosuna eksik güvenlik sütunlarını ekle
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS twoFaRequired BOOLEAN DEFAULT false;

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS rateLimitEnabled BOOLEAN DEFAULT false;

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS kycRequired BOOLEAN DEFAULT false;

-- Mevcut v1 satırını güncelle (Opsiyonel)
UPDATE settings SET 
  twoFaRequired = false, 
  rateLimitEnabled = false, 
  kycRequired = false 
WHERE id = 'v1';
