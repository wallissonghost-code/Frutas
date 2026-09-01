const { test, expect } = require('@playwright/test');

async function boot(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/?qa=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FrutasGame && window.FrutasLiveActions, null, { timeout: 15000 });
  return errors;
}

async function reset(page) {
  await page.evaluate(() => window.FrutasLiveActions.execute({ action: 'live_restart', params: {} }));
  await page.waitForTimeout(250);
}

test('smoke: jogo inicia, aceita frutas e fica vivo por 30 segundos', async ({ page }) => {
  test.setTimeout(45000);
  const errors = await boot(page);
  await reset(page);
  const started = Date.now();
  let drops = 0;
  while (Date.now() - started < 30000) {
    await page.evaluate(i => {
      const g = window.FrutasGame;
      const s = g.getState();
      if (s.gameOver) g.reset();
      const m = g.getFieldMetrics();
      g.dropFruit(i % 3, 45 + ((i * 47) % Math.max(80, m.width - 90)));
    }, drops++);
    await page.waitForTimeout(360);
  }
  const state = await page.evaluate(() => ({ state: window.FrutasGame.getState(), bodies: window.FrutasGame.getBodies().length }));
  expect(state.bodies).toBeGreaterThan(0);
  expect(Number.isFinite(state.state.score)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('merge: frutas iguais se juntam e pontuam', async ({ page }) => {
  await boot(page);
  await reset(page);
  await page.evaluate(() => {
    const g = window.FrutasGame, w = g.getFieldMetrics().width;
    g.dropFruit(0, w / 2);
  });
  await page.waitForTimeout(380);
  await page.evaluate(() => {
    const g = window.FrutasGame, w = g.getFieldMetrics().width;
    g.dropFruit(0, w / 2);
  });
  await expect.poll(async () => page.evaluate(() => window.FrutasGame.getState().score), { timeout: 5000 }).toBeGreaterThanOrEqual(2);
  const tiers = await page.evaluate(() => window.FrutasGame.getBodies().map(b => b.fruitTier));
  expect(tiers).toContain(1);
});

test('pontuacao: tier final desaparece e soma bonus de 500', async ({ page }) => {
  await boot(page);
  await reset(page);
  await page.evaluate(() => {
    const g = window.FrutasGame, w = g.getFieldMetrics().width;
    g.dropFruit(9, w / 2);
  });
  await page.waitForTimeout(380);
  await page.evaluate(() => {
    const g = window.FrutasGame, w = g.getFieldMetrics().width;
    g.dropFruit(9, w / 2);
  });
  await expect.poll(async () => page.evaluate(() => window.FrutasGame.getState().score), { timeout: 6000 }).toBe(500);
  const finals = await page.evaluate(() => window.FrutasGame.getBodies().filter(b => b.fruitTier === 9).length);
  expect(finals).toBe(0);
});

test('persistencia: mini e gigante sobrevivem ao reload e mini expira corretamente', async ({ page }) => {
  test.setTimeout(30000);
  await boot(page);
  await reset(page);
  await page.evaluate(() => {
    window.FrutasLiveActions.execute({ action: 'giant_fruit', params: { tier: 2, scale: 1.8 } });
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.FrutasLiveActions.execute({ action: 'mini_fruits', params: { percent: 50, duration: 4 } }));
  const before = await page.evaluate(() => {
    const b = window.FrutasGame.getBodies()[0];
    return { scale: b.__liveScale, base: b.__liveBaseScale, mini: window.FrutasLiveActions.getMiniScale() };
  });
  expect(before.base).toBeCloseTo(1.8, 1);
  expect(before.scale).toBeCloseTo(.9, 1);
  expect(before.mini).toBeCloseTo(.5, 2);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FrutasGame && window.FrutasLiveActions);
  const restored = await page.evaluate(() => {
    const b = window.FrutasGame.getBodies()[0];
    return { scale: b?.__liveScale, base: b?.__liveBaseScale, mini: window.FrutasLiveActions.getMiniScale() };
  });
  expect(restored.base).toBeCloseTo(1.8, 1);
  expect(restored.scale).toBeCloseTo(.9, 1);
  expect(restored.mini).toBeCloseTo(.5, 2);
  await page.waitForTimeout(4500);
  const expired = await page.evaluate(() => {
    const b = window.FrutasGame.getBodies()[0];
    return { scale: b?.__liveScale, base: b?.__liveBaseScale, mini: window.FrutasLiveActions.getMiniScale() };
  });
  expect(expired.base).toBeCloseTo(1.8, 1);
  expect(expired.scale).toBeCloseTo(1.8, 1);
  expect(expired.mini).toBe(1);
});

test('acoes live basicas nao quebram a partida', async ({ page }) => {
  const errors = await boot(page);
  await reset(page);
  await page.evaluate(() => {
    const a = window.FrutasLiveActions;
    a.execute({ action: 'fruit_rain', params: { count: 5, maxTier: 2 } });
  });
  await page.waitForTimeout(2200);
  let bodies = await page.evaluate(() => window.FrutasGame.getBodies().length);
  expect(bodies).toBeGreaterThan(0);
  await page.evaluate(() => window.FrutasLiveActions.execute({ action: 'second_chance', params: {} }));
  await page.waitForTimeout(300);
  bodies = await page.evaluate(() => window.FrutasGame.getBodies().length);
  expect(bodies).toBe(0);
  expect(errors).toEqual([]);
});
