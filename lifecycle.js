(()=>{'use strict';
const game=()=>window.FrutasGame;
let patched=false;
function cancelEffects(){try{window.FrutasLiveActions?.cancelAll?.()}catch{}}
function patchReset(){
  const api=game();
  if(!api||patched||typeof api.reset!=='function')return false;
  patched=true;
  const original=api.reset.bind(api);
  api.reset=function(...args){
    cancelEffects();
    const result=original(...args);
    window.dispatchEvent(new CustomEvent('frutas:reset',{detail:{source:'core'}}));
    return result;
  };
  return true;
}
function health(){
  const api=game(),s=api?.getState?.()||{},bodies=api?.getBodies?.()||[];
  return {ok:!!api&&!s.gameOver,score:Number(s.score)||0,bodies:bodies.length,transport:String(window.FrutasPanelBridge?.getTransport?.()||'offline'),miniScale:Number(window.FrutasLiveActions?.getMiniScale?.()||1)};
}
patchReset();
window.addEventListener('pageshow',patchReset);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')patchReset()});
window.FrutasLifecycle={version:1,health,cancelEffects,patchReset};
})();
