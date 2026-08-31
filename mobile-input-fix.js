(()=>{'use strict';
const canvas=document.getElementById('gameCanvas');
if(!canvas)return;

// iOS/Safari: bloqueia pinch, double-tap zoom e gestos de zoom dentro do jogo.
const stopGesture=e=>{e.preventDefault();};
document.addEventListener('gesturestart',stopGesture,{passive:false});
document.addEventListener('gesturechange',stopGesture,{passive:false});
document.addEventListener('gestureend',stopGesture,{passive:false});
canvas.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});

let lastTouchEnd=0;
document.addEventListener('touchend',e=>{
  const now=Date.now();
  if(now-lastTouchEnd<=350)e.preventDefault();
  lastTouchEnd=now;
},{passive:false});

function visualX(e){
  const rect=canvas.getBoundingClientRect();
  return Math.max(0,Math.min(rect.width,e.clientX-rect.left));
}

// Substitui o mapeamento antigo no campo. A coordenada passa a ser 1:1 com a caixa visível.
function aim(e){
  if(!window.FrutasGame)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  window.FrutasGame.setDropX(visualX(e));
}
function release(e){
  if(!window.FrutasGame)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const x=visualX(e);
  window.FrutasGame.setDropX(x);
  window.FrutasGame.dropFruit(null,x);
}
canvas.addEventListener('pointermove',aim,{capture:true,passive:false});
canvas.addEventListener('pointerup',release,{capture:true,passive:false});
canvas.addEventListener('pointerdown',e=>{e.preventDefault();},{capture:true,passive:false});
})();
