(()=>{'use strict';
const canvas=document.getElementById('gameCanvas');
if(!canvas)return;

const stopGesture=e=>{if(e.target===canvas||canvas.contains?.(e.target))e.preventDefault();};
document.addEventListener('gesturestart',stopGesture,{passive:false});
document.addEventListener('gesturechange',stopGesture,{passive:false});
document.addEventListener('gestureend',stopGesture,{passive:false});
canvas.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});

let lastTouchEnd=0;
canvas.addEventListener('touchend',e=>{
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

function syncPreviewSize(){
  const game=window.FrutasGame;
  const preview=document.getElementById('dropPreview');
  if(!game||!preview)return;
  const state=game.getState?.()||{};
  const tiers=game.tiers||[];
  const tier=tiers[Number(state.dropTier)||0];
  if(!tier)return;
  const diameter=Math.max(1,Number(tier.r)||1)*2;
  const px=diameter+'px';
  if(preview.style.width!==px)preview.style.width=px;
  if(preview.style.height!==px)preview.style.height=px;
}

function aim(e){
  if(!window.FrutasGame)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  window.FrutasGame.setDropX(physicsX(e));
  syncPreviewSize();
}
function release(e){
  if(!window.FrutasGame)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const x=physicsX(e);
  window.FrutasGame.setDropX(x);
  syncPreviewSize();
  window.FrutasGame.dropFruit(null,x);
  requestAnimationFrame(syncPreviewSize);
}

canvas.addEventListener('pointermove',aim,{capture:true,passive:false});
canvas.addEventListener('pointerup',release,{capture:true,passive:false});
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture?.(e.pointerId);},{capture:true,passive:false});

const preview=document.getElementById('dropPreview');
if(preview){
  const observer=new MutationObserver(syncPreviewSize);
  observer.observe(preview,{attributes:true,attributeFilter:['style']});
}
syncPreviewSize();
})();