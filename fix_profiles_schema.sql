-- 1. ADIM: Supabase Dashboard -> Storage kısmından "avatars" isminde yeni bir BUCKET oluşturun.
-- 2. ADIM: Bucket'ı "Public" (açık) yapın ki resimler herkes tarafından görülebilsin.
-- 3. ADIM: Aşağıdaki SQL kodunu SQL Editor'de çalıştırarak tabloları güncelleyin.

-- Profiles tablosuna eksik sütunları ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "claimedMilestones" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "claimedGuildRewards" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "userGuildId" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "vip" JSONB DEFAULT '{"isActive": false, "tier": "none"}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "redeemedReferralCode" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "energyCells" NUMERIC DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "dailyEarningsBtc" NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "lastEarningsResetDate" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "researchedNodes" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "battlePass" JSONB DEFAULT '{"level": 1, "xp": 0, "isPremium": false, "claimedRewardIds": []}'::jsonb;

-- İndeksler (opsiyonel ama performans için iyi)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referralCode ON profiles("referralCode");
