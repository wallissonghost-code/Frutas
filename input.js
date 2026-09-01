(()=>{'use strict';
const canvas=document.getElementById('gameCanvas');if(!canvas)return;
const game=()=>window.FrutasGame;
const stopGesture=e=>{if(e.target===canvas)e.preventDefault()};
for(const type of['gesturestart','gesturechange','gestureend'])document.addEventListener(type,stopGesture,{passive:false});
canvas.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
let lastTouchEnd=0;canvas.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<=350)e.preventDefault();lastTouchEnd=now},{passive:false});
function physicsX(e){const rect=canvas.getBoundingClientRect(),m=game()?.getFieldMetrics?.(),w=Math.max(1,Number(m?.width)||rect.width);return Math.max(0,Math.min(rect.width,e.clientX-rect.left))*w/Math.max(1,rect.width)}
function syncPreview(){const g=game(),p=document.getElementById('dropPreview');if(!g||!p)return;const s=g.getState?.()||{},t=g.tiers?.[Number(s.dropTier)||0];if(!t)return;const px=Math.max(1,Number(t.r)||1)*2+'px';p.style.width=px;p.style.height=px}
function aim(e){const g=game();if(!g)return;e.preventDefault();e.stopImmediatePropagation();g.setDropX(physicsX(e));syncPreview()}
function release(e){const g=game();if(!g)return;e.preventDefault();e.stopImmediatePropagation();const x=physicsX(e);g.setDropX(x);syncPreview();g.dropFruit(null,x);requestAnimationFrame(syncPreview)}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture?.(e.pointerId)},{capture:true,passive:false});
canvas.addEventListener('pointermove',aim,{capture:true,passive:false});
canvas.addEventListener('pointerup',release,{capture:true,passive:false});
addEventListener('keydown',e=>{const g=game();if(!g)return;const s=g.getState?.()||{},m=g.getFieldMetrics?.()||{},x=Number(document.getElementById('aimLine')?.style.left?.replace('px',''))||m.width/2;if(e.key==='ArrowLeft')g.setDropX(x-18);else if(e.key==='ArrowRight')g.setDropX(x+18);else if(e.code==='Space'){e.preventDefault();g.dropFruit(null,x)}});
const preview=document.getElementById('dropPreview');if(preview)new MutationObserver(syncPreview).observe(preview,{attributes:true,attributeFilter:['style']});syncPreview();
window.FrutasInput={syncPreview};
})();
