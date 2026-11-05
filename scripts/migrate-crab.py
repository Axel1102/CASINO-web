"""Import the public CRAB site into the CASINO contract. Run with beautifulsoup4.

Keeps source order and author spelling; downloads portraits to local asset paths.
Source HTML is cached outside the checkout for an auditable, repeatable import.
"""
import json
import re
import shutil
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path('/tmp/casino-crab-import-20261104')
CACHE.mkdir(exist_ok=True)
BASE = 'https://crab.ye.wang'
NOW = datetime.now(timezone.utc).isoformat(timespec='seconds')


def clean(value):
    return re.sub(r'\s+', ' ', value).strip()


def text(element):
    return clean(element.get_text('', strip=False))


def page(path):
    url = urljoin(BASE, path)
    cache = CACHE / (urlparse(url).netloc + urlparse(url).path.replace('/', '_') + '.html')
    if not cache.exists():
        cache.write_bytes(urlopen(url, timeout=45).read())
    return BeautifulSoup(cache.read_bytes(), 'html.parser')


def base(id, source):
    return dict(id=id, slug=id, publishState='published', isDemo=False, createdAt=NOW,
                updatedAt=NOW, publishedAt=NOW, sourceUrl=source)


areas = [
    dict(**base('security', BASE+'/home'), title='Information security',
         summary='Usable security and privacy, digital safety, blockchains, and financial security.',
         bodyMarkdown='We work on usable security and privacy, digital safety, blockchains, and financial security.',
         questions=[], tags=['Usable security and privacy', 'Digital safety', 'Blockchains', 'Financial security'], coverAssetId=None, sortOrder=1),
    dict(**base('hci', BASE+'/home'), title='Human–computer interaction',
         summary='Digital economy, human–AI interaction, education and learning, and HCI4D.',
         bodyMarkdown='Our human–computer interaction research spans the digital economy, human–AI interaction, education and learning, and HCI4D.',
         questions=[], tags=['Digital economy', 'Human–AI interaction', 'Education and learning', 'HCI4D'], coverAssetId=None, sortOrder=2),
]
assets = [
    dict(id='logo', url='./assets/casino-logo.svg', mimeType='image/svg+xml', alt='CASINO Lab', caption=None, credit='CASINO Lab', width=1200, height=1018),
    dict(id='symbol', url='./assets/casino-symbol.svg', mimeType='image/svg+xml', alt='CASINO emblem', caption=None, credit='CASINO Lab', width=None, height=None),
    dict(id='group', url='./assets/group-photo.png', mimeType='image/png', alt='CASINO lab members gathered for a group photograph', caption='Our group · University of Macau', credit='CASINO Lab', width=1177, height=662),
]
members = []
directory = page('/members')
profile_sources = []
canonical = {
    'yangxin-chen': 'Yangxin CHEN', 'yongqi-guan': 'Maggie Yongqi GUAN',
    'ben': 'Chon Kit LAO, Ben', 'wanyi-liu': 'Alicia Wanyi LIU', 'sinong-lu': 'Nora Sinong LU',
    'junjie-qing': 'Maury Junjie QING', 'jianing-si': 'Janice Jianing SI',
    'chunlin-wang': 'Green Chunlin WANG', 'siyu-wang': 'Rainie Siyu WANG',
    'zhuangtonghuang': 'Molly Zhuangtong HUANG', 'jinchen-yu': 'Brian Jincheng YU', 'pi': 'Kanye Ye WANG',
}
alumni = False
for section in directory.select('section'):
    if 'CRAB Alumni' in text(section):
        alumni = True
    links = [a for a in section.select('a[href]') if a['href'].startswith('/members/') or 'www.ye.wang' in a['href']]
    images = section.select('img')
    if not links:
        continue
    assert len(links) == len(images), 'Member/photo pairing changed; review source before importing'
    for a, image in zip(links, images):
        id = 'pi' if 'www.ye.wang' in a['href'] else a['href'].split('/')[-1]
        profile_sources.append((id, urljoin(BASE, a['href']), image['src'], alumni))


def import_person(record):
    id, url, image_url, former = record
    doc = page(url)
    sections = doc.select('section')
    profile = next((s for s in sections if 'Research Interests' in text(s) or 'E-mail:' in text(s)), None)
    paragraphs = [text(p) for p in profile.select('p')] if profile else []
    interests = [text(li) for li in profile.select('li')] if profile else []
    if not interests and 'Research Interests' in paragraphs:
        interests = paragraphs[paragraphs.index('Research Interests')+1:]
    email = next((re.sub(r'\s', '', p.split(':', 1)[1]) for p in paragraphs if p.startswith('E-mail:')), None)
    # This profile's visible address and mailto target disagree. Await confirmation.
    if id == 'yangxin-chen':
        email = None
    if id == 'pi':
        email = 'yewang.ethz@gmail.com'
        interests = ['Information security', 'Human–computer interaction', 'Finance']
        bio = 'Assistant Professor in Computer Science and Finance at the University of Macau. Principal investigator of CASINO Lab, formerly Cyber and Crypto Lab (CRAB).\n\nDr. sc., ETH Zurich (2022), supervised by Prof. Roger Wattenhofer. MSc, ETH Zurich; BSc, Peking University.'
    else:
        bio = ('PhD alumnus · October 2026.' if id == 'zhuangtonghuang' else 'MSc alumnus · June 2025.' if former else 'PhD student at the University of Macau.')
    if id == 'ben':
        bio += '\n\nChinese name: 劉俊傑. Also known as Ben.'
    if id == 'zhuangtonghuang':
        bio += '\n\nAdditional work listed on the original profile:\nSafeguarding the Unseen: a Study on Data Privacy in DeFi Protocols\nZhuangtong Huang, Jiawei Zhu, Zhongyu Huang, Yixin Xu, Jerome Yen and Ye Wang\nBlockchain (year not specified).'
    links = [{'label':'Original profile', 'url':url}]
    if profile:
        for a in profile.select('a[href]'):
            if a['href'].startswith(('http://','https://')):
                links.append({'label':'Personal website', 'url':a['href']})
    photo_path = ROOT/'dist/assets/people'/f'{id}.jpg'
    photo_path.parent.mkdir(parents=True, exist_ok=True)
    # Save exact downloaded bytes, using the response's real image extension.
    cached = CACHE / f'{id}.portrait'
    if not cached.exists():
        cached.write_bytes(urlopen(image_url, timeout=45).read())
    data = cached.read_bytes()
    if data.startswith(b'\x89PNG'):
        extension, mime = '.png', 'image/png'
    elif data.startswith(b'\xff\xd8'):
        extension, mime = '.jpg', 'image/jpeg'
    elif data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        extension, mime = '.webp', 'image/webp'
    else:
        raise ValueError(f'Unsupported portrait response for {id}')
    photo_path = photo_path.with_suffix(extension)
    photo_path.write_bytes(data)
    asset = dict(id='portrait-'+id, url='./assets/people/'+photo_path.name, mimeType=mime,
                 alt=canonical[id], caption=None, credit='CRAB member directory', width=None, height=None)
    roles = 'faculty' if id == 'pi' else 'masters_student' if id == 'jinchen-yu' else 'phd_student'
    research = []
    if any(re.search(r'security|privacy|ethereum|web3|ebpf', interest, re.I) for interest in interests): research.append('security')
    if any(re.search(r'hci|programming|metaverse|human|tourism|ubiquitous|physical ai|generative ai', interest, re.I) for interest in interests): research.append('hci')
    if id == 'pi': research = ['security','hci']
    person = dict(**base(id, url), name=canonical[id], preferredName='Ben' if id=='ben' else None,
                  title='Assistant Professor' if id=='pi' else 'MSc alumnus' if id=='jinchen-yu' else 'PhD alumnus' if former else 'PhD Student',
                  affiliation='University of Macau', portraitAssetId=asset['id'], bioMarkdown=bio, researchAreaIds=research,
                  interests=interests, memberships=[dict(role=roles,isCurrent=not former,startedOn=None,endedOn=None)],
                  alumniDestination=None, publicEmail=email, links=links, sortOrder=0 if id=='pi' else list(canonical).index(id)+1)
    return person, asset


with ThreadPoolExecutor(max_workers=5) as pool:
    for person, asset in pool.map(import_person, profile_sources):
        members.append(person)
        assets.append(asset)
members.sort(key=lambda p:p['sortOrder'])
aliases = {p['name'].lower():p['id'] for p in members}
aliases.update({'ye wang':'pi','kanye ye wang':'pi','chon kit lao':'ben', 'janice janing si':'jianing-si', 'zhuangtong huang':'zhuangtonghuang'})

publications = []
year = None
for section in page('/publications').select('section'):
    lines = [text(p) for p in section.select('p') if text(p)]
    if not lines: continue
    if re.fullmatch(r'20\d{2}', lines[0]):
        year = int(lines[0]); continue
    if len(lines) < 3 or year is None or lines[0] == 'Before 2023': continue
    title, author_line, *venues = lines
    authors = [clean(n) for n in re.split(r',\s*|\s+and\s+', author_line) if clean(n)]
    venue = ' / '.join(venues)
    type = 'journal' if re.search(r'Transactions|Journal|Annals|Tourism Management|Theoretical Computer Science \(TCS|AEA Papers|IMWUT',venue) else 'workshop' if 'Workshop' in venue else 'conference'
    short = re.findall(r'\(([^()]+)\)', venue)
    id = re.sub('[^a-z0-9]+','-',title.lower()).strip('-')
    publications.append(dict(**base(id, BASE+'/publications'), title=title, pageUrl='#publications/'+id,
        authors=[dict(personId=aliases.get(n.lower()),name=n,affiliation=None,isCorresponding=None,equalContribution=None) for n in authors],
        year=year, publicationDate=None, type=type, publicationStatus=None,
        venue=dict(name=venue,shortName=short[0] if short else None),abstract=None,researchAreaIds=[],keywords=[],
        thumbnailAssetId=None,doi=None,pdfAssetId=None,pdfUrl=None,projectUrl=None,codeUrl=None,videoUrl=None,
        volume=None,issue=None,pages=None,awards=[],bibtex=None,featured=False))
assert len(publications)==52, f'Unexpected publication count: {len(publications)}'
# The source has no per-paper topic taxonomy. Keep assignments empty for lab review.
page('/info')  # Preserve the checked recruitment source alongside the other HTML.
opportunities = []
for id,title,summary,body,requirements in [
    ('um-students','University of Macau students','RA experience before PhD admission.',
     'Students interested in pursuing a PhD with the principal investigator are required to first apply for a Research Assistant position.\n\nA minimum of one year of research collaboration, such as RA work and thesis supervision, is required before formal PhD admission.\n\nSend your application materials directly by email.',
     ['An A grade in at least one course taught by the principal investigator, or an overall UM GPA of at least 3.7.','Strong commitment and dedication to research.']),
    ('external-students','Applicants from other institutions','Direct PhD admission through an advisor recommendation.',
     'External candidates are not recruited for RA positions. In principle, external PhD applicants are not accepted; exceptions may be considered when recommended by their advisor.\n\nA short-term collaborative research project may be required to assess compatibility with the group.',
     ['Recommendation from your advisor.','Strong research potential and commitment.'])]:
    opportunities.append(dict(**base(id,BASE+'/info'),title=title,kind='phd',availability='open',summary=summary,bodyMarkdown=body,
        requirements=requirements,applicationChecklist=['CV','UM transcript'] if id=='um-students' else ['CV','Academic transcript','Research interests and proposed collaboration'],
        deadlineAt=None,contactEmail='yewang.ethz@gmail.com',applicationUrl=None,guidanceUrl=BASE+'/info',researchAreaIds=['security','hci'],sortOrder=len(opportunities)))
recruitment = 'Application timeline\nFall intake: apply by mid-March. Spring intake: apply by the end of July of the previous year. Confirm the current university deadlines before applying. Contact the principal investigator before applying through the university system.\n\nProgram structure\nExpected duration: four years, including a qualifying exam at the end of the first year.\n\nFunding\nThe lab’s published guidance lists a monthly stipend of MOP 12,500–20,000. Each advisor may nominate one student per year for the MOP 20,000 scholarship; the guidance reports that fewer than 5% receive this top-tier scholarship. Check the current call for eligibility and funding details.'
dataset = dict(schemaVersion='1.0',assets=assets,people=members,researchAreas=areas,publications=publications,news=[],opportunities=opportunities,
    siteSettings=dict(name='CASINO Lab',fullName='Collaborative Security and Interaction Group',institution='University of Macau',
        introduction='Research in information security, human–computer interaction, and the intersection of computing and society.',
        aboutMarkdown='CASINO Lab, formerly Cyber and Crypto Lab (CRAB), is headed by Kanye Ye Wang at the University of Macau.\n\nDepartment of Computer and Information Science\nDepartment of Finance and Business Economics\n\nIn 2025, the group achieved the top-four security “grand slam”. We welcome interdisciplinary collaborations.',
        recruitmentMarkdown=recruitment,publicationArchiveUrl='https://disco.ethz.ch/members/wangye/',logoAssetId='symbol',darkLogoAssetId=None,
        heroPhotoAssetIds=['group'],publicEmail='yewang.ethz@gmail.com',address='University of Macau',
        links=[dict(label='Original lab website',url=BASE+'/home'),dict(label='Principal investigator',url='https://www.ye.wang/')],
        featuredPublicationIds=[],updatedAt=NOW))
archive_link=next(a['href'] for a in page('/publications').select('a[href]') if text(a)=='old website')
dataset['siteSettings']['publicationArchiveUrl']=archive_link
out=ROOT/'dist/data/lab.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(dataset,ensure_ascii=False,indent=2)+'\n')
for name in ['casino-logo.svg','casino-symbol.svg']:
    shutil.copyfile(ROOT/'deliverables/logo'/name,ROOT/'dist/assets'/name)
print(json.dumps(dict(people=len(members),current=sum(any(m['isCurrent'] for m in p['memberships']) for p in members),publications=len(publications),portraits=len(profile_sources),output=str(out))))
