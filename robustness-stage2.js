(()=>{'use strict';
const game=()=>window.FrutasGame;
let patched=false;
function resetLiveEffects(){
  try{window.FrutasLiveActions?.stopRain?.()}catch{}
  try{window.FrutasLiveActions?.clearMini?.()}catch{}
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