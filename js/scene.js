// Cena com visualizador reagindo à música (Etapa 2). Sem inimigos nem jogabilidade ainda.
const Cena = (() => {
  const canvas = document.getElementById('palco');
  const ctx = canvas.getContext('2d');
  let rodando = false;
  let largura = 0, altura = 0;
  let graves = 0; // energia suavizada dos graves (0-1)
  const BARRAS = 40;

  function ajustarTamanho() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = canvas.clientWidth; altura = canvas.clientHeight;
    canvas.width = largura * dpr; canvas.height = altura * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Média de um intervalo de faixas, normalizada de 0 a 1.
  function media(dados, de, ate) {
    let s = 0;
    for (let i = de; i < ate; i++) s += dados[i];
    return s / ((ate - de) * 255);
  }

  // Régua de batidas: as marcas vão em direção à linha central; a batida acontece quando cruzam.
  function desenharReferencia(chao) {
    if (!Musica.carregada) return;
    const agora = Batida.agora(), spb = Batida.spb, off = Batida.offset;
    const cx = largura / 2, y = 104, alcance = 2, meia = largura * 0.44;
    ctx.strokeStyle = 'rgba(243,236,255,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - meia, y); ctx.lineTo(cx + meia, y); ctx.stroke();

    for (let k = Math.max(0, Math.ceil((agora - alcance - off) / spb)); ; k++) {
      const tb = off + k * spb;
      if (tb > agora + alcance) break;
      const x = cx + ((tb - agora) / alcance) * meia;
      const forte = k % 4 === 0, h = forte ? 26 : 14;
      ctx.strokeStyle = forte ? '#ffd84f' : '#4fe3ff';
      ctx.globalAlpha = 1 - Math.abs(tb - agora) / alcance * 0.8;
      ctx.lineWidth = forte ? 4 : 3;
      ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Linha central e anel que pulsa a cada batida
    const k = (agora - off) / spb;
    const flash = k >= 0 ? Math.pow(1 - (k - Math.floor(k)), 3) : 0;
    ctx.strokeStyle = '#ff4fa3'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, y - 20); ctx.lineTo(cx, y + 20); ctx.stroke();
    ctx.globalAlpha = flash;
    ctx.beginPath(); ctx.arc(cx, y, 14 + (1 - flash) * 22, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function desenhar() {
    const dados = Musica.espectro();
    const alvoGraves = dados ? media(dados, 1, 6) : 0;
    graves += (alvoGraves - graves) * 0.35;

    const chao = altura * 0.58;
    const g = ctx.createLinearGradient(0, 0, 0, altura);
    g.addColorStop(0, '#120b24'); g.addColorStop(1, '#2a1658');
    ctx.fillStyle = g; ctx.fillRect(0, 0, largura, altura);

    // Brilho de fundo que pulsa com os graves
    const raio = Math.min(largura, altura) * (0.25 + graves * 0.35);
    const halo = ctx.createRadialGradient(largura / 2, chao, 0, largura / 2, chao, raio);
    halo.addColorStop(0, `rgba(255,79,163,${0.15 + graves * 0.55})`);
    halo.addColorStop(1, 'rgba(255,79,163,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, largura, altura);

    // Barras de frequência saindo do chão, espelhadas
    if (dados) {
      const largBarra = largura / (BARRAS * 2);
      const maxAltura = chao * 0.8;
      for (let i = 0; i < BARRAS; i++) {
        // Distribui as barras de forma logarítmica: mais detalhe nos graves
        const de = Math.floor(Math.pow(i / BARRAS, 2) * 180) + 1;
        const v = media(dados, de, de + 3);
        const h = Math.max(3, v * maxAltura);
        ctx.fillStyle = `hsl(${190 + i * 3}, 90%, ${55 + v * 20}%)`;
        ctx.fillRect(largura / 2 + i * largBarra, chao - h, largBarra - 2, h);
        ctx.fillRect(largura / 2 - (i + 1) * largBarra, chao - h, largBarra - 2, h);
      }
    }

    ctx.strokeStyle = '#4fe3ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, chao); ctx.lineTo(largura, chao); ctx.stroke();

    // Marcador provisório do personagem, com leve pulso (substituído na Etapa 8)
    const escala = 1 + graves * 0.25;
    ctx.fillStyle = '#ff4fa3';
    ctx.fillRect(largura / 2 - 18 * escala, chao - 56 * escala, 36 * escala, 56 * escala);

    desenharReferencia(chao);

    if (!Musica.carregada) {
      ctx.fillStyle = 'rgba(243,236,255,.75)';
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Escolha uma música para começar', largura / 2, chao + 40);
    }
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
