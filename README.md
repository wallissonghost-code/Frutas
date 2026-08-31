# Frutas — Beta 0.0.2

Jogo de combinação de frutas para integração com lives. Duas frutas iguais se fundem no nível seguinte e somam pontos ao placar.

## Beta 0.0.2

- Interface inicial sem emojis.
- Frutas renderizadas como elementos gráficos próprios em canvas.
- Sprites pré-renderizados por nível para evitar recriar gradientes a cada frame.
- Física atualizada em timestep fixo de 60 Hz, com limite de substeps.
- Matter.js com iterações ajustadas e sleeping habilitado para reduzir custo de CPU.
- DPR do canvas reduzido em telas móveis para aliviar GPU sem perder muita nitidez.
- Movimento do apontador agrupado por `requestAnimationFrame`.
- Verificação de limite/game over desacelerada para não rodar cálculo desnecessário em todo frame.
- Sequência: roxa → vermelha → verde → amarela → laranja → vermelha II → rosa → verde II → verde III → dourada.
- Prévia da próxima fruta e pontuação automática por fusão.
- Linha de perigo e fim de jogo por preenchimento da caixa.
- Controles por toque, mouse e teclado.

## Integração com o painel universal

Compatível com o protocolo do Projeto Daniel: `liveplus-game-manifest-v1` e `liveplus-command-v1`.

Ações disponíveis: `drop_fruit`, `set_next_fruit`, `add_score`, `set_score`, `shake`, `clear_small`, `pause_game` e `reset_game`.

A API local `window.FrutasGame` continua disponível para testes e futuras integrações.

## Publicação

Projeto estático sem etapa de build. A raiz pode ser publicada diretamente por GitHub Pages.
