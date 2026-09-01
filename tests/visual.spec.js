const { test, expect } = require('@playwright/test');

const devices = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'iphone-pro-max', width: 430, height: 932 },
  { name: 'android', width: 412, height: 915 }
];

async function boot(page, size) {
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.goto('/?qa=visual', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FrutasGame && window.FrutasLiveActions);
  await page.waitForTimeout(400);
}

async function layout(page) {
  return page.evaluate(() => {
    const box = el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; };
    const shell=box(document.querySelector('.app-shell'));
    const game=box(document.querySelector('.game-wrap'));
    const canvas=box(document.querySelector('#gameCanvas'));
    const top=box(document.querySelector('.topbar'));
    const status=box(document.querySelector('.statusbar'));
    const score=box(document.querySelector('.score-card'));
    const next=box(document.querySelector('.next-card'));
    const viewport={width:innerWidth,height:innerHeight};
    const all=[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).position!=='fixed');
    const overflow=all.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left < -2 || r.right > innerWidth+2)}).slice(0,10).map(e=>({tag:e.tagName,id:e.id,cls:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
    return {shell,game,canvas,top,status,score,next,viewport,overflow,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight};
  });
}

for (const d of devices) {
  test(`visual mobile: ${d.name} sem corte, zoom ou overflow`, async ({ page }) => {
    await boot(page,d);
    const l=await layout(page);
    expect(l.scrollWidth).toBeLessThanOrEqual(d.width+1);
    expect(l.shell.left).toBeGreaterThanOrEqual(-1);
    expect(l.shell.right).toBeLessThanOrEqual(d.width+1);
    expect(l.game.left).toBeGreaterThanOrEqual(-1);
    expect(l.game.right).toBeLessThanOrEqual(d.width+1);
    expect(l.canvas.width).toBeGreaterThan(250);
    expect(l.canvas.height).toBeGreaterThan(200);
    expect(l.score.width).toBeGreaterThan(80);
    expect(l.next.right).toBeLessThanOrEqual(d.width+1);
    expect(l.status.bottom).toBeLessThanOrEqual(d.height+1);
    expect(l.overflow).toEqual([]);
    await page.screenshot({path:`test-results/visual-${d.name}.png`,fullPage:true});
  });
}

test('visual durante partida e efeitos live continua dentro da tela', async ({ page }) => {
  await boot(page,{width:390,height:844});
  await page.evaluate(async()=>{
    const g=window.FrutasGame,w=g.getFieldMetrics().width;
    for(let i=0;i<8;i++){g.dropFruit(i%3,50+(i*41)%Math.max(80,w-100));await new Promise(r=>setTimeout(r,330));}
    await window.FrutasLiveActions.execute({action:'giant_fruit',params:{tier:2,scale:1.8},eventId:'visual-giant'});
    await window.FrutasLiveActions.execute({action:'mini_fruits',params:{percent:70,duration:5},eventId:'visual-mini'});
  });
  await page.waitForTimeout(800);
  const l=await layout(page);
  expect(l.scrollWidth).toBeLessThanOrEqual(391);
  expect(l.game.right).toBeLessThanOrEqual(391);
  expect(l.status.bottom).toBeLessThanOrEqual(845);
  expect(l.overflow).toEqual([]);
  expect(await page.evaluate(()=>window.FrutasGame.getBodies().length)).toBeGreaterThan(0);
  await page.screenshot({path:'test-results/visual-partida-live.png',fullPage:true});
});

test('visual modal do painel cabe no iPhone SE', async ({ page }) => {
  await boot(page,{width:375,height:667});
  await page.click('#panelButton');
  const modal=await page.locator('.modal-card').boundingBox();
  expect(modal).not.toBeNull();
  expect(modal.x).toBeGreaterThanOrEqual(0);
  expect(modal.x+modal.width).toBeLessThanOrEqual(375);
  expect(modal.y).toBeGreaterThanOrEqual(0);
  expect(modal.y+modal.height).toBeLessThanOrEqual(667);
  await page.screenshot({path:'test-results/visual-panel-iphone-se.png',fullPage:true});
});
