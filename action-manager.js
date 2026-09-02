(()=>{'use strict';
const C=window.FRUTAS_CONFIG||{},SEEN_KEY=C.seenCommandsKey||'frutas-live-seen-v1',seen=new Map(),processing=new Set(),queues=new Map();
const TTL=15*60*1000,MAX_SEEN=300;
function eventId(data={}){return String(data.commandId||data.eventId||data.deliveryId||data.id||data.messageId||'').trim()}
function load(){try{const raw=JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'),now=Date.now();for(const row of Array.isArray(raw)?raw:[]){const id=String(row?.[0]||''),t=Number(row?.[1])||0;if(id&&now-t<=TTL)seen.set(id,t)}}catch{}}
function persist(){try{localStorage.setItem(SEEN_KEY,JSON.stringify([...seen.entries()].slice(-MAX_SEEN)))}catch{}}
function cleanup(){const now=Date.now();for(const [k,t] of seen)if(now-t>TTL)seen.delete(k);while(seen.size>MAX_SEEN)seen.delete(seen.keys().next().value);persist()}
function policy(action){if(action==='fruit_rain')return'replace';if(action==='mini_fruits')return'refresh';if(action==='giant_fruit')return'queue';return'immediate'}
async function run(data,executor){cleanup();const action=String(data?.action||data?.command||''),id=eventId(data);if(id&&seen.has(id))return{ok:true,duplicate:true};if(id&&processing.has(id))return{ok:true,duplicate:true,processing:true};if(id)processing.add(id);const finish=ok=>{if(id)processing.delete(id);if(ok&&id){seen.set(id,Date.now());persist()}return{ok:!!ok,duplicate:false}};try{const mode=policy(action);if(mode!=='queue')return finish(await executor(data));const prev=queues.get(action)||Promise.resolve();const next=prev.catch(()=>{}).then(()=>executor(data));queues.set(action,next.finally(()=>{if(queues.get(action)===next)queues.delete(action)}));return finish(await next)}catch(err){if(id)processing.delete(id);throw err}}
function clear({persisted=false}={}){seen.clear();processing.clear();queues.clear();if(persisted){try{localStorage.removeItem(SEEN_KEY)}catch{}}else persist()}
load();cleanup();
window.FrutasActionManager={run,clear,eventId,policy,getSeenCount:()=>seen.size};
})();
