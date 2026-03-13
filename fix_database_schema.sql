-- 0. Ensure profiles table has a role column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 1. Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
    id TEXT PRIMARY KEY,
    tr TEXT NOT NULL,
    en TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Allow read access for all
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on translations') THEN
        CREATE POLICY "Allow public read access on translations" ON public.translations
            FOR SELECT USING (true);
    END IF;
END $$;

-- Allow admin write access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin write access on translations') THEN
        CREATE POLICY "Allow admin write access on translations" ON public.translations
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id::text = auth.uid()::text AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

-- 2. Populate App & Guild Translations
-- (Merging content from create_translations.sql and update_guild_translations.sql)
INSERT INTO public.translations (id, tr, en, category) VALUES
-- Admin Panel Keys
('admin.title', 'Admin Paneli', 'Admin Panel', 'admin'),
('admin.access_granted', 'Tam Erişim Sağlandı', 'Full Access Granted', 'admin'),
('admin.tabs.overview', 'Genel Bakış', 'Overview', 'admin'),
('admin.tabs.economy', 'Ekonomi', 'Economy', 'admin'),
('admin.tabs.users', 'Kullanıcılar', 'Users', 'admin'),
('admin.tabs.events', 'Etkinlikler', 'Events', 'admin'),
('admin.tabs.withdrawals', 'Çekimler', 'Withdrawals', 'admin'),
('admin.tabs.support', 'Destek', 'Support', 'admin'),
('admin.tabs.localization', 'Çeviri', 'Translation', 'admin'),
('admin.stats.btc_balance', 'BTC Bakiyesi', 'BTC Balance', 'admin'),
('admin.stats.tp_balance', 'TP Bakiyesi', 'TP Balance', 'admin'),
('admin.stats.level', 'Seviye', 'Level', 'admin'),
('admin.stats.energy', 'Enerji', 'Energy', 'admin'),
('admin.economy.set_btc', 'BTC Bakiyesini Ayarla', 'Set BTC Balance', 'admin'),
('admin.economy.set_tp', 'TP Bakiyesini Ayarla', 'Set TP Balance', 'admin'),
('admin.events.trigger_title', 'Manuel Etkinlik Tetikle', 'Trigger Manual Event', 'admin'),
('admin.events.flash_pool.title', 'Flash Pool', 'Flash Pool', 'admin'),
('admin.events.flash_pool.desc', '1.5x BTC Kazancı (15 dk)', '1.5x BTC Earnings (15 min)', 'admin'),
('admin.events.hash_storm.title', 'Hash Storm', 'Hash Storm', 'admin'),
('admin.events.hash_storm.desc', '+500 GH/s Hız (15 dk)', '+500 GH/s Speed (15 min)', 'admin'),
('admin.events.energy_surge.title', 'Energy Surge', 'Energy Surge', 'admin'),
('admin.events.energy_surge.desc', 'Full Enerji Yenileme', 'Full Energy Refresh', 'admin'),
('admin.users.set_level', 'Seviye Belirle', 'Set Level', 'admin'),
('admin.users.reset_game', 'Tüm Oyunu Sıfırla', 'Reset Entire Game', 'admin'),
('admin.users.reset_confirm', 'TÜM VERİLER SIFIRLANACAK! Emin misiniz?', 'ALL DATA WILL BE RESET! Are you sure?', 'admin'),
('admin.withdrawals.title', 'Çekim Talepleri', 'Withdrawal Requests', 'admin'),
('admin.withdrawals.no_requests', 'Bekleyen talep yok', 'No pending requests', 'admin'),
('admin.withdrawals.approve', 'ONAYLA', 'APPROVE', 'admin'),
('admin.withdrawals.reject', 'REDDET', 'REJECT', 'admin'),
('admin.support.title', 'Destek & Yasal Linkler', 'Support & Legal Links', 'admin'),
('admin.support.label_support_us', 'Bize Destek Olun (URL/Mail)', 'Support Us (URL/Mail)', 'admin'),
('admin.support.label_contact_us', 'Bize Ulaşın (URL/Mail)', 'Contact Us (URL/Mail)', 'admin'),
('admin.support.label_terms', 'Şartlar ve Koşullar (URL)', 'Terms & Conditions (URL)', 'admin'),
('admin.support.label_privacy', 'Gizlilik Politikası (URL)', 'Privacy Policy (URL)', 'admin'),
('admin.support.save_btn', 'Değişiklikleri Kaydet', 'Save Changes', 'admin'),
('admin.support.saving', 'Kaydediliyor...', 'Saving...', 'admin'),
('admin.locale.manager_title', 'Dil Yönetimi', 'Language Management', 'admin'),
('admin.locale.search_placeholder', 'Key veya metin ara...', 'Search key or text...', 'admin'),
('admin.locale.edit_btn', 'Düzenle', 'Edit', 'admin'),
('admin.locale.add_new', 'Yeni Çeviri Ekle', 'Add New Translation', 'admin'),
('admin.locale.key_label', 'Key (örn: mining.title)', 'Key (e.g. mining.title)', 'admin'),
('admin.locale.tr_label', 'Türkçe Metin', 'Turkish Text', 'admin'),
('admin.locale.en_label', 'İngilizce Metin', 'English Text', 'admin'),
('admin.common.apply', 'Uygula', 'Apply', 'admin'),
('admin.common.cancel', 'İptal', 'Cancel', 'admin'),
('admin.common.save', 'Kaydet', 'Save', 'admin'),
('admin.common.add', 'Ekle', 'Add', 'admin'),
('admin.notify.event_success', 'Etkinlik başarıyla başlatıldı.', 'Event started successfully.', 'admin'),
('admin.notify.update_success', 'Güncellendi.', 'Updated.', 'admin'),
('admin.notify.add_success', 'Eklendi.', 'Added.', 'admin'),
('admin.notify.error', 'Hata oluştu.', 'Error occurred.', 'admin'),

-- Settings & General
('settings.title', 'Ayarlar', 'Settings', 'settings'),
('settings.onboarding_restart', 'Onboarding Turunu Tekrar Gör', 'See Onboarding Tour Again', 'settings'),
('common.success', 'Başarılı', 'Success', 'common'),
('common.vip', 'VIP', 'VIP', 'common'),
('common.pass', 'PASS', 'PASS', 'common'),
('common.marketplace', 'PAZAR', 'MARKET', 'common'),
('common.bonus', 'BONUS', 'BONUS', 'common'),

-- Mining Panel
('mining.help_center', 'Yardım Merkezi', 'Help Center', 'mining'),
('mining.system_guide', 'Sistem Rehberi', 'System Guide', 'mining'),
('mining.daily_limit.title', 'Günlük Limit', 'Daily Limit', 'mining'),
('mining.daily_limit.reached', 'Günlük kazanç limitine ulaşıldı', 'Daily earning limit reached', 'mining'),
('mining.daily_limit.capacity', 'Kapasite', 'Capacity', 'mining'),
('mining.happy_hour.title', 'Mutlu Saatler', 'Happy Hour', 'mining'),
('mining.happy_hour.desc', '×1.2 KAZANÇ AKTİF', 'x1.2 EARNINGS ACTIVE', 'mining'),
('mining.live_hashrate', 'Canlı Hashrate', 'Live Hashrate', 'mining'),
('mining.system_status.active', 'Sistem Aktif', 'System Active', 'mining'),
('mining.hardware_health', 'Donanım Sağlığı', 'Hardware Health', 'mining'),
('mining.energy_expense', 'Enerji Gideri', 'Energy Expense', 'mining'),
('mining.live_balance', 'Canlı Bakiye', 'Live Balance', 'mining'),
('mining.estimated_daily', 'Tahmini Günlük', 'Estimated Daily', 'mining'),
('mining.live_activity_stream', 'Canlı Aktivite Akışı', 'Live Activity Stream', 'mining'),
('mining.level_unlocks', 'Kilit Açılımları', 'Unlocks', 'mining'),
('mining.progress', 'İlerleme', 'Progress', 'mining'),
('mining.next_level', 'Sonraki Seviye', 'Next Level', 'mining'),
('mining.session', 'OTURUM', 'SESSION', 'mining'),
('mining.online', 'ÇEVRİMİÇİ', 'ONLINE', 'mining'),
('mining.remaining', 'kaldı', 'remaining', 'mining'),
('mining.duration', 'Süre', 'Duration', 'mining'),
('mining.cooldown', 'Cooldown', 'Cooldown', 'mining'),
('mining.penalty', 'Ceza', 'Penalty', 'mining'),
('mining.cost', 'Maliyet', 'Cost', 'mining'),
('mining.ad_watching', 'Reklam izleniyor…', 'Watching ad...', 'mining'),
('mining.ad_reward_msg', '+2 enerji hücresi ve +10 TP kazanacaksın.', '+2 energy cells & +10 TP rewarded.', 'mining'),
('mining.overclock.active', 'AKTİF', 'ACTIVE', 'mining'),
('mining.overclock.cooldown', 'COOLDOWN', 'COOLDOWN', 'mining'),
('mining.overclock.btn_active', 'Aktif', 'Active', 'mining'),
('mining.overclock.btn_start', 'Başlat', 'Start', 'mining'),
('mining.overclock.no_tp', 'TP Yok', 'No TP', 'mining'),
('mining.rank.newbie', 'Yeni Madenci', 'New Miner', 'mining'),
('mining.perks.max_level', 'Max seviyeye ulaştın!', 'Max level reached!', 'mining'),
('mining.social.miner', 'Bir Madenci', 'A Miner', 'mining'),
('mining.social.hidden_miner', 'Gizli Madenci', 'Hidden Miner', 'mining'),
('mining.social.action', 'İşlem gerçekleştirdi', 'Performed an action', 'mining'),
('mining.social.just_now', 'AZ ÖNCE', 'JUST NOW', 'mining'),
('mining.social.new', 'YENİ', 'NEW', 'mining'),

-- Battery
('battery.status.full', 'Dolu', 'Full', 'battery'),
('battery.status.medium', 'Orta', 'Medium', 'battery'),
('battery.status.low', 'Düşük', 'Low', 'battery'),
('battery.status.critical', 'Kritik', 'Critical', 'battery'),
('battery.charging', 'Şarj Oluyor', 'Charging', 'battery'),
('battery.critical_warn', 'Enerji Kritik!', 'Energy Critical!', 'battery'),

-- Common
('common.level', 'SEVİYE', 'LEVEL', 'common'),
('common.tycoon_points', 'TycoonPoints', 'TycoonPoints', 'common'),
('common.xp', 'XP', 'XP', 'common'),

-- Sidebar & Navigation
('sidebar.main_menu', 'Ana Menü', 'Main Menu', 'sidebar'),
('sidebar.economy_social', 'Ekonomi & Sosyal', 'Economy & Social', 'sidebar'),
('sidebar.system', 'Sistem', 'System', 'sidebar'),
('sidebar.notifications', 'Bildirimler', 'Notifications', 'sidebar'),
('sidebar.settings', 'Ayarlar', 'Settings', 'sidebar'),
('sidebar.miner_rank', 'Madenci', 'Miner', 'sidebar'),
('sidebar.btc_balance', 'BTC Bakiyesi', 'BTC Balance', 'sidebar'),
('nav.panel', 'Panel', 'Dashboard', 'nav'),
('nav.market', 'Market', 'Market', 'nav'),
('nav.contract', 'Kontrat', 'Contract', 'nav'),
('nav.research', 'Gelişim', 'Research', 'nav'),
('nav.quests', 'Görevler', 'Quests', 'nav'),
('nav.wallet', 'Cüzdan', 'Wallet', 'nav'),
('nav.marketplace', 'Pazaryeri', 'Marketplace', 'nav'),
('nav.social', 'Sosyal', 'Social', 'nav'),
('nav.guild', 'Lonca', 'Guild', 'nav'),
('nav.farm', 'Çiftlik', 'Farm', 'nav'),
('nav.infrastructure', 'Altyapı', 'Infrastructure', 'nav'),
('nav.wheel', 'Çark', 'Wheel', 'nav'),
('nav.battlepass', 'Battle Pass', 'Battle Pass', 'nav'),
('nav.vip', 'VIP', 'VIP', 'nav'),

-- Guild
('guild.join_title', 'Bir Loncaya Katıl', 'Join a Guild', 'guild'),
('guild.btn.create', 'Yeni Lonca Kur', 'Create New Guild', 'guild'),
('guild.join_desc', 'Madencilerle güçlerini birleştir, ortak hedeflere ulaş ve özel BTC ödülleri kazan!', 'Join forces with miners, reach common goals and win special BTC rewards!', 'guild'),
('guild.active_guilds', 'Aktif Loncalar', 'Active Guilds', 'guild'),
('guild.search_placeholder', 'Ara...', 'Search...', 'guild')

ON CONFLICT (id) DO UPDATE SET
    tr = EXCLUDED.tr,
    en = EXCLUDED.en,
    category = EXCLUDED.category,
    updated_at = NOW();

-- 3. Ensure Settings table has support links row
INSERT INTO public.settings (id, value)
VALUES ('support_legal_links', '{"supportUs": "", "contactUs": "", "terms": "", "privacy": ""}')
ON CONFLICT (id) DO NOTHING;
