// Motor de música. Usa AudioBuffer + relógio do AudioContext (base para sincronia nas Etapas 3 e 4).
const Musica = (() => {
  let ctx = null, ganho = null, analisador = null, freq = null;
  let buffer = null, fonte = null;
  let inicio = 0;        // instante do ctx em que a posição 0 teria começado
  let pausadoEm = 0;     // posição (s) guardada quando pausado/parado
  let tocando = false;
  let volume = 0.8;
  let nome = '';
  let aoTerminar = null;

  async function garantirContexto() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      ganho = ctx.createGain();
      ganho.gain.value = volume;
      analisador = ctx.createAnalyser();
      analisador.fftSize = 1024;
      analisador.smoothingTimeConstant = 0.75;
      freq = new Uint8Array(analisador.frequencyBinCount);
      ganho.connect(analisador);
      analisador.connect(ctx.destination);
    }
    // Navegadores exigem gesto do usuário para liberar o áudio.
    if (ctx.state === 'suspended') await ctx.resume();
  }

  function descartarFonte() {
    if (!fonte) return;
    fonte.onended = null;
    try { fonte.stop(); } catch (e) { /* já parada */ }
    fonte.disconnect();
    fonte = null;
  }

  async function carregar(arquivo) {
    await garantirContexto();
    descartarFonte();
    tocando = false;
    const dados = await arquivo.arrayBuffer();
    buffer = await ctx.decodeAudioData(dados); // lança erro se o formato não for suportado
    nome = arquivo.name;
    pausadoEm = 0;
  }

  function posicao() {
    if (!buffer) return 0;
    return tocando ? Math.min(ctx.currentTime - inicio, buffer.duration) : pausadoEm;
  }

  async function tocar() {
    if (!buffer || tocando) return;
    await garantirContexto();
    const esta = ctx.createBufferSource();
    esta.buffer = buffer;
    esta.connect(ganho);
    inicio = ctx.currentTime - pausadoEm;
    esta.onended = () => {
      if (fonte !== esta) return;
      fonte = null; tocando = false; pausadoEm = 0;
      if (aoTerminar) aoTerminar();
    };
    esta.start(0, pausadoEm);
    fonte = esta;
    tocando = true;
  }

  function pausar() {
    if (!tocando) return;
    pausadoEm = posicao();
    descartarFonte();
    tocando = false;
  }

  async function reiniciar() {
    if (!buffer) return;
    descartarFonte();
    tocando = false;
    pausadoEm = 0;
    await tocar();
  }

  // Pula para uma posição (s). Mantém o estado tocando/pausado.
  async function buscar(segundos) {
    if (!buffer) return;
    const estava = tocando;
    descartarFonte();
    tocando = false;
    pausadoEm = Math.max(0, Math.min(segundos, buffer.duration - 0.05));
    if (estava) await tocar();
  }

  function definirVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (ganho) ganho.gain.value = volume;
  }

  // Espectro atual (0-255 por faixa) ou null se o áudio ainda não foi iniciado.
  function espectro() {
    if (!analisador) return null;
    analisador.getByteFrequencyData(freq);
    return freq;
  }

  // Atraso entre o relógio do contexto e o som realmente saindo (quando o navegador informa).
  function latenciaSaida() {
    return ctx ? (ctx.outputLatency || ctx.baseLatency || 0) : 0;
  }

  return {
    latenciaSaida,
    get contexto() { return ctx; },
    get instanteInicio() { return inicio; },
    get audioBuffer() { return buffer; },
    carregar, tocar, pausar, reiniciar, buscar, definirVolume, espectro, posicao,
    get tocando() { return tocando; },
    get duracao() { return buffer ? buffer.duration : 0; },
    get nome() { return nome; },
    get carregada() { return !!buffer; },
    aoTerminar(fn) { aoTerminar = fn; },
  };
})();
