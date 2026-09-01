(()=>{'use strict';
const canvas=document.getElementById('gameCanvas');
if(!canvas)return;

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

function physicsX(e){
  const rect=canvas.getBoundingClientRect();
  const metrics=window.FrutasGame?.getFieldMetrics?.();
  const fieldWidth=Math.max(1,Number(metrics?.width)||rect.width);
  const local=Math.max(0,Math.min(rect.width,e.clientX-rect.left));
  return local*(fieldWidth/Math.max(1,rect.width));
}

function aim(e){
  if(!window.FrutasGame)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  window.FrutasGame.setDropX(physicsX(e));
}
function release(e){
  if(!window.FrutasGame)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const x=physicsX(e);
  window.FrutasGame.setDropX(x);
  window.FrutasGame.dropFruit(null,x);
}

canvas.addEventListener('pointermove',aim,{capture:true,passive:false});
canvas.addEventListener('pointerup',release,{capture:true,passive:false});
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture?.(e.pointerId);},{capture:true,passive:false});
})();