import { Member, Paper } from './models.js';

const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
export const pdfPath = value => typeof value === 'string' && /^\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*\.pdf$/i.test(value) ? value : '';

async function read(path, missingAllowed = false) {
  const response = await fetch('/api/' + path, {
    cache: 'no-store', credentials: 'omit', headers: {Accept: 'application/json'},
    signal: AbortSignal.timeout(15000),
  });
  if (missingAllowed && response.status === 404) return null;
  if (!response.ok || !response.headers.get('content-type')?.startsWith('application/json')) {
    throw new Error('Invalid content response: HTTP ' + response.status);
  }
  return response.json();
}

export function readPage(page, id) {
  if (page === 'home' || page === 'news') return read('home');
  if (page === 'member') return id ? (idPattern.test(id) ? read('people/' + encodeURIComponent(id), true) : null) : read('people');
  if (page === 'publications') return read('publications');
}

const paper = row => new Paper({
  ...row, pageUrl: '#publications/' + encodeURIComponent(row.id),
  researchAreaIds: [], pdfUrl: pdfPath(row.pdfPath),
});

export function pageData(base, page, id, payload) {
  const assets = [...base.assets];
  const person = row => {
    const state = row.memberships.some(role => role.isCurrent) ? 'member' : 'alumni';
    const portraitAssetId = row.portrait ? 'api:portrait:' + row.id : null;
    if (row.portrait) assets.push({...row.portrait.metadata, id: portraitAssetId, url: row.portrait.url});
    const englishName = row.englishName?.trim();
    return new Member({...row, state, portraitAssetId,
      name: englishName && !row.name.toLowerCase().includes(englishName.toLowerCase()) ? row.name + ' (' + englishName + ')' : row.name,
      interests: row.interests ?? [], links: row.links ?? [],
    });
  };
  const data = {...base, assets, people: [], publications: []};
  if (page === 'home' || page === 'news') {
    const photos = payload.assets.map(photo => ({...photo.metadata, url: photo.url, id: 'api:group:' + photo.id}));
    assets.push(...photos);
    data.siteSettings = {...base.siteSettings, heroPhotoAssetIds: photos.map(photo => photo.id)};
    data.recentPublications = payload.recentPublications.map(paper);
    data.publicationCount = payload.counts.publications;
  } else if (page === 'member' && id) {
    if (payload) {
      data.people = [person(payload.person)];
      data.publications = payload.publications.map(paper);
    }
  } else if (page === 'member') {
    data.people = payload.map(person);
  } else if (page === 'publications') {
    data.publications = payload.map(paper);
  }
  return data;
}
