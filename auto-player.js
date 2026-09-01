(()=>{'use strict';
const game=()=>window.FrutasGame;
let enabled=false,timer=0,intervalMs=720,autoRestart=true,lastDecision=null;
let stats={startedAt:0,drops:0,merges:0,gameOvers:0,highestTier:0,highestScore:0};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const adminTools=[
{id:'auto_player_start',icon:'AUTO',label:'Iniciar jogador automático',description:'Joga sozinho para testes e análise sem depender de presentes.',params:[{id:'intervalMs',label:'Intervalo entre jogadas (ms)',type:'number',default:720,min:350,max:5000,step:50},{id:'autoRestart',label:'Reiniciar após Game Over',type:'toggle',default:true}]},
{id:'auto_player_stop',icon:'STOP',label:'Parar jogador automático',description:'Interrompe imediatamente o jogador automático.',params:[]},
{id:'auto_player_reset_stats',icon:'RST',label:'Zerar estatísticas do automático',description:'Zera apenas as métricas de teste do jogador automático.',params:[]}
];
function resetStats(){stats={startedAt:enabled?Date.now():0,drops:0,merges:0,gameOvers:0,highestTier:0,highestScore:0};return getStats()}
function snapshot(){const g=game(),s=g?.getState?.()||{},b=g?.getBodies?.()||[];return{g,s,b,m:g?.getFieldMetrics?.()||{},tiers:g?.tiers||[]}}
function columnSafety(x,tier,bodies,height,tiers){const r=Number(tiers?.[tier]?.r)||17;let top=height,crowd=0;for(const b of bodies){const br=(Number(tiers?.[b.fruitTier]?.r)||17)*(Number(b.__liveScale)||1),dx=Math.abs(b.position.x-x);if(dx<=r+br+4){top=Math.min(top,b.position.y-br);crowd+=Math.max(0,1-dx/Math.max(1,r+br))}}return top-crowd*7}
function targetScore(body,tier,bodies,height,tiers){const br=(Number(tiers?.[body.fruitTier]?.r)||17)*(Number(body.__liveScale)||1),top=body.position.y-br;let congestion=0;for(const other of bodies){if(other===body)continue;const or=(Number(tiers?.[other.fruitTier]?.r)||17)*(Number(other.__liveScale)||1),d=Math.hypot(other.position.x-body.position.x,other.position.y-body.position.y);if(d<br+or+10)congestion+=8}return body.position.y*.42+(top>100?40:top*.25)-congestion+(body.position.y>height*.72?24:0)}
function chooseX(){const {s,b,m,tiers}=snapshot(),width=Math.max(120,Number(m.width)||360),height=Math.max(220,Number(m.height)||560),tier=clamp(Number(s.dropTier)||0,0,Math.max(0,tiers.length-1)),r=Number(tiers?.[tier]?.r)||17,min=r+4,max=width-r-4,same=b.filter(x=>x?.label==='fruit'&&Number(x.fruitTier)===tier&&!x.mergeLock);if(same.length){same.sort((a,c)=>targetScore(c,tier,b,height,tiers)-targetScore(a,tier,b,height,tiers));const target=same[0],jitter=Math.min(5,r*.18)*(Math.random()-.5);return{x:clamp(target.position.x+jitter,min,max),reason:'match',tier,targetTier:target.fruitTier,targetX:target.position.x}}const candidates=[];for(let i=0;i<9;i++){const x=min+(max-min)*(i/8);let score=columnSafety(x,tier,b,height,tiers);for(const body of b){const d=Math.abs(body.position.x-x);if(d<r*1.5){if(body.fruitTier===tier-1)score+=8;if(body.fruitTier===tier+1)score+=4}}score+=(Math.random()-.5)*1.5;candidates.push({x,score})}candidates.sort((a,c)=>c.score-a.score);return{x:candidates[0].x,reason:'safe',tier}}
function updateStats(){const {s,b}=snapshot();stats.highestScore=Math.max(stats.highestScore,Number(s.score)||0);for(const body of b)stats.highestTier=Math.max(stats.highestTier,Number(body.fruitTier)||0)}
function schedule(ms=intervalMs){clearTimeout(timer);if(enabled)timer=setTimeout(step,Math.max(350,ms))}
function step(){if(!enabled)return;const {g,s}=snapshot();if(!g){schedule(900);return}updateStats();if(s.gameOver){if(autoRestart){stats.gameOvers++;g.reset?.();schedule(900)}else schedule(1200);return}if(s.paused){schedule(700);return}const decision=chooseX();lastDecision={...decision,at:Date.now()};g.setDropX?.(decision.x);const body=g.dropFruit?.(null,decision.x);if(body)stats.drops++;schedule(body?intervalMs:380)}
function start(opts={}){if(Number(opts.intervalMs)>=350)intervalMs=clamp(Number(opts.intervalMs),350,5000);if(typeof opts.autoRestart==='boolean')autoRestart=opts.autoRestart;if(enabled)return getState();enabled=true;if(!stats.startedAt)stats.startedAt=Date.now();schedule(120);return getState()}
function stop(){enabled=false;clearTimeout(timer);timer=0;return getState()}
function toggle(){return enabled?stop():start()}
function setSpeed(ms){intervalMs=clamp(Number(ms)||720,350,5000);if(enabled)schedule(80);return intervalMs}
function setAutoRestart(value){autoRestart=!!value;return autoRestart}
function getStats(){updateStats();return{...stats,elapsedMs:stats.startedAt?Date.now()-stats.startedAt:0}}
function getState(){return{enabled,intervalMs,autoRestart,lastDecision,stats:getStats()}}
async function executeAdmin(data={}){const action=String(data.action||data.command||''),p=data.params||{};if(action==='auto_player_start'){start({intervalMs:p.intervalMs,autoRestart:p.autoRestart});return true}if(action==='auto_player_stop'){stop();return true}if(action==='auto_player_reset_stats'){resetStats();return true}return false}
window.addEventListener('frutas:event',e=>{const d=e.detail||{};if(d.event==='fruit_merged')stats.merges++;if(d.event==='game_over'&&!autoRestart)stats.gameOvers++;updateStats()});
window.addEventListener('frutas:reset',()=>{if(enabled)schedule(750)});
window.FrutasAutoPlayer={adminTools,start,stop,toggle,setSpeed,setAutoRestart,resetStats,getStats,getState,chooseX,executeAdmin};
})();
