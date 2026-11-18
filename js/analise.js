// Análise de ritmo (funções puras, sem DOM). Aproximada: serve de ponto de partida para a calibração manual.
const Analise = (() => {
  const HOP = 0.01;              // ~10 ms por quadro do envelope (o valor real depende da taxa de amostragem)

  // Trecho analisado: até 60 s, saindo do começo (evita introduções longas em músicas grandes).
  function janela(duracao) {
    const dur = Math.min(duracao, 60);
    const inicio = duracao > 75 ? duracao * 0.2 : 0;
    return { inicio, duracao: Math.min(dur, duracao - inicio) };
  }

  // Força de ataque (onset) ao longo do tempo: subida positiva da energia em escala logarítmica.
  function envelope(mono, sr) {
    const h = Math.floor(sr * HOP), n = Math.floor(mono.length / h) - 2;
    const env = new Float32Array(Math.max(n, 0));
    env.hop = h / sr;              // duração real de um quadro, em segundos
    let anterior = 0;
    for (let i = 0; i < env.length; i++) {
      let s = 0;
      for (let j = i * h; j < i * h + 2 * h; j++) s += mono[j] * mono[j];
      const e = Math.log1p(50 * Math.sqrt(s / (2 * h)));
      env[i] = Math.max(0, e - anterior);
      anterior = e;
    }
    let soma = 0;
    for (const v of env) soma += v;
    const m = soma / (env.length || 1);
    for (let i = 0; i < env.length; i++) env[i] -= m; // centraliza: ruído não pontua
    const suave = new Float32Array(env.length);
    suave.hop = env.hop;
    for (let i = 0; i < env.length; i++) {
      suave[i] = 0.25 * (env[i - 1] || 0) + 0.5 * env[i] + 0.25 * (env[i + 1] || 0);
    }
    return suave;
  }

  function valorEm(env, t) {
    const x = (t - 1.5 * env.hop) / env.hop, i = Math.floor(x);
    if (i < 0 || i + 1 >= env.length) return 0;
    const f = x - i;
    return env[i] * (1 - f) + env[i + 1] * f;
  }

  // Pontuação média de uma grade (bpm, fase) sobre o envelope; devolve a melhor fase.
  function pontuar(env, bpm, passosFase) {
    const p = 60 / bpm, fim = env.length * env.hop;
    let melhor = -Infinity, fase = 0;
    for (let k = 0; k < passosFase; k++) {
      const f = (k / passosFase) * p;
      let s = 0, n = 0;
      for (let t = f; t < fim; t += p) { s += valorEm(env, t); n++; }
      const media = n ? s / n : -Infinity;
      if (media > melhor) { melhor = media; fase = f; }
    }
    return { pontos: melhor, fase };
  }

  // mono = trecho já recortado; inicio = onde esse trecho começa na música (s).
  function estimarBpm(mono, sr, inicio = 0) {
    const env = envelope(mono, sr);
    if (env.length < 300) return null;
    let melhor = { pontos: -Infinity, bpm: 120 };
    for (let bpm = 80; bpm <= 170; bpm += 0.25) {
      const r = pontuar(env, bpm, 48);
      if (r.pontos > melhor.pontos) melhor = { pontos: r.pontos, bpm };
    }
    const centro = melhor.bpm;
    for (let bpm = centro - 0.5; bpm <= centro + 0.5; bpm += 0.02) {
      const r = pontuar(env, bpm, 48);
      if (r.pontos > melhor.pontos) melhor = { pontos: r.pontos, bpm };
    }
    const fino = pontuar(env, melhor.bpm, 120);
    const refinado = refinarPorPicos(env, melhor.bpm, fino.fase);
    const p = refinado.periodo;
    const offset = (((inicio + refinado.inicio) % p) + p) % p;
    return { bpm: 60 / p, offset, forca: fino.pontos };
  }

  // A pontuação da grade é "larga" e deixa o BPM impreciso. Aqui ajusta-se uma reta aos picos reais
  // de ataque perto de cada batida prevista: o erro de período fica pequeno mesmo após minutos de música.
  function refinarPorPicos(env, bpm, fase) {
    const hop = env.hop, desloc = 1.5 * hop;
    const p0 = 60 / bpm, fim = env.length * hop;
    let max = 0;
    for (const v of env) if (v > max) max = v;
    let pares = [];
    for (let k = 0; fase + k * p0 < fim - 0.05; k++) {
      const centro = Math.round((fase + k * p0 - desloc) / hop);
      let melhorI = -1, melhorV = 0.2 * max;
      for (let i = centro - 4; i <= centro + 4; i++) {
        if (i >= 0 && i < env.length && env[i] > melhorV) { melhorV = env[i]; melhorI = i; }
      }
      if (melhorI >= 0) pares.push([k, melhorI * hop + desloc]);
    }
    let r = { periodo: p0, inicio: fase };
    for (let passo = 0; passo < 2 && pares.length >= 8; passo++) {
      const n = pares.length;
      let sk = 0, st = 0, skk = 0, skt = 0;
      for (const [k, t] of pares) { sk += k; st += t; skk += k * k; skt += k * t; }
      const den = n * skk - sk * sk;
      if (!den) break;
      const periodo = (n * skt - sk * st) / den;
      const inicio = (st - periodo * sk) / n;
      r = { periodo, inicio };
      pares = pares.filter(([k, t]) => Math.abs(t - (inicio + k * periodo)) < 0.03);
    }
    return r;
  }

  function mediana(v) {
    const o = [...v].sort((a, b) => a - b), m = o.length >> 1;
    return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
  }

  // A partir de toques do jogador (s), calcula BPM e offset por regressão linear.
  function ajustarPorToques(toques) {
    const t = [...toques].sort((a, b) => a - b);
    if (t.length < 4) return null;
    const dif = [];
    for (let i = 1; i < t.length; i++) dif.push(t[i] - t[i - 1]);
    let p = mediana(dif);
    if (!(p > 0.2 && p < 1.5)) return null;
    let a = t[0], usados = t;
    for (let passo = 0; passo < 3; passo++) {
      const pts = usados.map(x => ({ i: Math.round((x - t[0]) / p), x }));
      const n = pts.length;
      const si = pts.reduce((s, q) => s + q.i, 0), sx = pts.reduce((s, q) => s + q.x, 0);
      const sii = pts.reduce((s, q) => s + q.i * q.i, 0), six = pts.reduce((s, q) => s + q.i * q.x, 0);
      const den = n * sii - si * si;
      if (!den) return null;
      p = (n * six - si * sx) / den;
      a = (sx - p * si) / n;
      // descarta toques muito fora da grade e refaz
      usados = t.filter(x => Math.abs(x - (a + Math.round((x - a) / p) * p)) < 0.2 * p);
      if (usados.length < 4) return null;
    }
    const res = usados.map(x => x - (a + Math.round((x - a) / p) * p));
    const desvio = Math.sqrt(res.reduce((s, r) => s + r * r, 0) / res.length);
    return { bpm: 60 / p, offset: (((a % p) + p) % p), desvioMs: desvio * 1000, usados: usados.length };
  }

  return { janela, estimarBpm, ajustarPorToques };
})();
if (typeof module !== 'undefined') module.exports = Analise;
