// Testa a análise com trilhas sintéticas. Rodar: node tests/analise.test.js
const Analise = require('../js/analise.js');
const sr = 22050;

function trilha(bpm, offset, dur, comChimbal) {
  const x = new Float32Array(sr * dur), p = 60 / bpm;
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
  const estourar = (t, amp, freq) => {
    for (let i = 0; i < sr * 0.08; i++) {
      const k = Math.floor(t * sr) + i; if (k >= x.length) break;
      x[k] += amp * Math.exp(-i / (sr * 0.02)) * (freq ? Math.sin(2 * Math.PI * freq * i / sr) : rnd() * 2);
    }
  };
  for (let t = offset, n = 0; t < dur; t += p, n++) {
    estourar(t, n % 4 === 0 ? 0.9 : 0.6, 60);
    if (comChimbal) estourar(t + p / 2, 0.25, 0);
  }
  for (let i = 0; i < x.length; i++) x[i] += rnd() * 0.02;
  return x;
}

let falhas = 0;
const casos = [[120, 0.30, false], [140, 0.10, true], [96, 0.45, true], [100, 0.05, false]];
for (const [bpm, off, hat] of casos) {
  const j = Analise.janela(40);
  const r = Analise.estimarBpm(trilha(bpm, off, 40, hat).subarray(0, sr * j.duracao), sr, j.inicio);
  const p = 60 / bpm;
  let erroOff = Math.abs(r.offset - off); erroOff = Math.min(erroOff, p - erroOff);
  const ok = Math.abs(r.bpm - bpm) < 0.5 && erroOff < 0.03;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK ' : 'FALHA'} alvo ${bpm}/${off}s -> ${r.bpm.toFixed(2)} bpm, offset ${r.offset.toFixed(3)}s (erro ${(erroOff * 1000).toFixed(0)} ms)`);
}

// Toques com tremor humano (±25 ms) e um toque perdido
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
const toques = [];
for (let k = 0; k < 12; k++) { if (k === 5) continue; toques.push(1.2 + k * (60 / 128) + rnd() * 0.05); }
const c = Analise.ajustarPorToques(toques);
const okC = c && Math.abs(c.bpm - 128) < 1;
if (!okC) falhas++;
console.log(`${okC ? 'OK ' : 'FALHA'} toques 128 bpm -> ${c && c.bpm.toFixed(2)} bpm, offset ${c && c.offset.toFixed(3)}s, desvio ${c && c.desvioMs.toFixed(0)} ms`);
process.exit(falhas ? 1 : 0);
      
