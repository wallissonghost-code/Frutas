(()=>{'use strict';
const canvas=document.getElementById('gameCanvas');
const wrap=canvas?.parentElement;
if(!canvas||!wrap)return;

// Bloqueia zoom/gestos acidentais no campo sem interferir no restante da página.
const stopGesture=e=>{if(wrap.contains(e.target))e.preventDefault()};
document.addEventListener('gesturestart',stopGesture,{passive:false});
document.addEventListener('gesturechange',stopGesture,{passive:false});
document.addEventListener('gestureend',stopGesture,{passive:false});
wrap.style.touchAction='none';
wrap.style.userSelect='none';
wrap.style.webkitUserSelect='none';
canvas.style.touchAction='none';

let lastTouchEnd=0;
wrap.addEventListener('touchend',e=>{
  const now=Date.now();
  if(now-lastTouchEnd<=350)e.preventDefault();
  lastTouchEnd=now;
},{passive:false});
wrap.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});

let aimedX=null;
let activePointer=null;

// Converte a posição VISUAL do toque para o mesmo sistema de coordenadas
// usado pela física. Isso corrige diferenças entre borda CSS, canvas e DPR.
function logicalXFromClient(clientX){
  const canvasRect=canvas.getBoundingClientRect();
  const wrapRect=wrap.getBoundingClientRect();
  const visual=Math.max(0,Math.min(canvasRect.width,clientX-canvasRect.left));
  const logicalWidth=Math.max(1,wrapRect.width);
  return visual*(logicalWidth/Math.max(1,canvasRect.width));
}

function setAimFromEvent(e){
  if(!window.FrutasGame)return null;
  aimedX=logicalXFromClient(e.clientX);
  window.FrutasGame.setDropX(aimedX);
  return aimedX;
}

function onPointerDown(e){
  if(!window.FrutasGame)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  activePointer=e.pointerId;
  try{canvas.setPointerCapture?.(e.pointerId)}catch{}
  setAimFromEvent(e);
}

function onPointerMove(e){
  if(!window.FrutasGame)return;
  if(activePointer!==null&&e.pointerId!==activePointer)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  setAimFromEvent(e);
}

function onPointerUp(e){
  if(!window.FrutasGame)return;
  if(activePointer!==null&&e.pointerId!==activePointer)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  // Usa exatamente a mesma coordenada mostrada pela mira no instante da soltura.
  const x=setAimFromEvent(e)??aimedX;
  if(x!==null)window.FrutasGame.dropFruit(null,x);
  try{canvas.releasePointerCapture?.(e.pointerId)}catch{}
  activePointer=null;
}

function onPointerCancel(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  try{canvas.releasePointerCapture?.(e.pointerId)}catch{}
  activePointer=null;
}

canvas.addEventListener('pointerdown',onPointerDown,{capture:true,passive:false});
canvas.addEventListener('pointermove',onPointerMove,{capture:true,passive:false});
canvas.addEventListener('pointerup',onPointerUp,{capture:true,passive:false});
canvas.addEventListener('pointercancel',onPointerCancel,{capture:true,passive:false});
})();