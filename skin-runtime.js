(()=>{'use strict';
const TIER0_URL='./assets/skins/tier-0/AE3C6E2D-1934-49C4-853D-E1ECC6C232D7.png';
const tier0=new Image();tier0.decoding='async';tier0.src=TIER0_URL;
const original=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
  try{
    if(tier0.complete&&tier0.naturalWidth>0&&source instanceof HTMLCanvasElement&&source.width===42&&source.height===42&&args.length===4){
      return original.call(this,tier0,...args);
    }
  }catch{}
  return original.call(this,source,...args);
};
function syncChip(el){if(!el)return;const isTier0=el.getAttribute('aria-label')==='Roxa';if(isTier0){el.style.backgroundImage=`url("${TIER0_URL}")`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';el.style.backgroundRepeat='no-repeat';el.style.backgroundColor='transparent';}else{el.style.backgroundImage='';el.style.backgroundSize='';el.style.backgroundPosition='';el.style.backgroundRepeat='';el.style.backgroundColor='';}}
function watchChip(id){const el=document.getElementById(id);if(!el)return;const observer=new MutationObserver(()=>syncChip(el));observer.observe(el,{attributes:true,attributeFilter:['aria-label']});syncChip(el)}
addEventListener('DOMContentLoaded',()=>{watchChip('nextFruit');watchChip('dropPreview')},{once:true});
window.FrutasSkinRuntime={tier0:TIER0_URL};
})();
