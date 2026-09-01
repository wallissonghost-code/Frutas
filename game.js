(()=>{'use strict';
const {Engine,World,Bodies,Body,Events}=Matter;
const VERSION='Beta 0.0.7';
const GAME_ID='frutas';
const FIXED_STEP=1000/60;
const MAX_SUBSTEPS=2;
const TIERS=[
{id:'roxa',name:'Roxa',color:'#6f4ba8',r:17,score:0,density:.0011},
{id:'vermelha',name:'Vermelha',color:'#d84f55',r:22,score:10,density:.0013},
{id:'verde',name:'Verde',color:'#8dbf57',r:28,score:25,density:.0016},
{id:'banana',name:'Amarela',color:'#efc84c',r:34,score:60,density:.0019},
{id:'laranja',name:'Laranja',color:'#ee933f',r:40,score:120,density:.0023},
{id:'maca',name:'Vermelha II',color:'#c94f42',r:47,score:220,density:.0027},
{id:'pessego',name:'Rosa',color:'#ef9b88',r:55,score:360,density:.0032},
{id:'melao',name:'Verde II',color:'#b9cf75',r:64,score:550,density:.0038},
{id:'melancia',name:'Verde III',color:'#5a9b4e',r:75,score:800,density:.0045},
{id:'abacaxi',name:'Dourada',color:'#d7a83f',r:86,score:1200,density:.0053}
];
const SPAWN_POOL=[0,0,0,1,1,1,2,2,3,4];
const $=id=>document.getElementById(id),canvas=$('gameCanvas'),ctx=canvas.getContext('2d',{alpha:true}),wrap=canvas.parentElement;
const engine=Engine.create({enableSleeping:true});
engine.gravity.y=1.02;
engine.positionIterations=6;
engine.velocityIterations=5;
engine.constraintIterations=1;
let walls=[],fruits=[],merging=new Set(),score=0,dropTier=randomSpawn(),nextTier=randomSpawn(),dropX=160,canDrop=true,gameOver=false,paused=false,dangerSince=0,session=null,panelRules=[];
let width=360,height=560,last=performance.now(),accumulator=0,lastDangerCheck=0,currentDpr=1;
const fruitSprites=[];
const tierOptions=TIERS.slice(0,7).map((t,i)=>({value:String(i),label:t.name}));
const manifest={protocol:'liveplus-game-manifest-v1',gameId:GAME_ID,name:'Frutas · Merge Live',icon:'FR',version:VERSION,actions:[
{id:'drop_fruit',label:'Soltar fruta',icon:'DROP',description:'Solta uma fruta pelo painel.',params:[{id:'tier',label:'FRUTA',type:'select',default:'random',options:[{value:'random',label:'Aleatória'},...tierOptions]}]},
{id:'set_next_fruit',label:'Definir próxima fruta',icon:'NEXT',description:'Escolhe a próxima fruta da fila.',params:[{id:'tier',label:'FRUTA',type:'select',default:'0',options:tierOptions}]},
{id:'add_score',label:'Adicionar pontos',icon:'+PTS',description:'Soma pontos ao placar.',params:[{id:'amount',label:'PONTOS',type:'number',min:1,max:100000,default:100}]},
{id:'set_score',label:'Definir pontos',icon:'PTS',description:'Define o placar total.',params:[{id:'amount',label:'TOTAL',type:'number',min:0,max:999999999,default:0}]},
{id:'shake',label:'Balançar caixa',icon:'MOVE',description:'Aplica um pequeno impulso às frutas.',params:[{id:'power',label:'FORÇA',type:'number',min:1,max:10,default:4}]},
{id:'clear_small',label:'Limpar frutas pequenas',icon:'CLR',description:'Remove frutas até um nível escolhido.',params:[{id:'maxTier',label:'ATÉ O NÍVEL',type:'number',min:0,max:4,default:1}]},
{id:'pause_game',label:'Pausar/continuar',icon:'PAUSE',description:'Alterna a pausa da partida.',params:[]},
{id:'reset_game',label:'Reiniciar partida',icon:'RESET',description:'Zera a pontuação e limpa a caixa.',params:[]}
]};
function randomSpawn(){return SPAWN_POOL[(Math.random()*SPAWN_POOL.length)|0]}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function shade(hex,amt){const n=parseInt(hex.slice(1),16),r=clamp((n>>16)+amt,0,255),g=clamp(((n>>8)&255)+amt,0,255),b=clamp((n&255)+amt,0,255);return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function makeSprite(t){const pad=Math.max(4,Math.ceil(t.r*.08)),size=(t.r+pad)*2,c=document.createElement('canvas'),g=c.getContext('2d');c.width=size;c.height=size;const cx=size/2,cy=size/2,r=t.r,grad=g.createRadialGradient(cx-r*.3,cy-r*.34,Math.max(1,r*.04),cx,cy,r);grad.addColorStop(0,'rgba(255,255,255,.82)');grad.addColorStop(.18,t.color);grad.addColorStop(1,shade(t.color,-30));g.fillStyle=grad;g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.fill();g.lineWidth=Math.max(1.4,r*.045);g.strokeStyle='rgba(85,55,43,.68)';g.stroke();g.beginPath();g.arc(cx-r*.27,cy-r*.31,Math.max(1.7,r*.13),0,Math.PI*2);g.fillStyle='rgba(255,255,255,.38)';g.fill();return c}
function rebuildSprites(){fruitSprites.length=0;for(const t of TIERS)fruitSprites.push(makeSprite(t))}
function setChip(el,tier){if(!el)return;const t=TIERS[tier];el.textContent='';el.style.setProperty('--fruit-color',t.color);el.style.setProperty('--fruit-dark',shade(t.color,-30));el.setAttribute('aria-label',t.name)}
function bodyRadius(body){const base=TIERS[body?.fruitTier]?.r||16;return base*(Number(body?.__liveScale)||1)}
function clampFruitToField(body,hard=false){if(!body||body.label!=='fruit')return;const r=bodyRadius(body);let x=body.position.x,y=body.position.y,changed=false;if(x<r){x=r;changed=true}else if(x>width-r){x=width-r;changed=true}if(y>height-r){y=height-r;changed=true}if(changed){Body.setPosition(body,{x,y});if(hard){Body.setVelocity(body,{x:clamp(body.velocity.x,-2.5,2.5),y:Math.min(0,body.velocity.y)*.15})}else{Body.setVelocity(body,{x:body.position.x<=r?Math.abs(body.velocity.x)*.18:body.position.x>=width-r?-Math.abs(body.velocity.x)*.18:body.velocity.x,y:y>=height-r?-Math.abs(body.velocity.y)*.08:body.velocity.y})}}}
function enforcePlayfield(){for(let i=0;i<fruits.length;i++){const b=fruits[i],r=bodyRadius(b);if(b.position.x<r-2||b.position.x>width-r+2||b.position.y>height-r+3)clampFruitToField(b,true)}}
function resize(){const mobile=matchMedia('(pointer:coarse)').matches;currentDpr=Math.min(mobile?1.35:1.6,window.devicePixelRatio||1);const nextWidth=Math.max(280,Math.round(wrap.clientWidth));const nextHeight=Math.max(220,Math.round(wrap.clientHeight));if(nextWidth===width&&nextHeight===height&&canvas.width)return;const oldW=width,oldH=height;width=nextWidth;height=nextHeight;canvas.style.width='100%';canvas.style.height='100%';canvas.width=Math.max(1,Math.round(width*currentDpr));canvas.height=Math.max(1,Math.round(height*currentDpr));ctx.setTransform(currentDpr,0,0,currentDpr,0,0);rebuildWalls();if(oldW>0&&oldH>0){const sx=width/oldW,sy=height/oldH;for(const b of fruits){Body.setPosition(b,{x:b.position.x*sx,y:b.position.y*sy});clampFruitToField(b,true)}}dropX=clamp(dropX,30,width-30);updateAim()}
function rebuildWalls(){walls.forEach(w=>World.remove(engine.world,w));const thick=140,sideHeight=height+thick*2;walls=[Bodies.rectangle(-thick/2,height/2,thick,sideHeight,{isStatic:true,label:'wall-left',friction:.25,restitution:0}),Bodies.rectangle(width+thick/2,height/2,thick,sideHeight,{isStatic:true,label:'wall-right',friction:.25,restitution:0}),Bodies.rectangle(width/2,height+thick/2,width+thick*2,thick,{isStatic:true,label:'floor',friction:.35,restitution:0})];World.add(engine.world,walls)}
function makeFruit(tier,x,y,opts={}){tier=clamp(Number(tier)||0,0,TIERS.length-1);const t=TIERS[tier],body=Bodies.circle(clamp(x,t.r,width-t.r),y,t.r,{label:'fruit',restitution:.05,friction:.17,frictionStatic:.48,frictionAir:.004,density:t.density,slop:.015,sleepThreshold:90});body.fruitTier=tier;body.spawnedAt=Date.now();body.mergeLock=false;body.__liveScale=1;if(opts.vx||opts.vy)Body.setVelocity(body,{x:opts.vx||0,y:opts.vy||0});fruits.push(body);World.add(engine.world,body);return body}
function removeFruit(body){const i=fruits.indexOf(body);if(i>=0)fruits.splice(i,1);World.remove(engine.world,body);merging.delete(body.id)}
function mergePair(a,b){if(!a||!b||a.mergeLock||b.mergeLock||a.fruitTier!==b.fruitTier||a.fruitTier>=TIERS.length-1)return;a.mergeLock=b.mergeLock=true;merging.add(a.id);merging.add(b.id);const next=a.fruitTier+1,x=clamp((a.position.x+b.position.x)/2,TIERS[next].r,width-TIERS[next].r),y=Math.min((a.position.y+b.position.y)/2,height-TIERS[next].r),vx=(a.velocity.x+b.velocity.x)*.22,vy=(a.velocity.y+b.velocity.y)*.12;queueMicrotask(()=>{if(!fruits.includes(a)||!fruits.includes(b))return;removeFruit(a);removeFruit(b);const c=makeFruit(next,x,y,{vx,vy});Body.setAngularVelocity(c,(a.angularVelocity+b.angularVelocity)*.2);clampFruitToField(c,true);addScore(TIERS[next].score,'merge');pulseScore();sendEvent('fruit_merged',{fromTier:next-1,toTier:next,points:TIERS[next].score});sendState('merge')})}
Events.on(engine,'collisionStart',ev=>{for(const pair of ev.pairs){const a=pair.bodyA,b=pair.bodyB;if(a.label==='fruit'&&b.label==='fruit'&&a.fruitTier===b.fruitTier)mergePair(a,b)}});
function addScore(n,reason='manual'){score=Math.max(0,Math.round(score+(Number(n)||0)));$('score').textContent=score.toLocaleString('pt-BR');if(reason!=='merge')sendState('score')}
function pulseScore(){const el=$('score');el.animate?.([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:180})}
function updateNextUI(){setChip($('nextFruit'),nextTier);setChip($('dropPreview'),dropTier);updateAim()}
function updateAim(){const t=TIERS[dropTier],r=t.r;dropX=clamp(dropX,r+3,width-r-3);$('aimLine').style.left=dropX+'px';const preview=$('dropPreview');preview.style.left=dropX+'px';preview.style.width=(r*2)+'px';preview.style.height=(r*2)+'px'}
function drop(tier=null,x=dropX,source='player'){if(gameOver||paused||!canDrop)return false;const isPlayer=tier===null;const chosen=isPlayer?dropTier:clamp(Number(tier)||0,0,TIERS.length-1),t=TIERS[chosen];makeFruit(chosen,clamp(x,t.r+3,width-t.r-3),Math.max(18,t.r+4));canDrop=false;setTimeout(()=>{canDrop=true},300);if(isPlayer){dropTier=nextTier;nextTier=randomSpawn();updateNextUI()}sendEvent('fruit_dropped',{tier:chosen,source});sendState('drop');return true}
function resetGame(){fruits.slice().forEach(removeFruit);score=0;$('score').textContent='0';dropTier=randomSpawn();nextTier=randomSpawn();updateNextUI();gameOver=false;paused=false;dangerSince=0;hideMessage();sendEvent('game_reset');sendState('reset')}
function showMessage(html){const el=$('gameMessage');el.innerHTML=html;el.hidden=false}
function hideMessage(){$('gameMessage').hidden=true}
function endGame(){if(gameOver)return;gameOver=true;showMessage(`FIM DE JOGO<br><small>${score.toLocaleString('pt-BR')} pontos</small>`);sendEvent('game_over',{score});sendState('gameover')}
function checkDanger(now){if(gameOver||paused||now-lastDangerCheck<120)return;lastDangerCheck=now;const stamp=Date.now(),risky=fruits.some(b=>stamp-b.spawnedAt>1300&&b.position.y-bodyRadius(b)<88&&Math.abs(b.velocity.x)+Math.abs(b.velocity.y)<1.45);if(risky){if(!dangerSince)dangerSince=stamp;if(stamp-dangerSince>2300)endGame()}else dangerSince=0}
function drawFruit(b){const t=TIERS[b.fruitTier],sprite=fruitSprites[b.fruitTier],r=t.r,pad=(sprite.width/2)-r,half=(r+pad)*(Number(b.__liveScale)||1);ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);ctx.drawImage(sprite,-half,-half,half*2,half*2);ctx.restore()}
function draw(){ctx.clearRect(0,0,width,height);for(let i=0;i<fruits.length;i++)drawFruit(fruits[i])}
function tick(now){const elapsed=Math.min(50,Math.max(0,now-last));last=now;if(!paused&&!gameOver){accumulator+=elapsed;let steps=0;while(accumulator>=FIXED_STEP&&steps<MAX_SUBSTEPS){Engine.update(engine,FIXED_STEP);enforcePlayfield();accumulator-=FIXED_STEP;steps++}if(steps===MAX_SUBSTEPS&&accumulator>FIXED_STEP)accumulator=0}else accumulator=0;checkDanger(now);draw();requestAnimationFrame(tick)}
function stateSnapshot(scope='game'){return{scope,gameId:GAME_ID,version:VERSION,score,gameOver,paused,dropTier,currentFruit:TIERS[dropTier].id,nextTier,nextFruit:TIERS[nextTier].id,fruitCount:fruits.length,highestTier:fruits.reduce((m,b)=>Math.max(m,b.fruitTier),0),rules:panelRules.length,transport:session?.getTransport?.()||'offline'}}
function sendState(scope='game'){session?.sendState(stateSnapshot(scope))}
function sendEvent(event,data={}){session?.sendEvent({gameId:GAME_ID,event,...data})}
function executeCommand(data={}){if(data.gameId&&String(data.gameId)!==GAME_ID)return false;const action=String(data.action||data.command||''),p=data.params&&typeof data.params==='object'?data.params:{};switch(action){case'drop_fruit':{const tier=p.tier==='random'?randomSpawn():clamp(Number(p.tier)||0,0,TIERS.length-1);return drop(tier,dropX,'panel')}case'set_next_fruit':nextTier=clamp(Number(p.tier)||0,0,TIERS.length-1);updateNextUI();sendState('next');return true;case'add_score':addScore(Math.max(0,Number(p.amount)||0));return true;case'set_score':score=Math.max(0,Math.round(Number(p.amount)||0));$('score').textContent=score.toLocaleString('pt-BR');sendState('score');return true;case'shake':{const power=clamp(Number(p.power)||4,1,10);fruits.forEach(b=>Body.applyForce(b,b.position,{x:(Math.random()-.5)*.0008*power*b.mass,y:-.00012*power*b.mass}));sendEvent('box_shaken',{power});return true}case'clear_small':{const max=clamp(Number(p.maxTier)||0,0,4);fruits.slice().filter(b=>b.fruitTier<=max).forEach(removeFruit);sendState('clear');return true}case'pause_game':paused=!paused;if(paused)showMessage('PAUSADO');else hideMessage();sendState('pause');return true;case'reset_game':resetGame();return true;default:return false}}
function setPairStatus(text,kind=''){const e=$('pairMessage');e.textContent=text;e.className='pair-message '+kind;$('panelStatus').textContent=text;$('statusDot').className=kind}
function cleanCode(v=''){return String(v).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}
function formatCode(v=''){const c=cleanCode(v);return c.length>4?c.slice(0,4)+'-'+c.slice(4):c}
async function connectPanel(){const input=$('panelCode'),code=cleanCode(input.value);input.value=formatCode(code);if(code.length!==8){setPairStatus('Código inválido','err');return}if(!window.LivePlusGameSDK?.Session){setPairStatus('SDK LIVE+ não carregou','err');return}session?.disconnect?.();session=new window.LivePlusGameSDK.Session({storageKey:'frutas-liveplus-token',manifest});session.addEventListener('connected',()=>{setPairStatus('Painel conectado','ok');sendState('initial');setTimeout(()=>$('panelModal').classList.remove('show'),300)});session.addEventListener('command',e=>{const ok=executeCommand(e.detail||{});session?.sendState({scope:'command',gameId:GAME_ID,commandStatus:ok?'executed':'unsupported',action:String(e.detail?.action||'')})});session.addEventListener('message',e=>{const d=e.detail||{};if(d.type==='rules_sync'&&Array.isArray(d.rules)){panelRules=d.rules;window.dispatchEvent(new CustomEvent('frutas:rules_sync',{detail:{rules:panelRules}}));sendState('rules')}});session.addEventListener('reconnecting',()=>setPairStatus('Reconectando…','warn'));session.addEventListener('lost',()=>setPairStatus('Conexão perdida','err'));session.addEventListener('rejected',e=>setPairStatus(e.detail?.reason||'Sessão recusada','err'));setPairStatus('Conectando…','warn');try{localStorage.setItem('frutas-panel-code',formatCode(code))}catch{}try{await session.connect(code)}catch(err){setPairStatus(err?.message||'Falha ao conectar','err')}}
function pointerX(e){const r=canvas.getBoundingClientRect();return clamp((e.clientX-r.left)*(width/r.width),20,width-20)}
let pendingPointerX=null,pointerRaf=0;
function scheduleAim(x){pendingPointerX=x;if(pointerRaf)return;pointerRaf=requestAnimationFrame(()=>{pointerRaf=0;dropX=pendingPointerX;updateAim()})}
canvas.addEventListener('pointermove',e=>scheduleAim(pointerX(e)),{passive:true});
canvas.addEventListener('pointerup',e=>{dropX=pointerX(e);updateAim();drop()},{passive:true});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){dropX-=18;updateAim()}else if(e.key==='ArrowRight'){dropX+=18;updateAim()}else if(e.code==='Space'){e.preventDefault();drop()}});
$('panelButton').onclick=()=>{$('panelModal').classList.add('show');$('panelModal').setAttribute('aria-hidden','false')};
$('closePanel').onclick=()=>$('panelModal').classList.remove('show');
$('panelModal').onclick=e=>{if(e.target===$('panelModal'))$('panelModal').classList.remove('show')};
$('connectPanel').onclick=connectPanel;
$('restartButton').onclick=resetGame;
$('panelCode').oninput=e=>e.target.value=formatCode(e.target.value);
$('panelCode').onkeydown=e=>{if(e.key==='Enter')connectPanel()};
function buildProgression(){$('progressionTrack').innerHTML=TIERS.map((t,i)=>`<div class="tier-pill" title="${t.name}: ${t.score} pontos"><span class="tier-swatch" style="--fruit-color:${t.color};--fruit-dark:${shade(t.color,-30)}" aria-hidden="true"></span><b>${i?`+${t.score}`:'INÍCIO'}</b></div>`).join('')}
try{const saved=localStorage.getItem('frutas-panel-code');if(saved)$('panelCode').value=saved}catch{}
rebuildSprites();buildProgression();updateNextUI();resize();
let resizeTimer=0;const scheduleResize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,70)};addEventListener('resize',scheduleResize,{passive:true});if('ResizeObserver'in window)new ResizeObserver(scheduleResize).observe(wrap);
document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;scheduleResize()});
requestAnimationFrame(tick);
window.FrutasGame={version:VERSION,gameId:GAME_ID,manifest,tiers:TIERS.map(t=>({...t})),executeCommand,dropFruit:(tier,x)=>drop(tier,x??dropX,'api'),setDropX:x=>{dropX=Number(x)||dropX;updateAim()},getFieldMetrics:()=>({width,height,dpr:currentDpr,canvasCssWidth:canvas.getBoundingClientRect().width,canvasCssHeight:canvas.getBoundingClientRect().height}),reset:resetGame,getState:stateSnapshot,connectPanel,getBodies:()=>fruits.slice(),forceResize:resize};
})();