// Navegação entre telas e controles da música.
const telas = {
  inicial: document.getElementById('tela-inicial'),
  cena: document.getElementById('tela-cena'),
};
const el = id => document.getElementById(id);
const ui = {
  arquivo: el('arquivo'), btnArquivo: el('btn-arquivo'), btnTocar: el('btn-tocar'),
  btnReiniciar: el('btn-reiniciar'), progresso: el('progresso'), volume: el('volume'),
  nome: el('nome-musica'), tempo: el('tempo'), aviso: el('aviso'),
  folha: el('folha'), bpm: el('bpm'), offset: el('offset'), ajuste: el('ajuste'),
  folhaTocar: el('folha-tocar'), detectar: el('btn-detectar'), folhaAviso: el('folha-aviso'),
  toque: el('calib-toque'), calibInfo: el('calib-info'), calibAplicar: el('calib-aplicar'),
};
let arrastando = false;
let timerUi = null;

function formatar(s) {
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function atualizarUi() {
  const dur = Musica.duracao, pos = Musica.posicao();
  ui.tempo.textContent = `${formatar(pos)} / ${formatar(dur)}`;
  if (!arrastando && dur) ui.progresso.value = Math.round((pos / dur) * 1000);
  const rotulo = Musica.tocando ? 'Pausar' : (pos > 0 ? 'Continuar' : 'Tocar');
  ui.btnTocar.textContent = ui.folhaTocar.textContent = rotulo;
}

function mostrar(nome) {
  Object.values(telas).forEach(t => t.classList.remove('ativa'));
  telas[nome].classList.add('ativa');
  if (nome === 'cena') {
    Cena.iniciar();
    timerUi = setInterval(atualizarUi, 200);
  } else {
    Cena.parar();
    clearInterval(timerUi);
    Musica.pausar();
    ui.folha.hidden = true;
    atualizarUi();
  }
}

el('btn-jogar').addEventListener('click', () => mostrar('cena'));
el('btn-voltar').addEventListener('click', () => mostrar('inicial'));

ui.arquivo.addEventListener('change', async () => {
  const arq = ui.arquivo.files[0];
  if (!arq) return;
  ui.aviso.textContent = 'Carregando...';
  ui.btnTocar.disabled = ui.btnReiniciar.disabled = ui.progresso.disabled = true;
  try {
    await Musica.carregar(arq);
    ui.nome.textContent = Musica.nome;
    ui.aviso.textContent = '';
    ui.btnTocar.disabled = ui.btnReiniciar.disabled = ui.progresso.disabled = false;
    ui.progresso.value = 0;
    const salvo = Batida.carregarSalvo();
    ui.folhaAviso.textContent = salvo ? '' : 'Defina a batida: use "Detectar BPM" ou calibre por toques.';
    limparToques();
    habilitarBatida(true);
    atualizarUi();
  } catch (e) {
    ui.aviso.textContent = 'Não foi possível abrir este arquivo. Tente MP3, WAV, OGG ou M4A.';
  }
  ui.arquivo.value = ''; // permite escolher o mesmo arquivo de novo
});

ui.btnTocar.addEventListener('click', async () => {
  if (Musica.tocando) Musica.pausar(); else await Musica.tocar();
  atualizarUi();
});
ui.btnReiniciar.addEventListener('click', async () => { await Musica.reiniciar(); atualizarUi(); });
ui.volume.addEventListener('input', () => Musica.definirVolume(ui.volume.value / 100));

// Barra de posição: arrastar para buscar um ponto da música
ui.progresso.addEventListener('input', () => { arrastando = true; });
ui.progresso.addEventListener('change', async () => {
  await Musica.buscar((ui.progresso.value / 1000) * Musica.duracao);
  arrastando = false;
  atualizarUi();
});

Musica.aoTerminar(atualizarUi);

// ---------- Batida e calibração (Etapa 3) ----------
let toques = [];
let calibResultado = null;

function habilitarBatida(sim) {
  ui.folhaTocar.disabled = ui.detectar.disabled = ui.toque.disabled = !sim;
  mostrarBatida();
}

function mostrarBatida() {
  ui.bpm.value = Batida.bpm.toFixed(2);
  ui.offset.value = Math.round(Batida.offsetMs);
  ui.ajuste.value = Math.round(Batida.ajusteMs);
}

function limparToques() {
  toques = []; calibResultado = null;
  ui.calibAplicar.disabled = true;
  ui.calibInfo.textContent = '0 toques';
}

el('btn-batida').addEventListener('click', () => { ui.folha.hidden = false; mostrarBatida(); });
el('btn-fechar').addEventListener('click', () => { ui.folha.hidden = true; });
ui.folhaTocar.addEventListener('click', () => ui.btnTocar.click());

ui.bpm.addEventListener('change', () => { Batida.definir({ bpm: parseFloat(ui.bpm.value) }); mostrarBatida(); });
ui.offset.addEventListener('change', () => { Batida.definir({ offsetMs: parseFloat(ui.offset.value) }); mostrarBatida(); });
ui.ajuste.addEventListener('change', () => { Batida.definir({ ajusteMs: parseFloat(ui.ajuste.value) }); mostrarBatida(); });
el('bpm-metade').addEventListener('click', () => { Batida.definir({ bpm: Batida.bpm / 2 }); mostrarBatida(); });
el('bpm-dobro').addEventListener('click', () => { Batida.definir({ bpm: Batida.bpm * 2 }); mostrarBatida(); });
el('metronomo').addEventListener('change', e => Batida.ligarMetronomo(e.target.checked));

ui.folha.querySelectorAll('[data-campo]').forEach(b => b.addEventListener('click', () => {
  const campo = b.dataset.campo, atual = campo === 'bpm' ? Batida.bpm : campo === 'offsetMs' ? Batida.offsetMs : Batida.ajusteMs;
  Batida.definir({ [campo]: atual + parseFloat(b.dataset.passo) });
  mostrarBatida();
}));

ui.detectar.addEventListener('click', () => {
  ui.folhaAviso.textContent = 'Analisando...';
  // Deixa o navegador pintar a mensagem antes do cálculo (que bloqueia a tela por instantes).
  setTimeout(() => {
    const r = Batida.detectar();
    if (!r) { ui.folhaAviso.textContent = 'Não consegui estimar. Calibre por toques.'; return; }
    Batida.definir({ bpm: r.bpm, offsetMs: r.offset * 1000 });
    mostrarBatida();
    ui.folhaAviso.textContent = `Estimativa: ${r.bpm.toFixed(1)} BPM. Confira com o metrônomo; se soar na metade ou no dobro, use ÷2 / ×2.`;
  }, 30);
});

// pointerdown responde mais rápido que click em telas de toque
ui.toque.addEventListener('pointerdown', () => {
  if (!Musica.tocando) { ui.calibInfo.textContent = 'Toque em "Tocar" antes de calibrar.'; return; }
  toques.push(Batida.agora());
  calibResultado = toques.length >= 6 ? Analise.ajustarPorToques(toques) : null;
  ui.calibAplicar.disabled = !calibResultado;
  ui.calibInfo.textContent = calibResultado
    ? `${toques.length} toques · ${calibResultado.bpm.toFixed(1)} BPM · variação ${Math.round(calibResultado.desvioMs)} ms`
    : `${toques.length} toque${toques.length === 1 ? '' : 's'}`;
});
ui.calibAplicar.addEventListener('click', () => {
  if (!calibResultado) return;
  Batida.definir({ bpm: calibResultado.bpm, offsetMs: calibResultado.offset * 1000 });
  mostrarBatida();
  ui.folhaAviso.textContent = 'Calibração aplicada. Ligue o metrônomo para conferir.';
  limparToques();
});
el('calib-limpar').addEventListener('click', limparToques);
