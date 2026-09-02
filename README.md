# Frutas — Beta 0.0.21

Jogo de combinação de bolas com integração LIVE+.

## Estrutura

- `game.js`: física, tiers, pontuação e persistência da partida.
- `input.js`: controles mobile/desktop.
- `live-actions.js`: HUD e seis ações públicas da live.
- `panel-bridge.js`: conexão LIVE+, regras e fila persistente.
- `action-manager.js`: idempotência e políticas de execução.
- `auto-player.js`: ferramenta administrativa isolada.
- `lifecycle.js`: reset e ciclo de vida.
- `tests/`: QA funcional, visual, resiliência e teste longo.

## LIVE+ e persistência

O HUD pode ser ligado/desligado e a preferência fica salva. Comandos recebidos em segundo plano entram em fila persistente com expiração e limite. IDs só são marcados como concluídos depois de execução bem-sucedida. Escalas temporárias não são persistidas pelo core; mini e Capybara restauram apenas enquanto o efeito ainda estiver válido.

## QA

`npm run test:quick` roda testes funcionais e de resiliência; `npm run test:visual` valida mobile; `npm run test:long` executa teste prolongado.
