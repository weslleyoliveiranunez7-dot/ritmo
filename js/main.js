// Navegação entre telas. Mais telas (música, resultado) chegam nas próximas etapas.
const telas = {
  inicial: document.getElementById('tela-inicial'),
  cena: document.getElementById('tela-cena'),
};

function mostrar(nome) {
  Object.values(telas).forEach(t => t.classList.remove('ativa'));
  telas[nome].classList.add('ativa');
  if (nome === 'cena') Cena.iniciar(); else Cena.parar();
}

document.getElementById('btn-jogar').addEventListener('click', () => mostrar('cena'));
document.getElementById('btn-voltar').addEventListener('click', () => mostrar('inicial'));
