# Frutas — Beta 0.0.1

Jogo de combinação de frutas para integração com lives. Duas frutas iguais se fundem na fruta do nível seguinte e somam pontos ao placar.

## Beta 0.0.1

- Física 2D com gravidade, colisão, rolagem e massa crescente por nível.
- Sequência: roxa → vermelha → verde → banana → laranja → maçã → pêssego → melão → melancia → abacaxi.
- Prévia da próxima fruta e pontuação automática por fusão.
- Linha de perigo e fim de jogo por preenchimento da caixa.
- Controles por toque, mouse e teclado.
- Interface responsiva para celular e transmissão em live.

## Integração com o painel universal

Compatível com o protocolo do Projeto Daniel: `liveplus-game-manifest-v1` e `liveplus-command-v1`.

Ações do jogo disponíveis no painel: `drop_fruit`, `set_next_fruit`, `add_score`, `set_score`, `shake`, `clear_small`, `pause_game` e `reset_game`.

Também existe a API local `window.FrutasGame` para testes e futuras integrações.

## Publicação

Projeto estático sem etapa de build. A raiz pode ser publicada diretamente por GitHub Pages.
