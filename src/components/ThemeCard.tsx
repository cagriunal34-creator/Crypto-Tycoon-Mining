import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeConfig } from '../context/themes';
import { useTheme } from '../context/ThemeContext';

interface Props {
  key?: React.Key;
  theme: ThemeConfig;
  isActive: boolean;
  onSelect: () => void;
}

export default function ThemeCard({ theme: t, isActive, onSelect }: Props) {
  const a1 = t.vars['--ct-a1'];
  const a2 = t.vars['--ct-a2'];
  const a3 = t.vars['--ct-a3'];
  const bg = t.vars['--ct-bg'];
  const muted = t.vars['--ct-muted'];
  const text = t.vars['--ct-text'];

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="w-full text-left"
      style={{
        background: isActive ? `${a1}10` : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${isActive ? a1 : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: isActive ? `0 0 24px ${a1}25` : 'none',
        transition: 'all 0.2s',
      }}
    >
      {/* Mini screen mockup */}
      <div style={{ background: bg, padding: '10px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient orbs */}
        <div style={{ position:'absolute', top:'-12px', right:'-12px', width:50, height:50, borderRadius:'50%', background:`${a1}28`, filter:'blur(14px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-10px', left:'5px', width:40, height:40, borderRadius:'50%', background:`${a2}20`, filter:'blur(12px)', pointerEvents:'none' }} />

        {/* Top shimmer */}
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${a1}90,${a2}70,transparent)`, marginBottom:8, opacity:0.8 }} />

        {/* Header row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:14, height:14, borderRadius:3, background:`linear-gradient(135deg,${a1}50,${a2}40)`, border:`1px solid ${a1}50` }} />
            <div style={{ width:36, height:4, borderRadius:2, background:`linear-gradient(90deg,${a1}80,${a2}60)` }} />
          </div>
          <div style={{ width:18, height:6, borderRadius:8, background:`${a1}25`, border:`1px solid ${a1}35` }} />
        </div>

        {/* Balance */}
        <div style={{ marginBottom:7 }}>
          <div style={{ width:48, height:3, borderRadius:2, background:`${muted}60`, marginBottom:3 }} />
          <div style={{ width:80, height:9, borderRadius:3, background:`linear-gradient(90deg,${text}80,${a1}70)`, marginBottom:3 }} />
          <div style={{ width:44, height:3, borderRadius:2, background:`${a1}50` }} />
        </div>

        {/* Progress */}
        <div style={{ height:2.5, background:'rgba(255,255,255,0.05)', borderRadius:2, marginBottom:7, overflow:'hidden' }}>
          <div style={{ width:'62%', height:'100%', background:`linear-gradient(90deg,${a1},${a2})`, borderRadius:2 }} />
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:3 }}>
          {[a1,a2,a3].map((c,i)=>(
            <div key={i} style={{ height:18, borderRadius:5, background:`${c}12`, border:`1px solid ${c}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:16, height:2.5, borderRadius:2, background:`${c}70` }} />
            </div>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display:'flex', gap:2, marginTop:7, paddingTop:5, borderTop:`1px solid ${a1}14` }}>
          {[a1,muted,muted,muted].map((c,i)=>(
            <div key={i} style={{ flex:1, height:2.5, borderRadius:2, background:`${c}${i===0?'AA':'30'}` }} />
          ))}
        </div>
      </div>

      {/* Label */}
      <div style={{ padding:'9px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:1 }}>
            <span style={{ fontSize:14 }}>{t.emoji}</span>
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.04em', color: isActive ? a1 : 'var(--ct-text, #fff)' }}>
              {t.name}
            </span>
          </div>
          <div style={{ fontSize:9, color:'var(--ct-muted, #888)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t.tag}</div>
        </div>
        {isActive && (
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
            style={{ width:20, height:20, borderRadius:'50%', background:`linear-gradient(135deg,${a1},${a2})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 10px ${a1}60` }}>
            <Check size={11} color="#fff" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
