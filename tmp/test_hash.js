
function calcBtcPerSecond(
  totalHash,
  usdRate = 91200,
  tiers = { kh: 0.05, mh: 0.05, gh: 0.05, th: 0.05, ph: 1.0, zh: 5.0 }
) {
  let tierValue = 0.05; 
  let tierUnit = 1e9; 
  
  if (tiers) {
    if (totalHash >= 1e18) { tierValue = tiers.zh; tierUnit = 1e18; }
    else if (totalHash >= 1e15) { tierValue = tiers.ph; tierUnit = 1e15; }
    else if (totalHash >= 1e12) { tierValue = tiers.th; tierUnit = 1e12; }
    else if (totalHash >= 1e9)  { tierValue = tiers.gh; tierUnit = 1e9; }
    else if (totalHash >= 1e6)  { tierValue = tiers.mh; tierUnit = 1e6; }
    else { tierValue = tiers.kh; tierUnit = 1e3; }
  }

  const usdPerHour = (totalHash / tierUnit) * tierValue;
  const btcPerHour = usdPerHour / usdRate;
  return (btcPerHour / 3600);
}

const tests = [
  { hash: 1e3, label: '1 kH/s' },
  { hash: 500e3, label: '500 kH/s' },
  { hash: 1e6, label: '1 MH/s' },
  { hash: 500e6, label: '500 MH/s' },
  { hash: 1e9, label: '1 GH/s' },
  { hash: 500e9, label: '500 GH/s' },
  { hash: 1e12, label: '1 TH/s' },
  { hash: 1e15, label: '1 PH/s' },
  { hash: 1e18, label: '1 ZH/s' },
];

console.log('--- Hash Rate Calculation Verification ---');
console.log('Tier Config:', { kh: 0.05, mh: 0.05, gh: 0.05, th: 0.05, ph: 1.0, zh: 5.0 });
console.log('');

tests.forEach(t => {
  const btcPerSec = calcBtcPerSecond(t.hash);
  const usdPerSec = btcPerSec * 91200;
  const usdPerHour = usdPerSec * 3600;
  console.log(`${t.label.padEnd(10)} -> USD/hr: ${usdPerHour.toFixed(4)} -> BTC/sec: ${btcPerSec.toFixed(12)}`);
});
