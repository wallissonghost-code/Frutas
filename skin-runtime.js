(()=>{'use strict';
const SKINS={
  0:{url:'./assets/skins/tier-0/AE3C6E2D-1934-49C4-853D-E1ECC6C232D7.png',spriteSize:42,label:'Roxa'},
  1:{url:'./assets/skins/tier-1/F3EA166D-B619-44B8-8F69-C4A102D09D4C.png',spriteSize:48,label:'Vermelha'}
};
for(const skin of Object.values(SKINS)){const img=new Image();img.decoding='async';img.src=skin.url;skin.image=img}
const original=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
  try{
    if(source instanceof HTMLCanvasElement&&args.length===4){
      const skin=Object.values(SKINS).find(s=>source.width===s.spriteSize&&source.height===s.spriteSize);
      if(skin?.image.complete&&skin.image.naturalWidth>0)return original.call(this,skin.image,...args);
    }
  }catch{}
  return original.call(this,source,...args);
};
function syncChip(el){if(!el)return;const label=el.getAttribute('aria-label');const skin=Object.values(SKINS).find(s=>s.label===label);if(skin){el.style.backgroundImage=`url("${skin.url}")`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';el.style.backgroundRepeat='no-repeat';el.style.backgroundColor='transparent';}else{el.style.backgroundImage='';el.style.backgroundSize='';el.style.backgroundPosition='';el.style.backgroundRepeat='';el.style.backgroundColor='';}}
function watchChip(id){const el=document.getElementById(id);if(!el)return;const observer=new MutationObserver(()=>syncChip(el));observer.observe(el,{attributes:true,attributeFilter:['aria-label']});syncChip(el)}
addEventListener('DOMContentLoaded',()=>{watchChip('nextFruit');watchChip('dropPreview')},{once:true});
window.FrutasSkinRuntime={skins:SKINS};
})();
