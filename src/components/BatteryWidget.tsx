/**
 * BatteryWidget.tsx
 * ─────────────────────────────────────────────────────────────
 * Dashboard'daki gerçekçi, animasyonlu pil bileşeni.
 *
 * Özellikler:
 *  • Admin paneli "Ekonomi Ayarları" → battery_drain_hours değerine
 *    göre gerçek zamanlı azalır (Supabase realtime ile senkron).
 *  • %100 → %0 geçişi admin'in belirlediği saat bazında hesaplanır.
 *  • Renk geçişleri: Yeşil (>55%) → Sarı (>25%) → Kırmızı (<25%)
 *  • Kritik seviyede (<15%) titreme + kırmızı parıldama efekti.
 *  • Şarj modu: isCharging=true → enerji yenilenme hızında dolar.
 *  • compact prop: Dashboard üst barına uygun yatay küçük versiyon.
 *
 * Kullanım:
 *   <BatteryWidget level={energy} onLevelChange={setEnergy} />
 *   <BatteryWidget level={energy} compact showPercent />
 * ─────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

interface Props {
    /** Mevcut pil seviyesi 0–100 */
    level?: number;
    /** Seviye değişince çağrılır */
    onLevelChange?: (v: number) => void;
    /** true = şarj ediliyor */
    isCharging?: boolean;
    /** Yatay kompakt versiyon */
    compact?: boolean;
    /** Yüzde göster */
    showPercent?: boolean;
    className?: string;
    /** Animasyonsuz statik gösterim */
    staticDisplay?: boolean;
}

interface HRSettings {
    battery_drain_hours: number;
    energy_regen_per_hour: number;
}

const DEFAULTS: HRSettings = { battery_drain_hours: 24, energy_regen_per_hour: 10 };

export default function BatteryWidget({
    level: ext,
    onLevelChange,
    isCharging    = false,
    compact       = false,
    showPercent   = true,
    className     = '',
    staticDisplay = false,
}: Props) {
    const [lvl, setLvl]       = useState(ext ?? 100);
    const [cfg, setCfg]       = useState<HRSettings>(DEFAULTS);
    const lvlRef              = useRef(ext ?? 100);
    const lastRef             = useRef(Date.now());

    // Dışarıdan gelen level sync
    useEffect(() => {
        if (ext !== undefined) { setLvl(ext); lvlRef.current = ext; }
    }, [ext]);

    // Supabase realtime — admin ayarlarını anlık al
    useEffect(() => {
        supabase.from('settings').select('value').eq('id', 'hashrate_settings').single()
            .then(({ data }) => { if (data?.value) setCfg(p => ({ ...p, ...data.value })); });

        const ch = supabase.channel('bw-cfg')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.hashrate_settings' }, p => {
                const v = (p.new as any)?.value;
                if (v) setCfg(s => ({ ...s, ...v }));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.v1' }, p => {
                const s = p.new as any; if (!s) return;
                setCfg(prev => ({
                    ...prev,
                    ...(s.battery_drain_hours   !== undefined && { battery_drain_hours:   s.battery_drain_hours }),
                    ...(s.energy_regen_per_hour !== undefined && { energy_regen_per_hour: s.energy_regen_per_hour }),
                }));
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);

    // Drain / regen ticker
    useEffect(() => {
        if (staticDisplay) return;
        const TICK = 2000;
        const drainPms = 100 / (cfg.battery_drain_hours * 3_600_000);
        const regenPms = cfg.energy_regen_per_hour / 3_600_000;
        const id = setInterval(() => {
            const now = Date.now(); const elapsed = now - lastRef.current; lastRef.current = now;
            setLvl(prev => {
                const next = Math.max(0, Math.min(100, prev + (isCharging ? regenPms : -drainPms) * elapsed));
                lvlRef.current = next;
                onLevelChange?.(next);
                return next;
            });
        }, TICK);
        return () => clearInterval(id);
    }, [cfg, isCharging, staticDisplay, onLevelChange]);

    const { theme } = useTheme();
    const a1 = theme.vars['--ct-a1'];

    const pct       = Math.max(0, Math.min(100, lvl));
    const isLow     = pct < 25;
    const isCrit    = pct < 15;
    const fill      = pct > 55 ? a1 : pct > 25 ? '#f59e0b' : '#ef4444';
    const glow      = pct > 55 ? `${a1}88` : pct > 25 ? 'rgba(245,158,11,0.55)' : 'rgba(239,68,68,0.75)';
    const statusLbl = pct > 55 ? 'Dolu' : pct > 25 ? 'Orta' : pct > 10 ? 'Düşük' : 'Kritik';

    /* ── COMPACT (yatay) ── */
    if (compact) {
        return (
            <div className={`inline-flex items-center gap-2 ${className}`} title={`Enerji: ${Math.round(pct)}%`}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 38, height: 20, borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.38)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 2, top: 2, height: 'calc(100% - 4px)', width: `calc(${pct}% - 4px)`, borderRadius: 2, background: fill, boxShadow: `0 0 6px ${glow}`, transition: 'width 1.5s ease, background 0.5s ease', animation: isCrit ? 'bc 0.85s ease-in-out infinite' : 'none' }}/>
                        <div style={{ position: 'absolute', top: 2, left: 4, width: 5, height: '35%', borderRadius: 2, background: 'rgba(255,255,255,0.18)' }}/>
                        {isCharging && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 8 }}>⚡</span>}
                    </div>
                    <div style={{ width: 3, height: 8, borderRadius: '0 2px 2px 0', background: 'rgba(255,255,255,0.2)', marginLeft: -1 }}/>
                </div>
                {showPercent && (
                    <span style={{ color: fill, fontSize: 10, fontWeight: 900, fontFamily: 'monospace', textShadow: `0 0 6px ${glow}`, animation: isCrit ? 'bt 0.85s ease-in-out infinite' : 'none' }}>
                        {Math.round(pct)}%
                    </span>
                )}
                <style>{`@keyframes bc{0%,100%{opacity:.35}50%{opacity:1}} @keyframes bt{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
            </div>
        );
    }

    /* ── FULL (dikey) ── */
    const W = 56, CAP = 11, BH = 144;
    const IX = 6, IY = CAP + 5, IW = W - 12, IH = BH - 10;
    const fH = (pct / 100) * IH;
    const fY = IY + (IH - fH);

    return (
        <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
            <svg width={W} height={BH + CAP + 4} viewBox={`0 0 ${W} ${BH + CAP + 4}`} style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="bfg" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%"  stopColor={fill} stopOpacity="0.75"/>
                        <stop offset="60%" stopColor={fill} stopOpacity="1"/>
                        <stop offset="100%" stopColor={fill} stopOpacity="0.9"/>
                    </linearGradient>
                    <filter id="bgl">
                        <feGaussianBlur stdDeviation="2.5" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <clipPath id="bcl">
                        <rect x={IX} y={IY} width={IW} height={IH} rx="5"/>
                    </clipPath>
                </defs>

                {/* Nub */}
                <rect x={W/2-11} y={0} width={22} height={CAP+2} rx="5" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>

                {/* Gövde */}
                <rect x={1} y={CAP} width={W-2} height={BH} rx="10"
                    fill="rgba(8,10,18,0.94)"
                    stroke={isCrit ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.1)'}
                    strokeWidth="1.5"
                    style={{ transition: 'stroke 0.5s ease' }}
                />

                {/* Doluluk */}
                <rect x={IX} y={fY} width={IW} height={fH} rx="5"
                    fill="url(#bfg)"
                    filter={isLow ? 'url(#bgl)' : undefined}
                    clipPath="url(#bcl)"
                    style={{ transition: 'y 1.2s cubic-bezier(.4,0,.2,1), height 1.2s cubic-bezier(.4,0,.2,1)', animation: isCrit ? 'bv .85s ease-in-out infinite' : 'none' }}
                />

                {/* Segment çizgileri */}
                {[0.25, 0.5, 0.75].map((s, i) => (
                    <line key={i} x1={IX} y1={IY + s*IH} x2={IX+IW} y2={IY + s*IH} stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"/>
                ))}

                {/* Sol kenar parlak hat */}
                <rect x={IX} y={fY} width={2} height={fH} rx="1" fill="rgba(255,255,255,0.18)" clipPath="url(#bcl)"/>

                {/* Üst parlaklık */}
                <rect x={IX+3} y={IY+4} width={9} height={IH*0.38} rx="3" fill="rgba(255,255,255,0.04)"/>

                {/* Şarj ikonu / Yüzde */}
                {isCharging ? (
                    <>
                        <text x={W/2} y={CAP+BH/2-4} textAnchor="middle" fill="white" fontSize="17" fontWeight="900">⚡</text>
                        {showPercent && <text x={W/2} y={CAP+BH/2+14} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11" fontWeight="900" fontFamily="monospace">{Math.round(pct)}%</text>}
                    </>
                ) : showPercent && (
                    <text x={W/2} y={CAP+BH/2+7} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="12" fontWeight="900" fontFamily="monospace">{Math.round(pct)}%</text>
                )}
            </svg>

            {/* Durum etiketi */}
            <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                    <div style={{ width:6, height:6, borderRadius:'50%', background:fill, boxShadow:`0 0 6px ${glow}`, animation: isCrit ? 'bd .85s ease-in-out infinite' : 'bi 2.5s ease-in-out infinite' }}/>
                    <span style={{ color:fill, fontSize:9, fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase' }}>
                        {isCharging ? 'Şarj Oluyor' : statusLbl}
                    </span>
                </div>
                {isCrit && !isCharging && (
                    <span style={{ color:'#ef4444', fontSize:8, fontWeight:700, opacity:0.85 }}>⚠ Enerji Kritik!</span>
                )}
            </div>

            <style>{`
                @keyframes bv { 0%,100%{opacity:.4} 50%{opacity:1} }
                @keyframes bd { 0%,100%{opacity:.3} 50%{opacity:1} }
                @keyframes bi { 0%,100%{opacity:.6} 50%{opacity:1} }
            `}</style>
        </div>
    );
}
