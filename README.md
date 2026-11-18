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
- `js/audio.js` motor de música (carregar, tocar, pausar, reiniciar, buscar, volume, espectro)
- `js/scene.js` cena e visualizador
- `js/main.js` navegação e controles
- `assets/` reservado para sprites (Etapa 8)

## Limites conhecidos
Formatos aceitos dependem do navegador (MP3, WAV, OGG e M4A costumam funcionar).
