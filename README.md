# Jogo de Ritmo

## Tecnologia
HTML5 + Canvas 2D + JavaScript puro, sem dependências nem build. Áudio via Web Audio API.

## Como executar
- Abra `index.html` no navegador (duplo clique), toque em "Entrar na cena" e escolha uma música.
- Celular: sirva a pasta (`python3 -m http.server 8000`) e abra `http://IP-DO-PC:8000`.
- Publicar: envie a pasta para GitHub Pages, Netlify ou Vercel.

## Estrutura
- `index.html` telas e painel de música
- `css/style.css` visual responsivo
- `js/analise.js` detecção de BPM e cálculo por toques (funções puras, testadas)
- `js/beat.js` grade de batidas, relógio do jogo, metrônomo, valores salvos por música
- `tests/analise.test.js` teste: `node tests/analise.test.js`
- `js/audio.js` motor de música (carregar, tocar, pausar, reiniciar, buscar, volume, espectro)
- `js/scene.js` cena e visualizador
- `js/main.js` navegação e controles
- `assets/` reservado para sprites (Etapa 8)

## Limites conhecidos
Formatos aceitos dependem do navegador (MP3, WAV, OGG e M4A costumam funcionar).

## Batida (Etapa 3)
Botão "Batida" na cena: BPM, início da 1ª batida, ajuste de sincronia, metrônomo, "Detectar BPM" e calibração por toques.
A detecção automática é aproximada: pode errar por metade/dobro (use ÷2 e ×2) e não segue músicas com andamento variável.
Os valores ficam salvos no navegador por música (nome + duração).
