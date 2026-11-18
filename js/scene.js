// Cena vazia: fundo, chão e marcador do personagem. Sem jogabilidade ainda (Etapa 1).
const Cena = (() => {
  const canvas = document.getElementById('palco');
  const ctx = canvas.getContext('2d');
  let rodando = false;
  let largura = 0, altura = 0;

  function ajustarTamanho() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = canvas.clientWidth; altura = canvas.clientHeight;
    canvas.width = largura * dpr; canvas.height = altura * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function desenhar() {
    const chao = altura * 0.72;
    const g = ctx.createLinearGradient(0, 0, 0, altura);
    g.addColorStop(0, '#120b24'); g.addColorStop(1, '#2a1658');
    ctx.fillStyle = g; ctx.fillRect(0, 0, largura, altura);

    ctx.strokeStyle = '#4fe3ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, chao); ctx.lineTo(largura, chao); ctx.stroke();

    // Marcador provisório do personagem (será substituído na Etapa 8)
    ctx.fillStyle = '#ff4fa3';
    ctx.fillRect(largura / 2 - 18, chao - 56, 36, 56);

    ctx.fillStyle = 'rgba(243,236,255,.7)';
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Cena vazia — a música entra na Etapa 2', largura / 2, altura * 0.88);
  }

  function quadro() {
    if (!rodando) return;
    desenhar();
    requestAnimationFrame(quadro);
  }

  function iniciar() { ajustarTamanho(); rodando = true; quadro(); }
  function parar() { rodando = false; }
  window.addEventListener('resize', () => { if (rodando) ajustarTamanho(); });

  return { iniciar, parar };
})();
