// Grade de batidas (BPM + offset), relógio do jogo, metrônomo e persistência por música.
const Batida = (() => {
  let bpm = 120;
  let offsetMs = 0;      // posição da primeira batida na música
  let ajusteMs = 0;      // ajuste de sincronia: atrasa (+) ou adianta (-) a régua visual e a avaliação
  let metronomo = false;
  let ultimoClique = -1, inicioVisto = null, timer = null;

  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const chave = () => `ritmo:${Musica.nome}:${Math.round(Musica.duracao)}`;

  // Relógio do jogo (s): posição da música menos a latência de saída e o ajuste manual.
  // Todas as etapas seguintes comparam toques e inimigos com este relógio.
  function agora() {
    return Musica.posicao() - Musica.latenciaSaida() - ajusteMs / 1000;
  }

  function salvar() {
    if (!Musica.carregada) return;
    try { localStorage.setItem(chave(), JSON.stringify({ bpm, offsetMs, ajusteMs })); } catch (e) { /* sem storage */ }
  }

  function definir(v) {
    if (v.bpm !== undefined && isFinite(v.bpm)) bpm = limitar(v.bpm, 40, 240);
    if (v.offsetMs !== undefined && isFinite(v.offsetMs)) offsetMs = limitar(v.offsetMs, -2000, 5000);
    if (v.ajusteMs !== undefined && isFinite(v.ajusteMs)) ajusteMs = limitar(v.ajusteMs, -300, 300);
    ultimoClique = -1;
    salvar();
  }

  // Recupera valores guardados para esta música. Devolve true se havia algo salvo.
  function carregarSalvo() {
    try {
      const d = JSON.parse(localStorage.getItem(chave()));
      if (d) { bpm = d.bpm; offsetMs = d.offsetMs; ajusteMs = d.ajusteMs || 0; return true; }
    } catch (e) { /* ignora */ }
    bpm = 120; offsetMs = 0;
    return false;
  }

  // Estimativa automática (aproximada). Pode errar por oitava (metade/dobro): use ÷2 e ×2 na tela.
  function detectar() {
    const buf = Musica.audioBuffer;
    if (!buf) return null;
    const sr = buf.sampleRate, j = Analise.janela(buf.duration);
    const de = Math.floor(j.inicio * sr), n = Math.floor(j.duracao * sr);
    const mono = new Float32Array(n);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const canal = buf.getChannelData(c);
      for (let i = 0; i < n; i++) mono[i] += canal[de + i] / buf.numberOfChannels;
    }
    return Analise.estimarBpm(mono, sr, j.inicio);
  }

  // Metrônomo: agenda cliques com antecedência no relógio do áudio (sem depender dos quadros de tela).
  function clique(t, forte) {
    const ctx = Musica.contexto;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.frequency.value = forte ? 1600 : 1000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.06);
  }

  function agendar() {
    if (!metronomo || !Musica.tocando) return;
    const ctx = Musica.contexto, t0 = Musica.instanteInicio, spb = 60 / bpm, off = offsetMs / 1000;
    if (inicioVisto !== t0) { inicioVisto = t0; ultimoClique = -1; }  // buscou/reiniciou
    let k = Math.max(ultimoClique + 1, Math.ceil((ctx.currentTime - t0 - off) / spb), 0);
    while (t0 + off + k * spb < ctx.currentTime + 0.12) {
      clique(t0 + off + k * spb, k % 4 === 0);
      ultimoClique = k++;
    }
  }

  function ligarMetronomo(ligado) {
    metronomo = ligado;
    ultimoClique = -1;
    if (ligado && !timer) timer = setInterval(agendar, 25);
    if (!ligado && timer) { clearInterval(timer); timer = null; }
  }

  return {
    agora, definir, carregarSalvo, detectar, ligarMetronomo,
    get bpm() { return bpm; },
    get spb() { return 60 / bpm; },
    get offset() { return offsetMs / 1000; },
    get offsetMs() { return offsetMs; },
    get ajusteMs() { return ajusteMs; },
  };
})();
