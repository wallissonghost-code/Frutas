# Frutas — Beta 0.0.8

Jogo de combinação de frutas para integração com lives. Duas frutas iguais se fundem no nível seguinte e somam pontos ao placar.

## Core consolidado

O jogo roda diretamente pelo `game.js` local do repositório. Não existe mais carregamento de um core antigo por CDN nem patch de código com `fetch`, `replace` ou `new Function`.

A sequência atual possui 10 tiers, numerados internamente de 0 a 9:

roxa → vermelha → verde → amarela → laranja → vermelha II → rosa → verde II → verde III → dourada.

Pontuação por formação de tier:

- Tier 1: +2
- Tier 2: +4
- Tier 3: +8
- Tier 4: +16
- Tier 5: +30
- Tier 6: +50
- Tier 7: +80
- Tier 8: +120
- Tier 9: +180
- Tier 9 + Tier 9: as duas desaparecem e concedem +500 de bônus final.

## Persistência

O estado da partida é salvo no `localStorage`, incluindo pontuação, frutas, tiers, posições, velocidades, escalas, próxima fruta, pausa e estado de fim de jogo. O jogo salva ao sair para segundo plano, em eventos importantes e periodicamente enquanto está aberto.

O código do painel também permanece salvo e o jogo tenta reconectar automaticamente quando volta a ficar visível ou quando a página é recriada pelo navegador.

## Interações da live

O painel universal expõe apenas as seis ações destinadas à live:

- `live_restart` — Recomeçar
- `remove_points` — Remover pontos
- `giant_fruit` — Fruta gigante
- `fruit_rain` — Chuva de frutas
- `second_chance` — Segunda chance
- `mini_fruits` — Mini frutas

O HUD das interações mostra imagem do presente, nome e descrição do efeito. O valor do presente é usado internamente apenas para ordenação.

## Mobile

- Controles por toque, mouse e teclado.
- Canvas adaptado ao tamanho real do campo.
- DPR limitado em telas móveis para reduzir carga na GPU.
- Física em timestep fixo de 60 Hz, com limite de substeps.
- Gestos e double tap bloqueados somente na área do jogo, sem interferir no modal do painel.

## Estrutura

- `index.html` — boot e interface principal.
- `game.js` — core da física, tiers, pontuação, persistência e API local.
- `live-actions.js` — ações da live, HUD e reconexão automática.
- `mobile-input-fix.js` — correções de input mobile.
- `styles.css` — interface.
- `version.json` — identificação da versão.

## API local

`window.FrutasGame` permanece disponível para integração e testes. Entre os métodos expostos estão `dropFruit`, `executeCommand`, `getState`, `getBodies`, `saveGame`, `restoreGame`, `connectPanel` e `reset`.

## Publicação

Projeto estático, sem etapa de build. A raiz pode ser publicada diretamente por GitHub Pages.
