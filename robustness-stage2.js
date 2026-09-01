(()=>{'use strict';
const game=()=>window.FrutasGame,EFFECT_KEY='frutas-live-effects-v1';
let patched=false;
function clearMiniFallback(){
  try{localStorage.removeItem(EFFECT_KEY)}catch{}
  const bodies=game()?.getBodies?.()||[];
  for(const b of bodies){
    const now=Math.max(.05,Number(b.__liveScale)||1),base=Math.max(.05,Number(b.__liveBaseScale)||1);
    if(Math.abs(now-base)>.001){Matter.Body.scale(b,base/now,base/now);b.__liveScale=base}
  }
  game()?.saveGame?.();
}
function resetLiveEffects(){
  try{window.FrutasLiveActions?.stopRain?.()}catch{}
  try{if(window.FrutasLiveActions?.clearMini)window.FrutasLiveActions.clearMini();else clearMiniFallback()}catch{clearMiniFallback()}
}
function patchReset(){
  const api=game();
  if(!api||patched||typeof api.reset!=='function')return;
  patched=true;
  const original=api.reset.bind(api);
  api.reset=function(...args){
    resetLiveEffects();
    const out=original(...args);
    window.dispatchEvent(new CustomEvent('frutas:reset',{detail:{source:'core'}}));
    return out;
  };
}
function health(){
  const api=game(),state=api?.getState?.()||{},bodies=api?.getBodies?.()||[];
  return {ok:!!api&&!state.gameOver,score:Number(state.score)||0,bodies:bodies.length,transport:String(state.transport||'offline'),miniScale:Number(window.FrutasLiveActions?.getMiniScale?.()||1)};
}
patchReset();
window.addEventListener('pageshow',patchReset);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')patchReset()});
window.FrutasRobustness={version:2,health,resetLiveEffects,patchReset};
})();