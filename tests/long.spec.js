const { test, expect } = require('@playwright/test');

test('QA avancado: simula 20 minutos de partida, merges, pontuacao e efeitos', async ({ page }) => {
  test.setTimeout(21 * 60 * 1000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/?qa=long', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FrutasGame && window.FrutasLiveActions, null, { timeout: 15000 });
  await page.evaluate(() => window.FrutasLiveActions.execute({ action: 'live_restart', params: {} }));

  const started = Date.now();
  let tick = 0;
  let highestScore = 0;
  let mergesObserved = 0;
  let previousScore = 0;

  while (Date.now() - started < 20 * 60 * 1000) {
    const result = await page.evaluate(i => {
      const g = window.FrutasGame, a = window.FrutasLiveActions, s = g.getState(), m = g.getFieldMetrics();
      if (s.gameOver) a.execute({ action: 'second_chance', params: {} });
      const tier = i % 12 < 8 ? i % 3 : i % 5;
      const lanes = [0.22, 0.38, 0.5, 0.62, 0.78];
      g.dropFruit(tier, m.width * lanes[i % lanes.length]);
      if (i > 0 && i % 90 === 0) a.execute({ action: 'mini_fruits', params: { percent: 65, duration: 5 } });
      if (i > 0 && i % 140 === 0) a.execute({ action: 'giant_fruit', params: { tier: 2, scale: 1.4 } });
      if (i > 0 && i % 180 === 0) a.execute({ action: 'fruit_rain', params: { count: 4, maxTier: 1 } });
      return { score: g.getState().score, bodies: g.getBodies().length, gameOver: g.getState().gameOver };
    }, tick++);

    if (result.score > previousScore) mergesObserved++;
    highestScore = Math.max(highestScore, result.score);
    previousScore = result.score;
    expect(result.bodies).toBeLessThan(250);
    await page.waitForTimeout(380);
  }

  const final = await page.evaluate(() => ({
    score: window.FrutasGame.getState().score,
    bodies: window.FrutasGame.getBodies().length,
    mini: window.FrutasLiveActions.getMiniScale()
  }));

  expect(tick).toBeGreaterThan(2000);
  expect(mergesObserved).toBeGreaterThan(5);
  expect(highestScore).toBeGreaterThan(0);
  expect(Number.isFinite(final.score)).toBeTruthy();
  expect(errors).toEqual([]);
});
