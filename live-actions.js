(()=>{'use strict';
const GAME_ID='frutas';
const VERSION='Beta 0.0.6';
const game=()=>window.FrutasGame;
const tracked=new Set();
let miniScale=1,miniTimer=0;

const style=document.createElement('style');
style.textContent=`
.live-actions{background:#5c3d30;border-top:2px solid rgba(0,0,0,.18);padding:7px 10px 8px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;min-width:0}
.live-action-card{min-width:0;height:48px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#744b39;color:#fff5df;padding:5px 6px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;line-height:1.05;box-shadow:inset 0 -2px rgba(0,0,0,.12)}
.live-action-card b{font-size:10px;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.live-action-card small{font-size:8px;opacity:.72;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.live-actions-title{grid-column:1/-1;font-size:9px;font-weight:900;letter-spacing:.12em;color:#f5ddb8;text-align:center;margin-bottom:-1px}
@media(max-height:760px){.live-action-card{height:42px}.live-actions{padding-top:5px;padding-bottom:5px;gap:4px}.live-actions-title{display:none}}
`;
document.head.appendChild(style);

function addPanel(){
  const footer=document.querySelector('.statusbar');
  if(!footer||document.querySelector('.live-actions'))return;
  const box=document.createElement('section');
  box.className='live-actions';
  box.setAttribute('aria-label','Interações da live');
  box.innerHTML=`<div class="live-actions-title">INTERAÇÕES DA LIVE</div>
    <div class="live-action-card"><b>RECOMEÇAR</b><small>zera tudo</small></div>
    <div class="live-action-card"><b>- PONTOS</b><small>mantém a partida</small></div>
    <div class="live-action-card"><b>FRUTA GIGANTE</b><small>ocupa espaço</small></div>
    <div class="live-action-card"><b>CHUVA</b><small>várias frutas</small></div>
    <div class="live-action-card"><b>2ª CHANCE</b><small>limpa, mantém pontos</small></div>
    <div class="live-action-card"><b>MINI FRUTAS</b><small>tamanho temporário</small></div>`;
  footer.before(box);
}
addPanel();

const extraActions=[
 {id:'live_restart',label:'Recomeçar',icon:'RST',description:'Zera frutas e pontos e reinicia a partida.',params:[]},
 {id:'remove_points',label:'Remover pontos',icon:'-PTS',description:'Remove pontos sem alterar as frutas.',params:[{id:'amount',label:'PONTOS',type:'number',min:1,max:999999999,default:500}]},
 {id:'giant_fruit',label:'Fruta gigante',icon:'BIG',description:'Solta uma fruta ampliada. Tamanho definido pelo painel.',params:[{id:'tier',label:'NÍVEL',type:'number',min:0,max:9,default:4},{id:'scale',label:'ESCALA',type:'number',min:1.1,max:3,default:1.8}]},
 {id:'fruit_rain',label:'Chuva de frutas',icon:'RAIN',description:'Solta várias frutas em sequência.',params:[{id:'count',label:'QUANTIDADE',type:'number',min:2,max:30,default:8},{id:'maxTier',label:'NÍVEL MÁX.',type:'number',min:0,max:4,default:2}]},
 {id:'second_chance',label:'Segunda chance',icon:'SAVE',description:'Limpa a caixa mantendo a pontuação atual.',params:[]},
 {id:'mini_fruits',label:'Mini frutas',icon:'MINI',description:'Reduz fisicamente todas as frutas por tempo configurável.',params:[{id:'percent',label:'TAMANHO %',type:'number',min:20,max:90,default:50},{id:'duration',label:'DURAÇÃO (s)',type:'number',min:1,max:300,default:20}]}
];

function patchMatterTracking(){
  if(!window.Matter?.World||window.__FRUTAS_TRACK_PATCHED__)return;
  window.__FRUTAS_TRACK_PATCHED__=true;
  const W=window.Matter.World,origAdd=W.add.bind(W),origRemove=W.remove.bind(W);
  W.add=function(world,obj){
    const result=origAdd(world,obj);
    const list=Array.isArray(obj)?obj:[obj];
    for(const body of list){if(body?.label==='fruit'){tracked.add(body);body.__liveBaseScale=body.__liveBaseScale||1;if(miniScale!==1)window.Matter.Body.scale(body,miniScale,miniScale);}}
    return result;
  };
  W.remove=function(world,obj,...rest){tracked.delete(obj);return origRemove(world,obj,...rest)};
}
patchMatterTracking();

function patchRendering(){
  const canvas=document.getElementById('gameCanvas');
  const ctx=canvas?.getContext('2d');
  if(!ctx||ctx.__liveDrawPatched)return;
  ctx.__liveDrawPatched=true;
  const orig=ctx.drawImage.bind(ctx);
  ctx.drawImage=function(...args){
    if(args.length===5&&tracked.size){
      try{
        const tr=ctx.getTransform(),x=tr.a?tr.e/tr.a:tr.e,y=tr.d?tr.f/tr.d:tr.f;
        let body=null,best=Infinity;
        for(const b of tracked){const d=Math.abs(b.position.x-x)+Math.abs(b.position.y-y);if(d<best){best=d;body=b}}
        if(body&&best<4){const s=(body.__liveBaseScale||1)*miniScale;if(s!==1){args[1]*=s;args[2]*=s;args[3]*=s;args[4]*=s;}}
      }catch{}
    }
    return orig(...args);
  };
}
patchRendering();

function setMini(scale,durationMs){
  scale=Math.max(.2,Math.min(.9,Number(scale)||.5));
  const ratio=scale/miniScale;
  for(const b of tracked){try{window.Matter.Body.scale(b,ratio,ratio)}catch{}}
  miniScale=scale;
  document.body.classList.toggle('mini-mode',miniScale!==1);
  clearTimeout(miniTimer);
  if(durationMs>0)miniTimer=setTimeout(()=>setMini(1,0),durationMs);
}

function lastTrackedFruit(){let last=null,max=-Infinity;for(const b of tracked){const t=Number(b.spawnedAt)||0;if(t>max){max=t;last=b}}return last}

function executeCustom(data={},session){
  const action=String(data.action||data.command||'');
  const p=data.params&&typeof data.params==='object'?data.params:{};
  const api=game(); if(!api)return false;
  switch(action){
    case'live_restart': api.reset(); break;
    case'remove_points':{const s=api.getState?.()||{};api.executeCommand({action:'set_score',params:{amount:Math.max(0,(Number(s.score)||0)-Math.max(0,Number(p.amount)||0))}});break;}
    case'giant_fruit':{const m=api.getFieldMetrics?.()||{};const tier=Math.max(0,Math.min(9,Number(p.tier)||4));const scale=Math.max(1.1,Math.min(3,Number(p.scale)||1.8));const x=Math.max(20,Math.min((Number(m.width)||360)-20,(Number(m.width)||360)*(.25+Math.random()*.5)));if(api.dropFruit(tier,x)){setTimeout(()=>{const b=lastTrackedFruit();if(b){window.Matter.Body.scale(b,scale,scale);b.__liveBaseScale=(b.__liveBaseScale||1)*scale;}},0);}break;}
    case'fruit_rain':{const count=Math.max(2,Math.min(30,Number(p.count)||8)),maxTier=Math.max(0,Math.min(4,Number(p.maxTier)||2));let i=0;const timer=setInterval(()=>{if(i++>=count){clearInterval(timer);return}const m=api.getFieldMetrics?.()||{},w=Number(m.width)||360,tier=Math.floor(Math.random()*(maxTier+1));api.dropFruit(tier,30+Math.random()*Math.max(1,w-60));},330);break;}
    case'second_chance':{const s=api.getState?.()||{},pts=Number(s.score)||0;api.reset();api.executeCommand({action:'set_score',params:{amount:pts}});break;}
    case'mini_fruits':{const percent=Math.max(20,Math.min(90,Number(p.percent)||50)),duration=Math.max(1,Math.min(300,Number(p.duration)||20));setMini(percent/100,duration*1000);break;}
    default:return false;
  }
  try{session?.sendState?.({scope:'command',gameId:GAME_ID,commandStatus:'executed',action,version:VERSION})}catch{}
  return true;
}

function patchSdk(){
  const SDK=window.LivePlusGameSDK;if(!SDK?.Session||SDK.__frutasLivePatched)return;
  SDK.__frutasLivePatched=true;
  const Original=SDK.Session;
  const proto=Original.prototype;
  const origAdd=proto.addEventListener;
  if(origAdd)proto.addEventListener=function(type,listener,...rest){
    if(type==='command'&&typeof listener==='function'){
      const self=this;
      return origAdd.call(this,type,function(e){if(executeCustom(e?.detail||{},self))return;return listener.call(this,e)},...rest);
    }
    return origAdd.call(this,type,listener,...rest);
  };
  SDK.Session=new Proxy(Original,{construct(Target,args,newTarget){
    const opts={...(args?.[0]||{})};
    if(opts.manifest&&opts.manifest.gameId===GAME_ID){opts.manifest={...opts.manifest,version:VERSION,actions:[...(opts.manifest.actions||[]).filter(a=>!extraActions.some(x=>x.id===a.id)),...extraActions]};args=[opts,...(args||[]).slice(1)];}
    return Reflect.construct(Target,args,newTarget===proxy?Target:newTarget);
  }});
  const proxy=SDK.Session;
}
patchSdk();

window.FrutasLiveActions={version:VERSION,actions:extraActions,execute:executeCustom,getMiniScale:()=>miniScale};
})();
