import { Member, Paper } from './models.js';

const content = document.querySelector('#content');
const dialog = document.querySelector('#detail-dialog');
let data, previousFocus, galleryIndex=0;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = value => ({faculty:'Faculty',phd_student:'PhD students',masters_student:'Master’s students',research_assistant:'Research assistants',postdoc:'Postdocs',undergraduate:'Undergraduates',visiting_researcher:'Visitors',conference:'Conference',journal:'Journal',workshop:'Workshop',preprint:'Preprint',book_chapter:'Book chapter',thesis:'Thesis',other:'Other',lab_news:'Lab news',lab_life:'Lab life',publication:'Publication',event:'Event',award:'Award'}[value] || value);
const isCurrent = person => person.memberships.some(m => m.isCurrent);
const publicRecord = item => item.publishState === 'published' && !item.isDemo && item.publishedAt && Date.parse(item.publishedAt) <= Date.now();
function safeUrl(value, asset=false) {
  if (!value) return '';
  if (asset && /^(?:\.\/|\/)assets\/[a-z0-9_./-]+$/i.test(value) && !value.includes('..')) return value;
  try { const url=new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
const link = (url, title, cls='text-link') => safeUrl(url) ? `<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener">${esc(title)} ↗</a>` : '';
const asset = id => data.assets.find(a => a.id === id);
function image(id, cls='', priority=false) {
  const a=asset(id), url=safeUrl(a?.url,true);
  return url ? `<img class="${cls}" src="${esc(url)}" alt="${esc(a.alt)}" ${a.width?`width="${a.width}"`:''} ${a.height?`height="${a.height}"`:''} ${priority?'fetchpriority="high"':'loading="lazy"'}>` : '';
}
// Paragraphs, line breaks and bullet lists. Raw HTML remains escaped text.
function prose(value) {
  return String(value || '').split(/\n\s*\n/).filter(Boolean).map(block => block.split('\n').every(line=>line.startsWith('- ')) ? `<ul>${block.split('\n').map(line=>`<li>${esc(line.slice(2))}</li>`).join('')}</ul>` : `<p>${esc(block).replaceAll('\n','<br>')}</p>`).join('');
}
const heading = (title,description='',kicker='CASINO LAB') => `<header class="page-heading"><p class="eyebrow">${esc(kicker)}</p><h1>${esc(title)}</h1>${description?`<p>${esc(description)}</p>`:''}</header>`;
function fullName(value) {
  if(value!=='Collaborative Security and Interaction Group')return esc(value);
  const initials=new Set([0,4,14,27,28,36]);
  return [...value].map((letter,i)=>initials.has(i)?`<strong class="acronym-letter ${[0,14,27].includes(i)?'gold-letter':''}" data-letter="${letter.toUpperCase()}">${letter}</strong>`:esc(letter)).join('');
}
function paperPage(p) {
  return /^#publications\/[a-z0-9-]+$/.test(p.pageUrl) ? p.pageUrl : safeUrl(p.pageUrl);
}
function paperLink(p,title=p.title) {
  const url=paperPage(p);
  return url?`<a href="${esc(url)}" ${url.startsWith('#')?'':'target="_blank" rel="noopener"'}>${esc(title)}</a>`:esc(title);
}
function photoStack() {
  const ids=data.siteSettings.heroPhotoAssetIds.filter(id=>asset(id));
  if(!ids.length)return '';
  galleryIndex=((galleryIndex%ids.length)+ids.length)%ids.length;
  return `<div class="photo-stack" aria-label="Lab photo album">${ids.map((id,i)=>{const depth=(i-galleryIndex+ids.length)%ids.length;return `<div class="stack-sheet" style="--depth:${depth}" ${depth?'aria-hidden="true"':''}><button class="stack-photo" data-photo="${esc(id)}" aria-label="View group photo ${i+1}" ${depth?'tabindex="-1"':''}>${image(id,'group-photo',depth===0)}</button></div>`;}).join('')}</div><div class="gallery-controls">${ids.length>1?'<button data-gallery-step="-1" aria-label="Previous photo">←</button>':''}<span class="gallery-count" role="status" aria-live="polite">${galleryIndex+1} / ${ids.length}</span>${ids.length>1?'<button data-gallery-step="1" aria-label="Next photo">→</button>':''}<button class="gallery-expand" data-photo="${esc(ids[galleryIndex])}">View full photo ↗</button></div>`;
}
function photo(id=data.siteSettings.heroPhotoAssetIds[0]) {
  if (!asset(id)) return '';
  return `<figure><button class="photo-button" data-photo="${esc(id)}" aria-label="View full group photo">${image(id,'group-photo',true)}</button><figcaption class="photo-caption"><span>${esc(asset(id).caption || 'Our group')}</span><button data-photo="${esc(id)}">View full photo ↗</button></figcaption></figure>`;
}
const researchCard = (t,i) => `<a class="research-card" href="#research/${encodeURIComponent(t.id)}"><span class="number">0${i+1}</span><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p><span class="text-link">Explore this area ↗</span></a>`;
const authors = paper => paper.authors.map(a => a.personId && data.people.some(p=>p.id===a.personId) ? `<a class="author-link" href="#member/${encodeURIComponent(a.personId)}">${esc(a.name)}</a>` : esc(a.name)).join(', ');
function paperActions(p) {
  const pdf=safeUrl(p.pdfUrl || asset(p.pdfAssetId)?.url,true);
  return [p.abstract?`<button data-abstract="${esc(p.id)}">Abstract</button>`:'',p.bibtex?`<button data-citation="${esc(p.id)}">Cite / BibTeX</button>`:'',pdf?`<a href="${esc(pdf)}" target="_blank" rel="noopener">PDF ↗</a>`:'',p.doi?link('https://doi.org/'+encodeURIComponent(p.doi),'DOI'):'',link(p.projectUrl,'Project'),link(p.codeUrl,'Code'),link(p.videoUrl,'Video')].join('');
}
const paperRow = p => `<article class="paper"><span class="paper-year">${p.year}</span><div><div class="paper-meta">${esc(label(p.type))} ${p.venue.shortName?'· '+esc(p.venue.shortName):''}</div><h3>${paperLink(p)}</h3><p>${authors(p)}</p><p>${esc(p.venue.name)}</p><div class="paper-actions">${paperActions(p)}</div></div></article>`;
const newsRow = n => `<article class="news-row"><span class="news-date">${esc(n.date)}</span><div><span class="news-type">${esc(label(n.category))}</span><h3><a href="#news/${encodeURIComponent(n.id)}">${esc(n.title)}</a></h3><p>${esc(n.summary)}</p><a href="#news/${encodeURIComponent(n.id)}">Read more ↗</a></div></article>`;

function home() {
  const s=data.siteSettings;
  const selected=s.featuredPublicationIds.map(id=>data.publications.find(p=>p.id===id)).filter(Boolean);
  const latest=(selected.length?selected:[...data.publications].sort((a,b)=>b.year-a.year)).slice(0,3);
  content.innerHTML=`<section class="hm-hero"><div class="hm-copy"><p class="eyebrow">${esc(s.institution)} · Research group</p><h1 class="hero-wordmark">${image(s.wordmarkAssetId,'wordmark',true)}<span class="sr-only">${esc(s.name)}</span></h1><h2 class="lab-full-name">${fullName(s.fullName)}</h2><p class="hm-summary">${esc(s.introduction)}</p><div class="hm-actions"><a href="#research">Explore our research</a><a href="#member">Meet the group ↗</a></div></div><div id="home-gallery" class="hm-gallery">${photoStack()}</div></section>
    <section class="hm-about"><div><p class="eyebrow">ABOUT THE LAB</p><h2>Research at<br>${esc(s.institution)}</h2></div><div class="about-text">${prose(s.aboutMarkdown || s.introduction)}</div></section>
    <section class="hm-research"><header class="hm-section-heading"><p class="eyebrow">WHAT WE WORK ON</p><h2>Research areas</h2></header><div class="hm-card-grid">${data.researchAreas.map((t,i)=>`<article class="hm-card ${i%2?'card-gold':'card-green'}"><span>0${i+1}</span><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p><a href="#research/${encodeURIComponent(t.id)}">Explore ↗</a></article>`).join('')}<article class="hm-card card-cream"><span>0${data.researchAreas.length+1}</span><h3>Work with us</h3><p>PhD study, research assistantships, and interdisciplinary collaboration.</p><a href="#contact">Opportunities ↗</a></article></div></section>
    <section class="hm-stories"><div class="hm-stories-title"><p class="eyebrow">FROM THE LAB</p><h2>Recent publications</h2><a class="text-link" href="#publications">View all ${data.publications.length} publications ↗</a></div><div class="hm-story-list">${latest.map(p=>`<article><small>${p.year} · ${esc(p.venue.shortName || label(p.type))}</small><h3>${paperLink(p)}</h3></article>`).join('')}</div></section>
    <section class="hm-join-section"><h2>Contact</h2><p>Get in touch about our research, collaboration, and opportunities.</p><a class="button" href="#contact">Contact the lab ↗</a></section>`;
}

function research(id) {
  const t=data.researchAreas.find(t=>t.id===id || t.slug===id);
  if(id&&!t)return notFound();
  if(!t){content.innerHTML=heading('Research','Information security, human–computer interaction, and interdisciplinary collaboration.')+`<div class="research-grid bottom-space">${data.researchAreas.map(researchCard).join('')}</div>`;return;}
  const related=data.publications.filter(p=>p.researchAreaIds.includes(t.id));
  content.innerHTML=`<a class="breadcrumb" href="#research">← Research areas</a>${heading(t.title,t.summary,'RESEARCH')}<div class="topic-layout"><section><div class="prose">${prose(t.bodyMarkdown)}</div>${t.questions.length?`<h2>Research questions</h2><ul>${t.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>`:''}<div class="tag-row">${t.tags.map(tag=>`<span class="tag">${esc(tag)}</span>`).join('')}</div></section><aside><h2>Explore our work</h2><p>Read the group’s publications and meet our researchers.</p><a class="button secondary" href="#publications${related.length?'?topic='+encodeURIComponent(t.id):''}">${related.length?'Related publications':'Publication archive'} ↗</a><p><a class="text-link" href="#member?area=${encodeURIComponent(t.id)}">Meet the researchers ↗</a></p></aside></div>`;
}

function people(id, params) {
  if(id){
    const p=data.people.find(p=>p.id===id||p.slug===id);if(!p)return notFound();
    const related=p.getPapers(data.publications);
    content.innerHTML=`<a class="breadcrumb" href="#member">← All members</a>${heading(p.name,p.title,isCurrent(p)?'MEMBER':'ALUMNI')}<div class="profile-layout"><aside>${image(p.portraitAssetId,'profile-portrait')}</aside><section><div class="prose">${prose(p.bioMarkdown)}</div>${p.interests.length?`<h2>Research interests</h2><div class="tag-row">${p.interests.map(i=>`<span class="tag">${esc(i)}</span>`).join('')}</div>`:''}${emailLink(p.publicEmail)}<div class="profile-links">${p.links.map(l=>link(l.url,l.label)).join('')}</div>${p.alumniDestination?`<p>${esc(p.alumniDestination)}</p>`:''}</section></div><section class="member-papers bottom-space"><div class="section-heading"><h2>Publications</h2><span>${related.length} papers</span></div>${related.length?related.map(paperRow).join(''):'<p>No publications listed yet.</p>'}</section>`;return;
  }
  const area=params.get('area')||'';
  const roles=[...new Set(data.people.flatMap(p=>p.memberships.filter(m=>m.isCurrent).map(m=>m.role)))];
  content.innerHTML=heading('Member','Meet the researchers behind CASINO.')+`<div class="chips" id="people-chips" aria-label="Filter members"><button class="chip" data-role="all" aria-pressed="true">All</button>${roles.map(r=>`<button class="chip" data-role="${r}" aria-pressed="false">${esc(label(r))}</button>`).join('')}<button class="chip" data-role="alumni" aria-pressed="false">Alumni</button></div>${area?`<p class="source-note">Research area: ${esc(data.researchAreas.find(a=>a.id===area)?.title||area)} · <a href="#member">Show everyone</a></p>`:''}<p class="results-line" id="people-count" aria-live="polite"></p><div class="people-grid" id="people-results"></div>`;
  let role='all';
  const update=()=>{
    const visible=data.people.filter(p=>(!area||p.researchAreaIds.includes(area))&&(role==='all'||(role==='alumni'?!isCurrent(p):p.memberships.some(m=>m.role===role&&m.isCurrent))));
    document.querySelector('#people-count').textContent=`${visible.length} members`;
    document.querySelector('#people-results').innerHTML=visible.length?visible.map(p=>`<article class="person"><div class="avatar">${image(p.portraitAssetId)}</div><span class="news-type">${esc(isCurrent(p)?p.title:'Alumni')}</span><h3><a href="#member/${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3></article>`).join(''):'<div class="empty"><h3>No members in this category</h3></div>';
  };
  document.querySelector('#people-chips').addEventListener('click',e=>{const b=e.target.closest('[data-role]');if(!b)return;role=b.dataset.role;document.querySelectorAll('[data-role]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));update();});update();
}

function publications(id, params) {
  if(id){
    const p=data.publications.find(p=>p.id===id||p.slug===id);if(!p)return notFound();
    content.innerHTML=`<a class="breadcrumb" href="#publications">← All publications</a>${heading(p.title,`${p.year} · ${p.venue.name}`,label(p.type))}<article class="prose"><p>${authors(p)}</p>${p.abstract?`<h2>Abstract</h2>${prose(p.abstract)}`:''}<div class="paper-actions">${paperActions(p)}</div>${p.sourceUrl?`<p class="source-note">${link(p.sourceUrl,'Original publication listing')}</p>`:''}</article>`;return;
  }
  const years=[...new Set(data.publications.map(p=>p.year))].sort((a,b)=>b-a);
  const types=[...new Set(data.publications.map(p=>p.type))];
  const taggedAreas=data.researchAreas.filter(t=>data.publications.some(p=>p.researchAreaIds.includes(t.id)));
  let topic=params.get('topic')||'',personId=params.get('personId')||'',page=1;
  content.innerHTML=heading('Publications','Research from the group, with the original author order and publication venues.')+`<div class="toolbar"><label class="field">Year<select id="paper-year"><option value="">All years</option>${years.map(y=>`<option>${y}</option>`).join('')}</select></label><label class="field">Type<select id="paper-type"><option value="">All types</option>${types.map(t=>`<option value="${t}">${esc(label(t))}</option>`).join('')}</select></label><label class="field">Sort<select id="paper-sort"><option value="new">Newest first</option><option value="old">Oldest first</option></select></label></div>${taggedAreas.length?`<div class="chips" id="paper-topics"><button class="chip" data-topic="" aria-pressed="true">All areas</button>${taggedAreas.map(t=>`<button class="chip" data-topic="${esc(t.id)}" aria-pressed="false">${esc(t.title)}</button>`).join('')}</div>`:''}<div class="results-line"><span id="paper-count" aria-live="polite"></span><button class="text-link" id="clear-filters">Clear filters</button></div><div id="paper-results"></div><div class="pagination" id="pagination"></div>${data.siteSettings.publicationArchiveUrl?`<p class="source-note">Before 2023: ${link(data.siteSettings.publicationArchiveUrl,'Earlier publication archive')}</p>`:''}`;
  for(const [param,field] of [['year','paper-year'],['type','paper-type'],['sort','paper-sort']])if(params.has(param))document.getElementById(field).value=params.get(param);
  const update=()=>{
    const year=document.querySelector('#paper-year').value,type=document.querySelector('#paper-type').value,sort=document.querySelector('#paper-sort').value;
    const list=data.publications.filter(p=>(!topic||p.researchAreaIds.includes(topic))&&(!personId||p.authors.some(a=>a.personId===personId))&&(!year||String(p.year)===year)&&(!type||p.type===type)).sort((a,b)=>sort==='old'?a.year-b.year:b.year-a.year);
    const pages=Math.ceil(list.length/12);page=Math.min(page,pages||1);
    document.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
    document.querySelector('#paper-count').textContent=`${list.length} result${list.length===1?'':'s'}${personId?' · '+(data.people.find(p=>p.id===personId)?.name||'Selected author'):''}`;
    document.querySelector('#paper-results').innerHTML=list.length?list.slice((page-1)*12,page*12).map(paperRow).join(''):'<div class="empty"><h3>No publications match these filters.</h3><p>Try a broader search or clear the filters.</p><button class="button secondary" data-reset-papers>Clear filters</button></div>';
    document.querySelector('#pagination').innerHTML=pages>1?`<button class="button secondary" data-page="${page-1}" ${page===1?'disabled':''}>← Previous</button><span>Page ${page} of ${pages}</span><button class="button secondary" data-page="${page+1}" ${page===pages?'disabled':''}>Next →</button>`:'';
    const query=new URLSearchParams();for(const [k,v] of Object.entries({year,type,topic,personId,sort:sort==='old'?'old':''}))if(v)query.set(k,v);
    history.replaceState(null,'',`#publications${query.size?'?'+query:''}`);
  };
  const reset=()=>{topic='';personId='';page=1;['paper-year','paper-type'].forEach(id=>document.getElementById(id).value='');document.querySelector('#paper-sort').value='new';update();};
  ['paper-year','paper-type','paper-sort'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{page=1;update();}));
  document.querySelector('#paper-topics')?.addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(b){topic=b.dataset.topic;page=1;update();}});
  document.querySelector('#clear-filters').addEventListener('click',reset);
  document.querySelector('#paper-results').addEventListener('click',e=>{if(e.target.closest('[data-reset-papers]'))reset();});
  document.querySelector('#pagination').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;page=Number(b.dataset.page);update();document.querySelector('#paper-count').scrollIntoView({block:'start'});});update();
}

function newsPage(id) {
  if(id){const n=data.news.find(n=>n.id===id||n.slug===id);if(!n)return notFound();content.innerHTML=`<a class="breadcrumb" href="#news">← All news</a>${heading(n.title,n.date,label(n.category))}<article class="prose">${image(n.coverAssetId)}${prose(n.bodyMarkdown)}${n.galleryAssetIds.map(id=>photo(id)).join('')}</article>`;return;}
  content.innerHTML=heading('News & lab life','Updates and moments from the group.')+`<div class="bottom-space">${data.news.length?data.news.map(newsRow).join(''):'<p class="source-note">News updates will appear here.</p>'}${data.siteSettings.heroPhotoAssetIds.map(id=>photo(id)).join('')}</div>`;
}
function emailLink(value) {
  const valid=value&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
  return valid?`<a class="contact-email" href="mailto:${esc(value)}">${esc(value)}</a>`:'';
}
function join() {
  const s=data.siteSettings,opportunities=data.opportunities.filter(o=>o.availability==='open'&&(!o.deadlineAt||Date.parse(o.deadlineAt)>=Date.now()));
  const checklist=[...new Set(opportunities.flatMap(o=>o.applicationChecklist))];
  content.innerHTML=heading('Contact','Research enquiries, collaboration, and PhD opportunities.')+`<div class="join-grid"><section><h2>Application information</h2>${opportunities.map((o,i)=>`<details ${i===0?'open':''}><summary>${esc(o.title)}</summary>${prose(o.bodyMarkdown)}${o.requirements.length?`<ul class="requirements">${o.requirements.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`:''}${link(o.applicationUrl,'Apply')}${link(o.guidanceUrl,'Original guidance')}</details>`).join('')}${s.recruitmentMarkdown?`<details><summary>Timeline, program &amp; funding</summary>${prose(s.recruitmentMarkdown)}</details>`:''}${checklist.length?`<section class="section"><h2>Prepare your enquiry</h2><ul class="checklist">${checklist.map(c=>`<li><label><input type="checkbox">${esc(c)}</label></li>`).join('')}</ul><p class="check-count" id="check-count" aria-live="polite">0 of ${checklist.length} items reviewed</p></section>`:''}</section><aside><p class="eyebrow">GET IN TOUCH</p><h2>${esc(data.people.find(p=>p.memberships.some(m=>m.role==='faculty'))?.name||s.name)}</h2><p>${esc(s.institution)}</p>${emailLink(s.publicEmail)}<div class="join-actions"><button class="button secondary" id="copy-email">Copy email</button></div><p id="email-status" class="dialog-status" role="status"></p><div class="profile-links">${s.links.map(l=>link(l.url,l.label)).join('')}</div></aside></div>`;
  document.querySelectorAll('.checklist input').forEach(input=>input.addEventListener('change',()=>{document.querySelector('#check-count').textContent=`${document.querySelectorAll('.checklist input:checked').length} of ${checklist.length} items reviewed`;}));
  document.querySelector('#copy-email').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(s.publicEmail);document.querySelector('#email-status').textContent='Email address copied.';}catch{document.querySelector('#email-status').textContent='Select the email address above to copy it.';}});
}

function openDialog(html) {
  previousFocus=document.activeElement;document.querySelector('#dialog-body').innerHTML=`<div class="dialog-content">${html}</div>`;dialog.showModal();document.body.style.overflow='hidden';dialog.querySelector('.dialog-close').focus();
}
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';if(previousFocus?.isConnected)previousFocus.focus();});
content.addEventListener('click',e=>{
  const galleryControl=e.target.closest('[data-gallery-step]');
  if(galleryControl){galleryIndex+=Number(galleryControl.dataset.galleryStep);document.querySelector('#home-gallery').innerHTML=photoStack();document.querySelector(`[data-gallery-step="${galleryControl.dataset.galleryStep}"]`).focus({preventScroll:true});return;}
  const photoButton=e.target.closest('[data-photo]');if(photoButton){openDialog(`<h2 id="dialog-title">${esc(asset(photoButton.dataset.photo)?.caption||'Our group')}</h2>${image(photoButton.dataset.photo)}`);return;}
  const abstract=e.target.closest('[data-abstract]');if(abstract){const p=data.publications.find(p=>p.id===abstract.dataset.abstract);openDialog(`<h2 id="dialog-title">${esc(p.title)}</h2>${prose(p.abstract)}`);return;}
  const citation=e.target.closest('[data-citation]');if(citation){const p=data.publications.find(p=>p.id===citation.dataset.citation);openDialog(`<h2 id="dialog-title">Citation</h2><label for="bibtex">BibTeX</label><textarea id="bibtex" readonly spellcheck="false">${esc(p.bibtex)}</textarea><div class="actions"><button class="button" id="copy-citation">Copy BibTeX</button><button class="button secondary" id="download-citation">Download .bib</button></div><p class="dialog-status" id="citation-status" role="status"></p>`);
    document.querySelector('#copy-citation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(p.bibtex);document.querySelector('#citation-status').textContent='Citation copied.';}catch{document.querySelector('#bibtex').select();document.querySelector('#citation-status').textContent='Text selected. Use your keyboard to copy.';}});
    document.querySelector('#download-citation').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([p.bibtex],{type:'application/x-bibtex'}));const a=document.createElement('a');a.href=url;a.download=`${p.slug}.bib`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  }
});
function notFound(){content.innerHTML=heading('Page not found','The requested page is not available.')+'<div class="bottom-space"><a class="button secondary" href="#home">Return home</a></div>';}
function route(){
  if(!data)return;if(dialog.open)dialog.close();
  const [path,query='']=location.hash.slice(1).split('?');
  const [rawPage='home',rawId]=(path||'home').split('/');
  const page=({people:'member',join:'contact'})[rawPage]||rawPage;
  let id;try{id=rawId?decodeURIComponent(rawId):undefined;}catch{return notFound();}
  const params=new URLSearchParams(query);content.className=page==='home'?'home-main':'wrap';
  if(page==='home')home();else if(page==='member')people(id,params);else if(page==='contact')join();else if(page==='research')research(id);else if(page==='publications')publications(id,params);else if(page==='news')newsPage(id);else notFound();
  document.querySelectorAll('#navigation a').forEach(a=>{if(a.hash===`#${page}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.querySelector('#navigation').classList.remove('open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');
  document.title=`${content.querySelector('h1')?.textContent||'CASINO'} · CASINO Lab`;window.scrollTo(0,0);
}
document.querySelector('#menu-toggle').addEventListener('click',()=>{const open=document.querySelector('#navigation').classList.toggle('open');document.querySelector('#menu-toggle').setAttribute('aria-expanded',String(open));});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();content.focus();content.scrollIntoView();});
window.addEventListener('hashchange',()=>{route();content.focus({preventScroll:true});});
async function start(){
  try{
    const response=await fetch('./data/lab.json',{cache:'no-cache'});if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const loaded=await response.json();if(loaded.schemaVersion!=='1.0')throw new Error('Unsupported data schema');
    for(const name of ['people','researchAreas','publications','news','opportunities'])loaded[name]=loaded[name].filter(publicRecord);
    loaded.people=loaded.people.map(record=>new Member(record));loaded.publications=loaded.publications.map(record=>new Paper(record));
    data=loaded;data.people.sort((a,b)=>a.sortOrder-b.sortOrder);data.researchAreas.sort((a,b)=>a.sortOrder-b.sortOrder);data.opportunities.sort((a,b)=>a.sortOrder-b.sortOrder);
    const logo=safeUrl(asset(data.siteSettings.logoAssetId)?.url,true);
    if(logo){document.querySelector('.brand img').src=logo;document.querySelector('link[rel=icon]').href=logo;}
    const wordmark=safeUrl(asset(data.siteSettings.wordmarkAssetId)?.url,true);
    if(wordmark)document.querySelector('.footer-wordmark').src=wordmark;
    route();
  }catch(error){content.innerHTML=heading('The content could not be loaded',location.protocol==='file:'?'Open this website through a local web server or the hosted link. JSON loading is unavailable from a file:// preview.':'Please reload the page to try again.')+'<button class="button" id="retry">Reload</button>';document.querySelector('#retry').onclick=()=>location.reload();console.error('Lab data loading failed:',error);}
}
start();
