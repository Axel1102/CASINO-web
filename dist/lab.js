const topics = [
  { id: 'security', title: 'Usable Security & Privacy', description: 'Understanding how people make security and privacy decisions in everyday digital life.', tags: ['Privacy', 'Human factors', 'Digital safety'], questions: ['How do people understand security and privacy risks?', 'How can security mechanisms fit everyday practices?', 'How do social relationships shape digital safety?'] },
  { id: 'ai', title: 'Human–AI Interaction', description: 'Studying how people understand, work with, and make decisions alongside AI systems.', tags: ['Human–AI interaction', 'Agency', 'Collaboration'], questions: ['How do people make sense of AI-generated information?', 'What supports meaningful human control?', 'How can interfaces support collaboration with AI?'] },
  { id: 'society', title: 'Learning & Society', description: 'Exploring education, learning, and HCI for development through the experiences of people and communities.', tags: ['Education', 'HCI4D', 'Communities'], questions: ['How can technology support learning?', 'Whose needs are represented in the design process?', 'How do local contexts shape technology use?'] },
  { id: 'finance', title: 'Financial & Digital Security', description: 'Investigating security at the intersection of computing, blockchains, and the digital economy.', tags: ['Blockchains', 'Financial security', 'Digital economy'], questions: ['How do people navigate digital financial systems?', 'What risks arise in decentralized systems?', 'How can secure systems support informed decisions?'] }
];
// Clearly labeled examples exercise the prototype; these are not lab publications.
const papers = [
  { id:'p1', title:'Understanding everyday privacy decisions', year:2026, venue:'Conference', topic:'security', authors:'Sample Author A, Sample Author B', abstract:'Sample abstract for testing the publication detail view. This record illustrates a qualitative study of privacy decisions; it is not a published lab paper.' },
  { id:'p2', title:'Human agency in AI-assisted work', year:2026, venue:'Journal', topic:'ai', authors:'Sample Author C, Sample Author D', abstract:'Sample abstract for a human–AI interaction study. Use this record to explore search, topic filters, and citation export.' },
  { id:'p3', title:'Learning technologies in community settings', year:2025, venue:'Conference', topic:'society', authors:'Sample Author A, Sample Author E', abstract:'Sample abstract illustrating how a learning and HCI4D project could be presented. This is demonstration content.' },
  { id:'p4', title:'Risk communication in digital finance', year:2025, venue:'Journal', topic:'finance', authors:'Sample Author B, Sample Author D', abstract:'Sample abstract for a digital finance study. It demonstrates a publication record connected to a research theme.' },
  { id:'p5', title:'Making security interfaces understandable', year:2024, venue:'Conference', topic:'security', authors:'Sample Author C, Sample Author E', abstract:'Sample abstract for testing an older publication record and the year filter. No paper or award is claimed.' }
];
const members = [
  {id:'pi',name:'Kanye Ye Wang',role:'Faculty',initials:'YW',topic:'Information security · HCI · Finance',bio:'Assistant Professor in Computer Science and Finance at the University of Macau. Principal investigator of the group.',url:'https://www.ye.wang/'},
  {id:'student',name:'Doctoral researcher',role:'PhD students',initials:'PhD',topic:'Usable security & privacy',sample:true,bio:'Sample member profile. A full profile will include a name, portrait, research interests, personal website, and related publications.'},
  {id:'ra',name:'Research assistant',role:'Research assistants',initials:'RA',topic:'Human–AI interaction',sample:true,bio:'Sample research assistant profile. Member information and links will be supplied by the group.'},
  {id:'alumni',name:'Alumni profile',role:'Alumni',initials:'AL',topic:'Learning & society',sample:true,bio:'Sample alumni profile. The final directory can include years in the group and the next institution or role.'}
];
const news = [
  {id:'identity',category:'Lab news',date:'Lab update',title:'Introducing CASINO Lab',summary:'Our new name: Collaborative Security and Interaction Group.',body:'CASINO is the new identity of our research group. This website brings together our research themes, people, publications, and opportunities.'},
  {id:'life',category:'Lab life',date:'Photo journal',title:'From the group',summary:'A moment together, beyond our research.',body:'A group photograph shared by the lab.',photo:true},
  {id:'seminar',category:'Events',date:'Sample event',title:'Research seminar',summary:'An example event entry with a date, location, and speaker.',body:'Sample event. The final event detail will include the speaker, abstract, date, location, and registration link when available.',sample:true}
];
const content = document.querySelector('#content');
const dialog = document.querySelector('#detail-dialog');
let previousFocus;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sampleTag = '<span class="sample-tag">Sample</span>';
const topicName = id => topics.find(t => t.id === id)?.title || '';
const heading = (title,description,kicker='CASINO LAB') => `<header class="page-heading"><p class="eyebrow">${kicker}</p><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</header>`;
const photo = `<figure><button class="photo-button" data-photo aria-label="View full group photo"><img class="group-photo" src="./assets/group-photo.png" alt="CASINO lab group gathered for a photograph" width="1177" height="662" fetchpriority="high"></button><figcaption class="photo-caption"><span>Our group · University of Macau</span><button data-photo>View full photo ↗</button></figcaption></figure>`;
const researchCard = (t,i) => `<a class="research-card" href="#research/${t.id}"><span class="number">0${i+1}</span><h3>${t.title}</h3><p>${t.description}</p><span class="text-link">Explore this area ↗</span></a>`;
const newsRow = n => `<article class="news-row"><span class="news-date">${n.date}</span><div><span class="news-type">${n.category}</span> ${n.sample?sampleTag:''}<h3><a href="#news/${n.id}">${n.title}</a></h3><p>${n.summary}</p><a href="#news/${n.id}">Read more ↗</a></div></article>`;

function home() {
  content.innerHTML = `<section class="home-intro"><div><p class="eyebrow">CASINO LAB · UNIVERSITY OF MACAU</p><h1>Collaborative Security<br>and Interaction Group</h1></div><div><p>We study usable security, privacy, human–AI interaction, and the role of technology in society.</p><div class="intro-links"><a href="#research">Explore our research ↗</a><a href="#people">Meet the group ↗</a></div></div></section>${photo}<section class="section"><div class="section-heading"><h2>Research areas</h2><a class="text-link" href="#research">All research ↗</a></div><div class="research-grid">${topics.map(researchCard).join('')}</div></section><section class="home-bottom"><div><div class="section-heading"><h2>From the lab</h2><a class="text-link" href="#news">All news ↗</a></div><div class="compact-news">${newsRow(news[0])}</div></div><aside class="quiet-callout"><p class="eyebrow">WORK WITH US</p><h2>Join the group</h2><p>Explore PhD and research assistant opportunities, research interests, and application information.</p><a class="button secondary" href="#join">Opportunities ↗</a></aside></section>`;
}

function research(id) {
  const t = topics.find(t => t.id === id);
  if (id && !t) return notFound();
  if (!t) {
    content.innerHTML = heading('Research','Our work connects information security, human–computer interaction, and society.') + `<div class="research-grid bottom-space">${topics.map(researchCard).join('')}</div>`;
    return;
  }
  content.innerHTML = `<a class="breadcrumb" href="#research">← Research areas</a>${heading(t.title,t.description,'RESEARCH AREA')}<div class="topic-layout"><section><h2>Questions we explore</h2><ul>${t.questions.map(q=>`<li>${q}</li>`).join('')}</ul><div class="tag-row">${t.tags.map(tag=>`<span class="tag">${tag}</span>`).join('')}</div></section><aside><h2>Explore related work</h2><p>Browse the publication archive by research area.</p><a class="button secondary" href="#publications?topic=${t.id}">Related publications ↗</a><p><a class="text-link" href="#join">Discuss a collaboration ↗</a></p></aside></div>`;
}

function people() {
  content.innerHTML = heading('People','Meet the researchers behind CASINO.') + `<p class="sample-note">Directory preview. Profiles marked Sample await member information.</p><div class="toolbar"><label class="field grow">Find a person<input type="search" id="people-search" placeholder="Name or research interest"></label></div><div class="chips" id="people-chips" aria-label="Filter people by role">${['All','Faculty','PhD students','Research assistants','Alumni'].map((r,i)=>`<button class="chip" data-role="${r}" aria-pressed="${i===0}">${r}</button>`).join('')}</div><p class="results-line" id="people-count" aria-live="polite"></p><div class="people-grid" id="people-results"></div>`;
  let role='All';
  const update=()=>{
    const q=document.querySelector('#people-search').value.trim().toLowerCase();
    const visible=members.filter(m=>(role==='All'||m.role===role)&&`${m.name} ${m.topic}`.toLowerCase().includes(q));
    document.querySelector('#people-count').textContent=`${visible.length} profile${visible.length===1?'':'s'}`;
    document.querySelector('#people-results').innerHTML=visible.length?visible.map(m=>`<article class="person"><div class="avatar" aria-hidden="true">${m.initials}</div><span class="news-type">${m.role}</span> ${m.sample?sampleTag:''}<h3>${m.name}</h3><p>${m.topic}</p><button data-member="${m.id}">View profile ↗</button></article>`).join(''):'<div class="empty"><h3>No profiles found</h3><p>Try a different name or category.</p></div>';
  };
  document.querySelector('#people-search').addEventListener('input',update);
  document.querySelector('#people-chips').addEventListener('click',e=>{const b=e.target.closest('[data-role]');if(!b)return;role=b.dataset.role;document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.role===role)));update();});
  update();
}

function publications(params) {
  content.innerHTML=heading('Publications','Search by title, author, year, or research area.')+`<p class="sample-note">Sample records for exploring the archive. These are not lab publications.</p><div class="toolbar"><label class="field grow">Search publications<input id="paper-search" type="search" placeholder="Title, author, or keyword"></label><label class="field">Year<select id="paper-year"><option value="">All years</option>${[2026,2025,2024].map(y=>`<option>${y}</option>`).join('')}</select></label><label class="field">Type<select id="paper-type"><option value="">All types</option><option>Conference</option><option>Journal</option></select></label><label class="field">Sort<select id="paper-sort"><option value="new">Newest first</option><option value="old">Oldest first</option></select></label></div><div class="chips" id="paper-topics" aria-label="Filter publications by topic"><button class="chip" data-topic="" aria-pressed="true">All areas</button>${topics.map(t=>`<button class="chip" data-topic="${t.id}" aria-pressed="false">${t.title}</button>`).join('')}</div><div class="results-line"><span id="paper-count" aria-live="polite"></span><button class="text-link" id="clear-filters">Clear filters</button></div><div class="bottom-space" id="paper-results"></div>`;
  let topic=params.get('topic')||'';
  if(!topics.some(t=>t.id===topic))topic='';
  const update=()=>{
    const q=document.querySelector('#paper-search').value.trim().toLowerCase();
    const year=document.querySelector('#paper-year').value,type=document.querySelector('#paper-type').value;
    const list=papers.filter(p=>(!topic||p.topic===topic)&&(!year||String(p.year)===year)&&(!type||p.venue===type)&&`${p.title} ${p.authors} ${p.year} ${topicName(p.topic)}`.toLowerCase().includes(q)).sort((a,b)=>document.querySelector('#paper-sort').value==='new'?b.year-a.year:a.year-b.year);
    document.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
    document.querySelector('#paper-count').textContent=`${list.length} result${list.length===1?'':'s'}`;
    document.querySelector('#paper-results').innerHTML=list.length?list.map(p=>`<article class="paper"><span class="paper-year">${p.year}</span><div><div class="paper-meta">${p.venue} ${sampleTag}</div><h3>${p.title}</h3><p>${p.authors}</p><p>${topicName(p.topic)}</p><div class="paper-actions"><button data-abstract="${p.id}">Abstract</button><button data-citation="${p.id}">Cite / BibTeX</button><a class="text-link" href="#research/${p.topic}">Research area ↗</a></div></div></article>`).join(''):'<div class="empty"><h3>No publications match these filters.</h3><p>Try a broader search or clear the filters.</p><button class="button secondary" data-reset-papers>Clear filters</button></div>';
  };
  const reset=()=>{topic='';document.querySelector('#paper-search').value='';document.querySelector('#paper-year').value='';document.querySelector('#paper-type').value='';document.querySelector('#paper-sort').value='new';update();};
  ['paper-search','paper-year','paper-type','paper-sort'].forEach(id=>document.getElementById(id).addEventListener(id==='paper-search'?'input':'change',update));
  document.querySelector('#paper-topics').addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(b){topic=b.dataset.topic;update();}});
  document.querySelector('#clear-filters').addEventListener('click',reset);
  document.querySelector('#paper-results').addEventListener('click',e=>{if(e.target.closest('[data-reset-papers]'))reset();});
  update();
}

function newsPage(id) {
  if(id){const n=news.find(n=>n.id===id);if(!n)return notFound();content.innerHTML=`<a class="breadcrumb" href="#news">← All news</a>${heading(n.title,n.date,n.category)}<article class="prose">${n.sample?sampleTag:''}<p>${n.body}</p>${n.photo?photo:''}<a class="text-link" href="#people">Meet the group ↗</a></article>`;return;}
  content.innerHTML=heading('News & lab life','Research updates, events, and moments from the group.')+`<div class="chips" aria-label="Filter news by category">${['All','Lab news','Lab life','Events'].map((c,i)=>`<button class="chip" data-news-category="${c}" aria-pressed="${i===0}">${c}</button>`).join('')}</div><div id="news-results" class="bottom-space">${news.map(newsRow).join('')}</div>`;
  document.querySelectorAll('[data-news-category]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-news-category]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));document.querySelector('#news-results').innerHTML=news.filter(n=>b.dataset.newsCategory==='All'||n.category===b.dataset.newsCategory).map(newsRow).join('');}));
}

function join() {
  content.innerHTML=heading('Join CASINO','PhD study, research assistantships, and interdisciplinary collaboration.')+`<div class="join-grid"><section><h2>Find your path</h2><details open><summary>University of Macau students</summary><p>The published recruitment guidance asks prospective PhD students at UM to begin with an RA position. Contact the principal investigator with your CV and UM transcript, and review the full eligibility requirements.</p></details><details><summary>Applicants from other institutions</summary><p>The current guidance focuses on direct PhD admission rather than external RA recruitment. Advisor recommendations and research fit are important. Read the full guidance before contacting the group.</p></details><details><summary>Research collaboration</summary><p>We welcome interdisciplinary conversations across information security, HCI, learning, and finance. Introduce your research interests and a possible point of connection.</p></details><p style="margin-top:24px"><a class="text-link" href="https://crab.ye.wang/info" target="_blank" rel="noopener">Full recruitment guidance ↗</a></p><section class="section"><h2>Prepare your enquiry</h2><ul class="checklist"><li><label><input type="checkbox">CV / academic background</label></li><li><label><input type="checkbox">Academic transcript</label></li><li><label><input type="checkbox">Research interests and fit</label></li><li><label><input type="checkbox">Relevant project or writing sample, if available</label></li></ul><p class="check-count" id="check-count" aria-live="polite">0 of 4 items reviewed</p></section></section><aside><p class="eyebrow">GET IN TOUCH</p><h2>Kanye Ye Wang</h2><p>Principal investigator<br>University of Macau</p><a class="contact-email" href="mailto:yewang.ethz@gmail.com">yewang.ethz@gmail.com</a><div class="join-actions"><a class="button" href="mailto:yewang.ethz@gmail.com?subject=CASINO%20Lab%20research%20enquiry">Email the PI ↗</a><button class="button secondary" id="copy-email">Copy email</button></div><p id="email-status" class="dialog-status" role="status"></p><a class="text-link" href="https://www.ye.wang/" target="_blank" rel="noopener">Faculty website ↗</a></aside></div>`;
  document.querySelectorAll('.checklist input').forEach(input=>input.addEventListener('change',()=>{document.querySelector('#check-count').textContent=`${document.querySelectorAll('.checklist input:checked').length} of 4 items reviewed`;}));
  document.querySelector('#copy-email').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('yewang.ethz@gmail.com');document.querySelector('#email-status').textContent='Email address copied.';}catch{document.querySelector('#email-status').textContent='Select the email address above to copy it.';}});
}

function openDialog(html) {
  previousFocus=document.activeElement;
  document.querySelector('#dialog-body').innerHTML=`<div class="dialog-content">${html}</div>`;
  dialog.showModal();
  document.body.style.overflow='hidden';
  dialog.querySelector('.dialog-close').focus();
}
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';if(previousFocus?.isConnected)previousFocus.focus();});

content.addEventListener('click',e=>{
  if(e.target.closest('[data-photo]')){openDialog('<h2 id="dialog-title">Our group</h2><img src="./assets/group-photo.png" alt="Full CASINO lab group photograph" width="1177" height="662">');return;}
  const member=e.target.closest('[data-member]');
  if(member){const m=members.find(m=>m.id===member.dataset.member);openDialog(`<p class="eyebrow">${m.role} ${m.sample?'· SAMPLE':''}</p><h2 id="dialog-title">${m.name}</h2><p>${m.bio}</p><p>${m.topic}</p>${m.url?`<a class="button secondary" href="${m.url}" target="_blank" rel="noopener">Personal website ↗</a>`:''}`);return;}
  const abstract=e.target.closest('[data-abstract]');
  if(abstract){const p=papers.find(p=>p.id===abstract.dataset.abstract);openDialog(`${sampleTag}<h2 id="dialog-title">${p.title}</h2><p>${p.authors} · ${p.year}</p><p>${p.abstract}</p>`);return;}
  const citation=e.target.closest('[data-citation]');
  if(citation){const p=papers.find(p=>p.id===citation.dataset.citation);const bib=`% SAMPLE RECORD — not an actual lab publication\n@misc{casino_sample_${p.id},\n  title = {${p.title}},\n  author = {${p.authors.replaceAll(', ',' and ')}},\n  year = {${p.year}},\n  note = {Demonstration record only}\n}`;openDialog(`${sampleTag}<h2 id="dialog-title">Citation</h2><label for="bibtex">BibTeX</label><textarea id="bibtex" readonly spellcheck="false">${esc(bib)}</textarea><div class="actions"><button class="button" id="copy-citation">Copy BibTeX</button><button class="button secondary" id="download-citation">Download .bib</button></div><p class="dialog-status" id="citation-status" role="status"></p>`);
    document.querySelector('#copy-citation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(bib);document.querySelector('#citation-status').textContent='Citation copied.';}catch{document.querySelector('#bibtex').select();document.querySelector('#citation-status').textContent='Text selected. Use your keyboard to copy.';}});
    document.querySelector('#download-citation').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([bib],{type:'application/x-bibtex'}));const a=document.createElement('a');a.href=url;a.download=`casino-sample-${p.id}.bib`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  }
});

function notFound(){content.innerHTML=heading('Page not found','The requested page is not available.')+'<div class="bottom-space"><a class="button secondary" href="#home">Return home</a></div>';}
function route(){
  if(dialog.open)dialog.close();
  const [path,query='']=location.hash.slice(1).split('?');
  const [page='home',id]= (path||'home').split('/');
  const routes={home,people,join};
  if(routes[page])routes[page]();else if(page==='research')research(id);else if(page==='publications')publications(new URLSearchParams(query));else if(page==='news')newsPage(id);else notFound();
  document.querySelectorAll('#navigation a').forEach(a=>{if(a.hash===`#${page}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.querySelector('#navigation').classList.remove('open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');
  document.title=`${content.querySelector('h1')?.textContent||'CASINO'} · CASINO Lab`;
  window.scrollTo(0,0);
}
document.querySelector('#menu-toggle').addEventListener('click',()=>{const open=document.querySelector('#navigation').classList.toggle('open');document.querySelector('#menu-toggle').setAttribute('aria-expanded',String(open));});
window.addEventListener('hashchange',()=>{route();content.focus({preventScroll:true});});
route();
