# Júlio vs Karen

Jogo web para dois jogadores. A cada rodada, um escolhe um número de 1 a 50 e o outro procura esse número no tabuleiro, contra o relógio. Vence quem tiver o menor tempo total de busca.

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173/J_vs_K/
npm run build    # gera dist/
```

## Fotos

Coloque `julio.jpg` e `karen.jpg` em `public/avatars/`. Sem elas, o jogo mostra a inicial de cada jogador.

## Ajustes

Em `src/state.ts`:

- `MISS_PENALTY_MS`: penalidade por clique errado (0 = sem penalidade; 1000 = +1 s).
- `COUNTDOWN`: duração da contagem antes de cada busca.

Em `src/anim/challenge.ts`, `BLUR_PX` controla o desfoque do tabuleiro enquanto o número é escolhido. Se ainda der para ler os números, suba para 20.

## Publicar no GitHub Pages

```bash
git remote add origin https://github.com/<seu-usuario>/J_vs_K.git
git push -u origin main
```

No GitHub, vá em **Settings → Pages → Source: GitHub Actions**. O workflow `.github/workflows/deploy.yml` publica a cada push na `main`, em `https://<seu-usuario>.github.io/J_vs_K/`. Se o repositório tiver outro nome, ajuste o `base` em `vite.config.ts`.
