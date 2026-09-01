(()=>{'use strict';
const game=()=>window.FrutasGame;
let patched=false,watchTimer=0;
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
function ensureGameOverRestart(){
  const msg=document.getElementById('gameMessage');
  if(!msg||msg.hidden)return;
  const state=game()?.getState?.()||{};
  if(!state.gameOver)return;
  if(msg.querySelector('.gameover-restart'))return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='gameover-restart';
  btn.setAttribute('aria-label','Reiniciar partida');
  btn.title='Reiniciar partida';
  btn.textContent='×';
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();game()?.reset?.()});
  msg.appendChild(btn);
}
function watchGameOver(){clearInterval(watchTimer);watchTimer=setInterval(ensureGameOverRestart,200)}
function health(){
  const api=game(),s=api?.getState?.()||{},bodies=api?.getBodies?.()||[];
  return {ok:!!api&&!s.gameOver,score:Number(s.score)||0,bodies:bodies.length,transport:String(window.FrutasPanelBridge?.getTransport?.()||'offline'),miniScale:Number(window.FrutasLiveActions?.getMiniScale?.()||1)};
}
patchReset();watchGameOver();ensureGameOverRestart();
window.addEventListener('pageshow',()=>{patchReset();ensureGameOverRestart()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){patchReset();ensureGameOverRestart()}});
window.FrutasLifecycle={version:2,health,cancelEffects,patchReset,ensureGameOverRestart};
})();
