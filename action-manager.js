(()=>{'use strict';
const seen=new Map(),queues=new Map();
const TTL=120000;
function cleanup(){const now=Date.now();for(const [k,t] of seen)if(now-t>TTL)seen.delete(k)}
function eventId(data={}){return String(data.commandId||data.eventId||data.deliveryId||data.id||data.messageId||'').trim()}
function policy(action){if(action==='fruit_rain')return'replace';if(action==='mini_fruits')return'refresh';if(action==='giant_fruit')return'queue';return'immediate'}
async function run(data,executor){cleanup();const action=String(data?.action||data?.command||''),id=eventId(data);if(id&&seen.has(id))return{ok:true,duplicate:true};if(id)seen.set(id,Date.now());const mode=policy(action);if(mode!=='queue')return{ok:!!(await executor(data)),duplicate:false};const prev=queues.get(action)||Promise.resolve();const next=prev.catch(()=>{}).then(()=>executor(data));queues.set(action,next.finally(()=>{if(queues.get(action)===next)queues.delete(action)}));return{ok:!!(await next),duplicate:false}}
function clear(){seen.clear();queues.clear()}
window.FrutasActionManager={run,clear,eventId,policy,getSeenCount:()=>seen.size};
})();
