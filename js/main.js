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
  ui.btnTocar.textContent = Musica.tocando ? 'Pausar' : (pos > 0 ? 'Continuar' : 'Tocar');
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
    atualizarUi();
  }
}

el('btn-jogar').addEventListener('click', () => mostrar('cena'));
el('btn-voltar').addEventListener('click', () => mostrar('inicial'));
ui.btnArquivo.addEventListener('click', () => ui.arquivo.click());

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
