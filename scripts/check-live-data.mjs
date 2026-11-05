import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Member, Paper } from '../dist/models.js';

const root=resolve(import.meta.dirname,'..');
const raw=readFileSync(join(root,'dist/data/lab.json'),'utf8');
const data=JSON.parse(raw);
const collections=['people','researchAreas','publications','news','opportunities','assets'];
const ids=Object.fromEntries(collections.map(name=>[name,new Set(data[name].map(r=>r.id))]));
const unique=values=>assert.equal(new Set(values).size,values.length,'Duplicate identifiers');
const ref=(id,name)=>assert(id===null||ids[name].has(id),`Missing ${name}: ${id}`);
const refs=(values,name)=>{unique(values);values.forEach(id=>ref(id,name));};
for(const name of collections){
  unique(data[name].map(r=>r.id));
  for(const row of data[name]){
    if(name==='assets')continue;
    assert.equal(row.publishState,'published','Only public records may be shipped in the static JSON');
    assert.equal(row.isDemo,false,'Demo data must not ship');
    assert(Date.parse(row.publishedAt)<=Date.now(),'Scheduled records must not ship early');
    assert(row.sourceUrl?.startsWith('https://')||row.sourceUrl?.startsWith('http://'));
  }
}
assert.equal(data.people.length,12);assert.equal(data.publications.length,52);
assert.equal(data.people.filter(p=>p.memberships.some(m=>m.isCurrent)).length,10);
assert.equal(data.people.filter(p=>!p.memberships.some(m=>m.isCurrent)).length,2);
for(const person of data.people){
  ref(person.portraitAssetId,'assets');refs(person.researchAreaIds,'researchAreas');
  assert(person.memberships.length);for(const m of person.memberships)assert(!m.isCurrent||m.endedOn===null);
}
for(const paper of data.publications){
  assert(paper.pageUrl===`#publications/${paper.id}` || /^https?:\/\//.test(paper.pageUrl),'Paper requires an openable pageUrl');
  assert(paper.authors.length);refs(paper.researchAreaIds,'researchAreas');
  for(const a of paper.authors){assert(a.name.trim());ref(a.personId,'people');}
  assert.equal(paper.authors.filter(a=>a.personId==='pi').length,1);
  for(const k of ['thumbnailAssetId','pdfAssetId'])ref(paper[k],'assets');
  assert.equal(paper.publicationDate,null);assert.equal(paper.bibtex,null);assert.equal(paper.abstract,null);
}
for(const a of data.assets){
  assert(a.url.startsWith('./assets/'),'Expected a local asset path');
  assert(!a.url.includes('..'));assert(existsSync(join(root,'dist',a.url)),a.url);
}
ref(data.siteSettings.logoAssetId,'assets');refs(data.siteSettings.heroPhotoAssetIds,'assets');
ref(data.siteSettings.wordmarkAssetId,'assets');
assert.equal(data.siteSettings.heroPhotoAssetIds.length,4);
const papers=data.publications.map(record=>new Paper(record));
const member=new Member(data.people.find(person=>person.id==='yongqi-guan'));
assert.equal(member.getPapers(papers).length,6);
assert(member.getPapers(papers).every(paper=>paper instanceof Paper));
assert.equal(new Member({id:'no-papers'}).getPapers(papers).length,0);
refs(data.siteSettings.featuredPublicationIds,'publications');
assert.equal(data.people.find(p=>p.id==='yangxin-chen').publicEmail,null);
const checkDir=mkdtempSync(join(tmpdir(),'casino-typecheck-'));
writeFileSync(join(checkDir,'check.ts'),`import type { LabDataset } from ${JSON.stringify(join(root,'contracts/models.ts'))};\nconst data = ${raw.trim()} satisfies LabDataset;\n`);
execFileSync('npx',['--yes','--package','typescript','tsc','--noEmit','--strict','--target','es2022','--module','nodenext','--allowImportingTsExtensions',join(checkDir,'check.ts')],{stdio:'inherit'});
console.log('PASS: live JSON matches LabDataset; 52 publications, 12 people, public-only records, relationships and all local image paths.');
