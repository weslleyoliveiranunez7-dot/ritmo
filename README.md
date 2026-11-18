# Jogo de Ritmo

## Tecnologia
HTML5 + Canvas 2D + JavaScript puro, sem dependências nem build.
Áudio: Web Audio API (entra na Etapa 2). Roda em celular e PC.

## Como executar
- Mais simples: abra `index.html` no navegador (duplo clique).
- Pelo celular: coloque a pasta em um servidor local (`python3 -m http.server 8000`) e abra `http://IP-DO-PC:8000`.
- Publicar depois: envie a pasta inteira para GitHub Pages, Netlify ou Vercel.

## Estrutura
- `index.html` telas: inicial e cena
- `css/style.css` visual e layout responsivo
- `js/main.js` navegação entre telas
- `js/scene.js` cena (canvas) com loop de desenho
- `assets/` reservado para sprites e áudio (Etapa 8)
