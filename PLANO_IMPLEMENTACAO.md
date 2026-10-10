# Júlio vs Karen — Plano de Implementação

Jogo web para dois jogadores fixos (Júlio e Karen). A cada rodada, um jogador escolhe um número de 1 a 50 e o outro procura esse número no tabuleiro, contra o relógio. Vence quem tiver o **menor tempo total** de busca.

> O foco deste projeto são as **animações e transições**. Cada mudança de estado tem uma animação própria, e nenhuma troca de tela acontece "seca".

---

## 1. Stack

| Item | Escolha | Por quê |
|---|---|---|
| Build | **Vite** (template `vanilla-ts`) | Rápido, zero configuração, deploy estático |
| Linguagem | **TypeScript** (strict) | Tipagem da máquina de estados |
| Animação | **GSAP 3** | Timelines encadeáveis, cancelamento e easings |
| Estilo | CSS puro com variáveis (tokens) | Sem framework, controle total |
| Fontes | Google Fonts: Anton, Fredoka, Space Grotesk | Uma para cada lado, mais uma neutra |
| Deploy | GitHub Pages (GitHub Actions) | Gratuito, direto do repositório |

---

## 2. Setup inicial

```bash
cd C:\Users\julio\Downloads\projetos\J_vs_K
git init -b main
npm create vite@latest . -- --template vanilla-ts
npm install
npm install gsap
```

Apague os arquivos de exemplo do Vite (`counter.ts`, `typescript.svg`, `public/vite.svg` e o conteúdo de `style.css`).

Crie a pasta `public/avatars/` e coloque nela as duas fotos:
- `public/avatars/julio.jpg`: o gato com máscara
- `public/avatars/karen.jpg`: a foto de perfil roxa da Karen

`.gitignore` (o Vite já cria um; confira se tem estas linhas):
```
node_modules
dist
.DS_Store
```

`vite.config.ts` (o `base` precisa ter o nome do repositório no GitHub):
```ts
import { defineConfig } from 'vite';
export default defineConfig({ base: '/J_vs_K/' });
```

**Commit:** `chore: setup Vite + TypeScript + GSAP`

---

## 3. Estrutura de pastas

```
J_vs_K/
├─ index.html
├─ vite.config.ts
├─ public/
│  └─ avatars/  julio.jpg  karen.jpg
└─ src/
   ├─ main.ts              # ponto de entrada: monta a UI e liga os eventos
   ├─ types.ts             # tipos compartilhados
   ├─ players.ts           # dados fixos dos dois jogadores
   ├─ state.ts             # máquina de estados + placar
   ├─ board.ts             # geração e posicionamento das 50 fichas
   ├─ timer.ts             # cronômetro de alta precisão
   ├─ fullscreen.ts        # helper de tela cheia
   ├─ ui/
   │  ├─ dom.ts            # helpers ($, criar elementos)
   │  ├─ hud.ts            # placar do topo (alvo, timer, totais)
   │  ├─ keypad.ts         # painel de escolha do número
   │  └─ screens.ts        # mostrar/ocultar telas
   ├─ anim/
   │  ├─ easings.ts        # easings e durações padrão
   │  ├─ ambient.ts        # morcegos, estrelas, pulsos contínuos
   │  ├─ intro.ts          # choque dos painéis + VS
   │  ├─ slot.ts           # caça-níquel de quem começa
   │  ├─ spawn.ts          # surgimento das fichas
   │  ├─ challenge.ts      # embaçar + painel de escolha
   │  ├─ reveal.ts         # morph do alvo + 3-2-1 + desembaçar
   │  ├─ mark.ts           # acerto: pop, X, partículas, tempo voando
   │  ├─ miss.ts           # clique errado
   │  ├─ turnSwap.ts       # cortina diagonal de troca de vez
   │  └─ victory.ts        # tela final
   └─ styles/
      ├─ tokens.css        # cores, fontes, z-index
      ├─ base.css          # reset + layout versus
      ├─ board.css         # fichas e estados
      ├─ slot.css          # máquina caça-níquel
      └─ hud.css           # placar, keypad, botões
```

---

## 4. Design tokens (`styles/tokens.css`)

```css
:root {
  /* Júlio — Vigilante Noturno */
  --j-bg: #0E1322;
  --j-steel: #5B6B85;
  --j-accent: #F2A93B;
  --j-muted: #9AA6BC;

  /* Karen — Gótica Fofa */
  --k-bg: #1E0D26;
  --k-purple: #6B3FA0;
  --k-accent: #FF5FA2;
  --k-muted: #E9D7FF;

  /* Neutros */
  --ink: #0B0F1A;
  --bone: #EDE6DA;
  --bone-border: #CFC6B6;
  --error: #E5484D;

  /* Cor do jogador ativo (trocada via JS) */
  --active: var(--k-accent);

  --font-j: 'Anton', sans-serif;
  --font-k: 'Fredoka', sans-serif;
  --font-ui: 'Space Grotesk', sans-serif;

  --chip: clamp(56px, 5.8vw, 92px);   /* tamanho da ficha */
  --diag: polygon(0 0, 58% 0, 42% 100%, 0 100%);
  --diag-k: polygon(58% 0, 100% 0, 100% 100%, 42% 100%);
}
```

Use sempre unidades `vw`/`vh`/`clamp()`, para o jogo se ajustar a qualquer monitor em tela cheia (F11).

---

## 5. Tipos e dados (`types.ts`, `players.ts`)

```ts
// types.ts
export type PlayerId = 'julio' | 'karen';

export interface Player {
  id: PlayerId;
  name: string;
  avatar: string;
  accent: string;
  font: string;
}

export interface Chip {
  n: number;          // 1..50
  x: number;          // % da largura do tabuleiro
  y: number;          // % da altura
  rot: number;        // graus
  markedBy?: PlayerId;
  el: HTMLButtonElement;
}

export interface Round {
  index: number;
  chooser: PlayerId;  // quem escolheu
  seeker: PlayerId;   // quem procurou
  target: number;
  timeMs?: number;
  misses: number;
}

export type Phase =
  | 'MENU' | 'INTRO' | 'SORTEIO' | 'SPAWN'
  | 'DESAFIO' | 'REVELACAO' | 'BUSCA' | 'ACERTO'
  | 'TROCA' | 'FIM';
```

```ts
// players.ts
const base = import.meta.env.BASE_URL;
export const PLAYERS = {
  julio: { id: 'julio', name: 'Júlio', avatar: `${base}avatars/julio.jpg`, accent: '#F2A93B', font: 'var(--font-j)' },
  karen: { id: 'karen', name: 'Karen', avatar: `${base}avatars/karen.jpg`, accent: '#FF5FA2', font: 'var(--font-k)' },
} as const;
export const other = (p: PlayerId): PlayerId => (p === 'julio' ? 'karen' : 'julio');
```

---

## 6. Regras do jogo

1. **Início:** o caça-níquel sorteia quem **escolhe** o primeiro número.
2. **Rodada:**
   - O *chooser* digita um número de 1 a 50 que ainda não foi marcado.
   - A tela desembaça, aparece a contagem 3-2-1 e o cronômetro dispara.
   - O *seeker* procura e clica. Se errar, a ficha treme. Por padrão não há penalidade, mas dá para configurar `MISS_PENALTY_MS`.
   - Ao acertar, o tempo é somado ao total do *seeker*, a ficha recebe um X e é desabilitada.
3. **Alternância:** quem procurou passa a escolher. Os papéis invertem a cada rodada.
4. **Fim:** quando os 50 números forem marcados ou ao clicar em **Encerrar partida**.
5. **Vencedor:** o menor tempo total.
   - Se um jogador tiver procurado uma vez a mais que o outro (por exemplo, quando a partida é encerrada no meio), compare pelo **tempo médio por busca**.
   - Empate exato: "EMPATE!" com os dois lados iguais.

Constantes em `state.ts`:
```ts
export const TOTAL = 50;
export const MISS_PENALTY_MS = 0;   // ex.: 1000 para +1 s por erro
export const COUNTDOWN = 3;
```

---

## 7. Máquina de estados (`state.ts`)

```
MENU ─JOGAR─▶ INTRO ─▶ SORTEIO ─▶ SPAWN ─▶ DESAFIO ─confirmar─▶ REVELACAO ─▶ BUSCA
                                              ▲                                 │ acerto
                                              │                                 ▼
                                            TROCA ◀──────── (restam números) ─ ACERTO
                                                                                │ acabou / encerrar
                                                                                ▼
                                                                               FIM ─revanche─▶ INTRO
```

Pontos de implementação:
- Um único objeto `game` guarda `phase`, `chooser`, `seeker`, `totals`, `rounds` e `chips`.
- `go(phase)` é a **única** forma de mudar de fase. Ela grava a fase em `document.body.dataset.phase` (útil para CSS) e chama a animação de entrada daquela fase.
- **Bloqueio de input:** `game.locked = true` enquanto uma timeline roda. Os handlers de clique ignoram eventos se `locked`. Use `tl.eventCallback('onComplete', ...)` para liberar.
- Toda animação retorna uma `gsap.core.Timeline`, e o fluxo usa `await tl` (timelines GSAP são "thenable").

```ts
async function go(next: Phase) {
  game.phase = next;
  document.body.dataset.phase = next;
  game.locked = true;
  await transitions[next]();   // cada uma retorna a timeline
  game.locked = false;
}
```

---

## 8. Tabuleiro (`board.ts`)

**Objetivo:** 50 fichas simultâneas, embaralhadas, sem sobreposição, com rotação leve.

Algoritmo (grade com variação aleatória, nunca sobrepõe):
1. Embaralhe `[1..50]` com Fisher-Yates.
2. Use uma grade de **10 colunas × 5 linhas**. Cada célula mede 10% × 20% da área do tabuleiro.
3. Dentro de cada célula, desloque a ficha aleatoriamente até ±25% do tamanho da célula, e aplique uma rotação aleatória entre −14° e +14°.
4. Guarde `x` e `y` em **porcentagem** (`left`/`top` em %), para o layout se ajustar sozinho ao redimensionar.

```ts
export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function layout(): Omit<Chip, 'el'>[] {
  const nums = shuffle(Array.from({ length: 50 }, (_, i) => i + 1));
  const COLS = 10, ROWS = 5;
  return nums.map((n, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    const jitter = () => (Math.random() - 0.5) * 0.5;   // ±25% da célula
    return {
      n,
      x: ((c + 0.5 + jitter()) / COLS) * 100,
      y: ((r + 0.5 + jitter()) / ROWS) * 100,
      rot: (Math.random() - 0.5) * 28,
    };
  });
}
```

Cada ficha é um `<button class="chip" data-n="38" aria-label="Número 38">`, com `transform: translate(-50%,-50%) rotate(var(--rot))`.

O tabuleiro **não é re-embaralhado** entre rodadas, só numa partida nova. Assim a memória espacial também faz parte do jogo.

> Opcional: um botão "Embaralhar a cada rodada" nas configurações. Ele chama `layout()` de novo e anima as fichas até as novas posições com `gsap.to(..., { left, top })`.

---

## 9. Cronômetro (`timer.ts`)

- Use `performance.now()`, nunca `Date.now()`.
- Atualize o HUD com `requestAnimationFrame` no formato `mm:ss.cc`, usando `font-variant-numeric: tabular-nums` para os dígitos não "pularem".
- O cronômetro começa **no `onComplete` do desembaçar**, nem antes nem depois.

```ts
export class Timer {
  private start = 0; private raf = 0; elapsed = 0;
  constructor(private onTick: (ms: number) => void) {}
  begin() { this.start = performance.now(); this.loop(); }
  private loop = () => {
    this.elapsed = performance.now() - this.start;
    this.onTick(this.elapsed);
    this.raf = requestAnimationFrame(this.loop);
  };
  stop() { cancelAnimationFrame(this.raf); return this.elapsed; }
}

export const fmt = (ms: number) => {
  const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(c).padStart(2,'0')}`;
};
```

---

## 10. Animações (o coração do projeto)

### 10.1 Padrões gerais (`anim/easings.ts`)

```ts
export const EASE = {
  out: 'power3.out',
  in: 'power3.in',
  bounce: 'back.out(1.6)',
  spring: 'elastic.out(1, 0.6)',
  snap: 'expo.out',
};
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const D = (s: number) => (reduced ? 0.01 : s);   // encurta tudo se reduced
```

Regras:
- Nada se move em ritmo linear, exceto o giro dos rolos do caça-níquel e as animações ambientes.
- Anime apenas `transform`, `opacity` e `filter`, que são baratos para a GPU. Nunca anime `width`, `height` ou `top` durante o jogo.
- Use `will-change: transform` nas fichas e nos painéis.
- Com `prefers-reduced-motion`, troque movimentos por fades curtos.

### 10.2 Ambiente contínuo (`anim/ambient.ts`)

| Elemento | Animação |
|---|---|
| "VS" no menu | escala 1 → 1,06 e brilho pulsando, `yoyo`, 1,2 s, `sine.inOut` |
| Fotos | "respiração" 1 → 1,03, 2,4 s, defasadas entre si |
| Morcegos (lado Júlio) | 3 SVGs atravessam a tela em arco, em 8–14 s, com atraso aleatório e `repeat: -1` |
| Estrelas e corações (lado Karen) | piscam (opacidade 0,2 → 1) e flutuam ±8 px, com tempos aleatórios |
| Neblina (lado Júlio) | gradiente translúcido deslizando em `x`, 20 s, em loop |

As animações ambientes ficam numa `gsap.timeline()` própria e vão para **25% de velocidade** durante a BUSCA (`ambientTl.timeScale(0.25)`), para não distrair.

### 10.3 Intro: choque dos painéis (`anim/intro.ts`, cerca de 1,6 s)

```ts
tl.from('.side-j', { xPercent: -100, duration: D(0.6), ease: 'power4.in' })
  .from('.side-k', { xPercent: 100,  duration: D(0.6), ease: 'power4.in' }, '<')
  .to('.flash', { opacity: 1, duration: 0.05 })            // flash branco no impacto
  .to('.flash', { opacity: 0, duration: D(0.4) })
  .to('#app', { x: 'random(-6, 6)', y: 'random(-6, 6)', duration: 0.04, repeat: 7, yoyo: true }, '<') // tremor
  .set('#app', { x: 0, y: 0 })
  .from('.vs', { scale: 3, opacity: 0, duration: D(0.5), ease: EASE.bounce }, '-=0.3')
  .from('.avatar-j', { x: -80, opacity: 0, duration: D(0.4), ease: EASE.out }, '-=0.3')
  .from('.avatar-k', { x: 80,  opacity: 0, duration: D(0.4), ease: EASE.out }, '<');
```

Antes dela, a tela do menu sai: o botão JOGAR encolhe (escala 0,9), some, e o fundo escurece.

### 10.4 Sorteio: caça-níquel (`anim/slot.ts`, cerca de 4 s)

**Estrutura:** 3 rolos (`.reel`). Cada um tem uma faixa vertical (`.strip`) com cerca de 20 símbolos repetidos e o símbolo final no fim. Uma máscara com `overflow: hidden` mostra 3 símbolos, e o do meio fica na linha de vitória.

Símbolos (SVG próprios, originais):
- **Júlio:** morcego e lua
- **Karen:** caveirinha e laço

**Lógica:** o vencedor é sorteado **antes** (`Math.random() < 0.5`). A faixa de cada rolo é montada para terminar no símbolo vencedor: morcegos para o Júlio, caveirinhas para a Karen.

Sequência:
1. A máquina cai do topo: `y: -120vh → 0`, `back.out(1.2)`, 0,7 s.
2. As lâmpadas do topo começam a piscar, alternando âmbar e rosa a 0,15 s.
3. A alavanca desce (rotação 0 → 35° → 0), 0,4 s, com um leve tremor na máquina.
4. Os rolos giram: `y` da faixa até `-(alturaFaixa - alturaJanela)`.
   - Rolo 1: 1,6 s · Rolo 2: 2,1 s · Rolo 3: 2,8 s (todos partem juntos).
   - Ease: `power2.inOut` em `custom`, ou duas tweens: aceleração `power2.in` e frenagem `back.out(2)` para dar o **tranco** ao parar.
   - Durante o giro: `filter: blur(3px)` vertical (SVG `feGaussianBlur stdDeviation="0 4"`), removido na frenagem.
5. A cada parada: um "clack" (escala do rolo 1 → 0,97 → 1, 0,1 s).
6. **Suspense:** antes de o terceiro rolo parar, ele desacelera mais e "quase passa" do símbolo, voltando com `back.out`.
7. Trinca fechada:
   - A linha de vitória pisca 3 vezes.
   - As lâmpadas passam para a cor do vencedor, piscando rápido.
   - A faixa "JÚLIO COMEÇA!" entra com rotação −12° → −2°, escala 0 → 1, `elastic.out`.
   - O avatar de quem começa cresce até 1,15 com brilho, e o outro vai para `opacity 0.4` e `grayscale(0.7)`.
   - Partículas de moedinhas ou estrelas na cor do vencedor.
8. Saída: a máquina sobe (`y: -120vh`, `power3.in`) e a faixa some com um fade.

> **Atenção ao texto:** quem ganha o sorteio **escolhe** o primeiro número. A faixa diz "JÚLIO COMEÇA!" e, logo abaixo, em letra menor, "escolhe o primeiro número".

### 10.5 Surgimento das fichas (`anim/spawn.ts`, cerca de 1,2 s, só na primeira rodada)

```ts
gsap.from('.chip', {
  left: '50%', top: '50%',          // saem do centro (única exceção ao "não animar top/left")
  scale: 0, rotation: 0, opacity: 0,
  duration: D(0.7),
  ease: EASE.bounce,
  stagger: { each: 0.015, from: 'random' },
});
```

Alternativa mais leve: animar `x`/`y` a partir de um deslocamento calculado até o centro, usando só transform.

### 10.6 Desafio: embaçar + escolha (`anim/challenge.ts`, cerca de 0,5 s)

1. O tabuleiro vai de `filter: blur(0) brightness(1)` para `blur(14px) brightness(0.6)`, em 0,4 s.
2. `--active` recebe a cor do *chooser*. A borda brilhante da tela (`.frame-glow`, `box-shadow inset`) faz um fade cruzado para a nova cor.
3. O painel do keypad sobe: `y: 60 → 0`, `scale: 0.9 → 1`, `opacity 0 → 1`, `back.out(1.4)`.
4. O avatar do *chooser* no painel entra com um pequeno giro (rotação −10° → 0).

**Keypad (`ui/keypad.ts`):**
- Teclado físico e clique ao mesmo tempo (0–9, Backspace, Enter).
- Cada tecla, ao ser pressionada, afunda (escala 0,92 → 1), em 0,12 s.
- O número digitado aparece com um efeito de "flip" (`rotationX: -90 → 0`).
- **Validação:**
  - fora de 1–50 ou já marcado: o campo treme (`x: [-10, 10, -6, 6, 0]`, 0,3 s), a borda fica vermelha e a mensagem "Esse número já foi" aparece;
  - válido: o botão LANÇAR DESAFIO pulsa na cor do jogador.
- **Privacidade:** o jogador que vai procurar não pode ver as fichas. Com o tabuleiro embaçado a 14 px, os números ficam ilegíveis. Se ainda der para ler, aumente o desfoque para 20 px.

### 10.7 Revelação: morph + 3-2-1 + desembaçar (`anim/reveal.ts`, cerca de 2 s)

1. **Morph (técnica FLIP):** o número grande do painel viaja até a posição do "ACHE O 38" no HUD.
   - Meça `getBoundingClientRect()` da origem e do destino, e anime `x`, `y` e `scale` de um clone flutuante. Ao terminar, mostre o elemento real do HUD e remova o clone.
   - Ao mesmo tempo, o restante do painel encolhe e some (escala 0,8, opacidade 0).
2. **Troca de iluminação:** o lado do *seeker* acende e o do *chooser* escurece (`.dim` com overlay 50%), em 0,4 s. `--active` passa para a cor do *seeker*.
3. **Contagem 3-2-1:** cada número entra no centro com `scale: 2.5 → 1`, `opacity 0 → 1`, segura um instante e sai com `scale: 0.6`, `opacity 0`. Ciclo de 0,6 s. O "1" sai explodindo (escala 3, opacidade 0).
4. **Desembaçar:** `blur(14px) → blur(0)`, em 0,25 s, com `expo.out`. É rápido de propósito.
5. **No `onComplete`:** `timer.begin()` e `game.locked = false`.

### 10.8 Busca (estado contínuo)

- **Vinheta de tensão:** `.frame-glow` pulsa na cor do *seeker*. O período começa em 1,6 s e cai para 0,6 s depois de 10 s (`pulseTl.timeScale(2.6)`).
- **Hover da ficha (CSS):**
  ```css
  .chip:not(:disabled):hover {
    transform: translate(-50%,-50%) rotate(var(--rot)) translateY(-4px) scale(1.08);
    border-color: var(--active);
    box-shadow: 0 0 24px color-mix(in srgb, var(--active) 80%, transparent);
    transition: transform .12s ease-out, box-shadow .12s;
  }
  ```
- O timer no HUD fica na cor do *seeker*. Depois de 20 s, ele ganha um leve tremor de 0,5 px.

### 10.9 Clique errado (`anim/miss.ts`, cerca de 0,3 s)

```ts
gsap.timeline()
  .to(chip, { x: '+=8', duration: 0.05, repeat: 5, yoyo: true })
  .to(chip, { backgroundColor: 'var(--error)', duration: 0.05 }, 0)
  .to(chip, { backgroundColor: 'var(--bone)', duration: 0.25 });
```

Se `MISS_PENALTY_MS > 0`, um "+1s" vermelho sobe a partir do timer e some.

### 10.10 Acerto (`anim/mark.ts`, cerca de 1,2 s)

Sequência, com sobreposições:
1. `timer.stop()`, e o HUD do timer pisca em branco uma vez.
2. **Pop:** a ficha vai para `scale: 1.35` (0,15 s, `power2.out`) e depois para `scale: 1` (0,3 s, `back.out(2)`).
3. **X desenhado:** um SVG com 2 `<path>` sobre a ficha. Cada traço anima `stroke-dashoffset` de `len` até `0`, 0,18 s cada, o segundo começando 0,08 s depois do primeiro.
4. **Cor:** o fundo vai de `--bone` para a cor do *seeker* (0,2 s). Em seguida, `opacity` vai para 0,5 e `disabled = true`. Acrescente a classe `.marked-julio` ou `.marked-karen`.
5. **Partículas:** cerca de 18 `div` (ou um `<canvas>`) saindo do centro da ficha em ângulos aleatórios, com 80–160 px de alcance, gravidade leve (`y: '+=40'` no fim), `scale → 0` e duração de 0,6–0,9 s, na cor do *seeker*.
   - Júlio: pequenos losangos âmbar.
   - Karen: coraçõezinhos e estrelinhas rosa.
6. **Tempo voando:** um clone do texto do timer (por exemplo, "04.27") voa em arco até o total do *seeker* no HUD, com `motionPath` ou duas tweens (x linear + y `power2.out`), e escala 1 → 0,5.
7. **Contador rolando:** o total do *seeker* conta do valor antigo até o novo (`gsap.to(obj, { v: novo, onUpdate: render })`, 0,6 s). Ao terminar, faz um pulso (escala 1,15 → 1).
8. Chame `go('TROCA')` ou, se `marcados === 50`, `go('FIM')`.

### 10.11 Troca de vez (`anim/turnSwap.ts`, cerca de 0,6 s)

1. **Cortina diagonal:** um `div` em tela cheia com a cor do próximo *chooser* e `clip-path` diagonal, entrando com `xPercent: -110 → 110` (Júlio, da esquerda) ou `110 → -110` (Karen, da direita). Duração de 0,6 s, `power3.inOut`.
2. No meio da cortina (`'<50%'`): troque `--active`, inverta as classes `.dim` dos lados e reset o "ACHE O" do HUD para "—".
3. Um rótulo grande atravessa junto com a cortina: "VEZ DA KAREN ESCOLHER", na fonte do jogador.
4. Termina chamando `go('DESAFIO')`.

### 10.12 Fim de jogo (`anim/victory.ts`, cerca de 2,5 s)

1. As fichas restantes caem: `y: '+=100vh'`, `rotation: random`, `stagger 0.01`, `power2.in`.
2. **Diagonal avança:** anime a variável CSS do `clip-path` (`--split: 58% → 74%` no topo e `42% → 62%` embaixo, ou o inverso se a Karen vencer). Registre as variáveis com `@property` para elas serem animáveis, ou anime um objeto via GSAP e reaplique o `clip-path` no `onUpdate`.
3. O lado de quem perdeu: `grayscale(1)`, `opacity 0.6` e foto menor.
4. **Foto do vencedor:** escala 0 → 1, `elastic.out`, com brilho forte.
5. **Coroa** (SVG próprio) cai sobre a foto: `y: -300 → 0`, `bounce.out`.
6. O texto "VITÓRIA · MENOR TEMPO" entra letra por letra (divida em `<span>` e use `stagger 0.03`).
7. **Estatísticas** (tempo total, tempo médio, busca mais rápida e qual número) entram de baixo com `stagger 0.1`, e os números contam de 0 até o valor final.
8. **Confete:** 120 partículas na cor do vencedor, com `canvas` e física simples (gravidade + rotação), durante 3 s.
9. Botões **REVANCHE** (volta para INTRO com tabuleiro novo e totais zerados) e **MENU**.

---

## 11. HUD (`ui/hud.ts`)

Barra superior fixa com cerca de 14vh de altura:

```
[foto][JÚLIO  48,6 s total] [ESCOLHEU]   ACHE O 38 | 00:04.27   [PROCURANDO] [Karen  52,1 s total][foto]
```

- O rótulo de papel (ESCOLHEU / PROCURANDO) troca com um fade cruzado a cada rodada.
- Abaixo do tabuleiro: "RODADA 9 · 42 RESTANTES" e o botão **ENCERRAR PARTIDA**, que pede confirmação num modal próprio (não use `confirm()`).

---

## 12. Tela cheia (`fullscreen.ts`)

```ts
export async function enterFullscreen() {
  if (!document.fullscreenElement) {
    try { await document.documentElement.requestFullscreen(); } catch { /* ignorado */ }
  }
}
```

Chame dentro do clique em **JOGAR**: o navegador só permite tela cheia a partir de uma ação do usuário. O F11 também funciona, e o layout é o mesmo nos dois casos.

---

## 13. Acessibilidade e detalhes

- As fichas são `<button>` de verdade, com `aria-label`, e as marcadas usam o atributo `disabled`.
- Contraste: texto escuro (`#141217`) sobre a ficha cor osso, e texto escuro sobre as fichas marcadas em âmbar ou rosa.
- Os jogadores se distinguem também por **forma** e não só por cor: hexágono para o Júlio, círculo para a Karen, e partículas diferentes.
- `prefers-reduced-motion`: veja 10.1.
- Bloqueie a seleção de texto e o menu de contexto no tabuleiro (`user-select: none`).

---

## 14. Sons (opcional, fase 5)

Use arquivos curtos em `public/sfx/`, tocados com `new Audio().play()` ou WebAudio:
- giro do caça-níquel (loop), clack de cada rolo, jackpot
- tecla do keypad, contagem 3-2-1, "go"
- acerto, erro, vitória

Inclua um botão de mudo no canto, com o estado salvo em `localStorage`.

---

## 15. Ordem de construção e commits

Faça um commit ao fim de cada etapa (Conventional Commits).

| # | Etapa | Entregável | Commit |
|---|---|---|---|
| 1 | Setup | Vite + TS + GSAP, fotos em `public/avatars` | `chore: setup Vite + TypeScript + GSAP` |
| 2 | Layout versus | Tela dividida na diagonal, tokens, fontes, menu estático | `feat: layout versus e design tokens` |
| 3 | Tabuleiro | 50 fichas posicionadas, estados CSS (ativa, hover, marcada) | `feat: tabuleiro com 50 fichas embaralhadas` |
| 4 | Lógica | Máquina de estados, keypad, turnos, cronômetro, totais (sem animação) | `feat: lógica de turnos, cronômetro e placar` |
| 5 | Fim de jogo (lógica) | Vencedor por tempo total ou médio, revanche | `feat: fim de jogo e revanche` |
| 6 | Anim: acerto + erro | 10.9 e 10.10 | `feat(anim): acerto e clique errado` |
| 7 | Anim: desafio + revelação | 10.6 e 10.7 | `feat(anim): embaçar, morph do alvo e contagem` |
| 8 | Anim: troca de vez | 10.11 | `feat(anim): cortina de troca de vez` |
| 9 | Anim: caça-níquel | 10.4 | `feat(anim): sorteio caça-níquel` |
| 10 | Anim: intro + ambiente + spawn | 10.2, 10.3 e 10.5 | `feat(anim): intro, ambiente e surgimento` |
| 11 | Anim: vitória | 10.12 | `feat(anim): tela de vitória com confete` |
| 12 | Polimento | reduced-motion, sons, modal de encerrar | `feat: sons, acessibilidade e polimento` |
| 13 | Deploy | GitHub Actions + Pages | `ci: deploy no GitHub Pages` |

> Fazer a lógica antes das animações (etapas 4 e 5) garante que o jogo funcione de ponta a ponta. Depois, cada animação só "veste" uma transição que já existe.

---

## 16. Publicação no GitHub

```bash
git remote add origin https://github.com/<seu-usuario>/J_vs_K.git
git push -u origin main
```

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.d.outputs.page_url }}' }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

No GitHub, vá em **Settings → Pages → Source: GitHub Actions**. O site ficará em `https://<seu-usuario>.github.io/J_vs_K/`.

---

## 17. Checklist de teste

- [ ] O sorteio dá resultados variados ao longo de várias partidas (mais ou menos 50/50).
- [ ] Não é possível escolher um número já marcado nem fora de 1–50.
- [ ] Os números ficam ilegíveis no tabuleiro embaçado.
- [ ] O cronômetro só começa quando o desembaçar termina e para no clique certo.
- [ ] Cliques durante as animações são ignorados.
- [ ] Clique em ficha errada não marca nada.
- [ ] Os totais somam corretamente, e o vencedor é o de menor tempo (ou menor média, se o número de buscas for desigual).
- [ ] Encerrar no meio da partida funciona.
- [ ] A revanche zera tudo e embaralha de novo.
- [ ] Layout correto em 1366×768, 1920×1080 e 2560×1440, em tela cheia.
- [ ] Com `prefers-reduced-motion` ativado, o jogo continua jogável.
- [ ] Animações rodando a 60 fps (DevTools → Performance).
