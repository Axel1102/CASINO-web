import { writeFile, mkdir } from 'node:fs/promises';
const targets=await (await fetch('http://127.0.0.1:9224/json')).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let next=0;const pending=new Map();const errors=[];
socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(message.error):p.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const settle=()=>evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const navigate=async hash=>{await evaluate(`location.hash=${JSON.stringify(hash)}`);await settle();};
const assert=async(expression,label)=>{if(!await evaluate(expression))throw new Error(label);console.log('PASS '+label);};
await send('Runtime.enable');await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:4173/lab.html#home'});
for(let i=0;i<30;i++){if(await evaluate("document.querySelector('.group-photo')?.complete && document.querySelector('.group-photo')?.naturalWidth > 0"))break;await new Promise(r=>setTimeout(r,100));}
await assert("document.querySelector('.group-photo').naturalWidth===1177",'real group photograph loaded');
await mkdir('previews/nov04',{recursive:true});
for(const route of ['home','research','people','publications','news','join']){
  await navigate(route);
  await assert('document.documentElement.scrollWidth <= innerWidth',route+' desktop width');
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`previews/nov04/${route}.png`,Buffer.from(shot.data,'base64'));
}
await navigate('publications');
await evaluate("document.querySelector('[data-topic=security]').click(); document.querySelector('#paper-year').value='2025';document.querySelector('#paper-year').dispatchEvent(new Event('change'))");
await assert("document.querySelector('#paper-count').textContent==='0 results' && document.querySelector('[data-reset-papers]')",'combined filters and empty state');
await evaluate("document.querySelector('[data-reset-papers]').click();document.querySelector('#paper-search').value='agency';document.querySelector('#paper-search').dispatchEvent(new Event('input'))");
await assert("document.querySelectorAll('.paper').length===1",'publication search');
await evaluate("document.querySelector('[data-citation]').focus(); document.querySelector('[data-citation]').click()");
await assert("document.querySelector('dialog').open && document.querySelector('#bibtex').value.includes('SAMPLE RECORD')",'citation dialog and honest sample export');
await evaluate("document.querySelector('.dialog-close').click()");
await settle();
await assert("document.activeElement.hasAttribute('data-citation')",'dialog restores keyboard focus');
await navigate('research/ai');await evaluate("document.querySelector('a[href=\"#publications?topic=ai\"]').click()");await settle();
await assert("document.querySelectorAll('.paper').length===1 && document.querySelector('[data-topic=ai]').getAttribute('aria-pressed')==='true'",'research-to-publication cross-link');
await evaluate('history.back()');await settle();await assert("document.querySelector('h1').textContent==='Human–AI Interaction'",'browser Back restores research detail');
await navigate('people');await evaluate("document.querySelector('[data-role=Alumni]').click()");await assert("document.querySelectorAll('.person').length===1",'member role filtering');
await evaluate("document.querySelector('[data-member]').click()");await assert("document.querySelector('dialog').open",'member profile dialog');await evaluate("document.querySelector('.dialog-close').click()");
await navigate('news');await evaluate("document.querySelector('[data-news-category=Events]').click()");await assert("document.querySelectorAll('.news-row').length===1",'news category filtering');
await navigate('join');await evaluate("document.querySelector('.checklist input').click()");await assert("document.querySelector('#check-count').textContent==='1 of 4 items reviewed'",'application checklist');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
for(const route of ['home','research','research/ai','people','publications','news','news/life','join']){await navigate(route);await assert('document.documentElement.scrollWidth <= innerWidth',route+' mobile width');}
await navigate('home');await evaluate("document.querySelector('#menu-toggle').click()");await assert("document.querySelector('#menu-toggle').getAttribute('aria-expanded')==='true'",'mobile menu opens');await evaluate("document.querySelector('#navigation a[href=\"#people\"]').click()");await settle();await assert("document.querySelector('#menu-toggle').getAttribute('aria-expanded')==='false' && document.querySelector('h1').textContent==='People'",'mobile menu navigation');
await navigate('home');const mobileShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('previews/nov04/mobile.png',Buffer.from(mobileShot.data,'base64'));
await send('Page.navigate',{url:'http://127.0.0.1:4173/index.html#human'});await new Promise(r=>setTimeout(r,500));await assert("location.pathname.endsWith('/lab.html') && document.querySelector('.group-photo').naturalWidth===1177",'existing third-concept URL opens updated site');
if(errors.length)throw new Error(errors.join('\n'));
console.log('PASS no browser JavaScript exceptions');socket.close();
