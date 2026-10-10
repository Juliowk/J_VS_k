# Júlio vs Karen

Jogo web para dois jogadores. A cada rodada, um escolhe um número de 1 a 50 e o outro procura esse número no tabuleiro, contra o relógio. Vence quem tiver o menor tempo total de busca.

Jogue em: https://juliowk.github.io/J_VS_k/

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173/J_VS_k/
npm run build    # gera dist/
```

## Fotos

As fotos dos jogadores ficam em `public/avatars/` (`julio.jpg` e `karen.jpg`). Se uma delas faltar, o jogo mostra a inicial do jogador.

## Ajustes

Em `src/state.ts`:

- `MISS_PENALTY_MS`: penalidade por clique errado (0 = sem penalidade; 1000 = +1 s).
- `COUNTDOWN`: duração da contagem antes de cada busca.

Em `src/anim/challenge.ts`, `BLUR_PX` controla o desfoque do tabuleiro enquanto o número é escolhido. Se ainda der para ler os números, suba para 20.

## Publicação

O workflow `.github/workflows/deploy.yml` publica no GitHub Pages a cada push na `main`. No GitHub, a fonte do Pages precisa estar em **Settings → Pages → Source: GitHub Actions**.

O `base` em `vite.config.ts` precisa ser igual ao nome do repositório, com as mesmas maiúsculas e minúsculas (`/J_VS_k/`).
