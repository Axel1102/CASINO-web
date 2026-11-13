const {test} = require('node:test');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const api = import(pathToFileURL(path.resolve(__dirname, '../../dist/api.js')));

test('each content page uses only its own public endpoint', async t => {
  const {readPage} = await api;
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (target, options) => {
    calls.push(target);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-store');
    return {ok: true, headers: new Headers({'content-type': 'application/json'}), json: async () => []};
  });
  for (const [page, id] of [['home'], ['news'], ['member'], ['member','p1'], ['publications']]) await readPage(page,id);
  assert.equal(readPage('contact'), undefined);
  assert.equal(readPage('member', '../invalid'), null);
  assert.deepEqual(calls, ['/api/home','/api/home','/api/people','/api/people/p1','/api/publications']);
});

test('a proxy or non-JSON error does not fall back to the snapshot', async t => {
  const {readPage} = await api;
  for(const response of [{ok: false,status: 503}, {ok: true,status: 200,headers: new Headers({'content-type':'text/html'})}]){
    const mocked=t.mock.method(globalThis,'fetch',async()=>response);
    await assert.rejects(readPage('home'));
    assert.equal(mocked.mock.callCount(),1);
    mocked.mock.restore();
  }
});

test('page data uses API assets, explicit author IDs and month-precision alumni dates', async () => {
  const {pageData,pdfPath} = await api;
  const base={assets:[],siteSettings:{}};
  const home=pageData(base,'home',null,{assets:[{id:'a',url:'/assets/合照.jpg',metadata:{alt:'Group'}}],
    counts:{publications:52},recentPublications:[{id:'PAPER_1',title:'Paper'}]});
  assert.deepEqual(home.siteSettings.heroPhotoAssetIds,['api:group:a']);
  assert.equal(home.assets[0].alt,'Group');
  assert.equal(home.publicationCount,52);
  assert.equal(home.recentPublications[0].pageUrl,'#publications/PAPER_1');
  const detail=pageData(base,'member','p1',{
    person:{id:'p1',name:'Chon Kit LAO',englishName:'Ben',memberships:[{isCurrent:false}],alumniSince:'2026-10'},
    publications:[{id:'new',year:2020,authors:[{personId:'p1',name:'Exact signature'}],pdfPath:'/assets/papers/a.pdf'}, {id:'old',year:2026}],
  });
  assert.equal(detail.people[0].name,'Chon Kit LAO (Ben)');
  assert.equal(detail.people[0].state,'alumni');
  assert.equal(detail.people[0].alumniSince,'2026-10');
  assert.deepEqual(detail.publications.map(p=>p.id),['new','old']);
  assert.equal(detail.publications[0].authors[0].name,'Exact signature');
  assert.equal(detail.publications[0].pdfUrl,'/assets/papers/a.pdf');
  for (const value of [null,'//evil/a.pdf','https://evil/a.pdf','/assets/../a.pdf','/assets/%2e%2e/a.pdf','/assets/a.pdf?x=1']) assert.equal(pdfPath(value),'');
});
