"""Download the four photos from the original homepage's CSS-backed carousel."""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import urlopen
import re


class CarouselImages(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        style = dict(attrs).get('style', '')
        if tag == 'div':
            match = re.search(r'background-image:\s*url\((https://[^)]+googleusercontent[^)]+)\)', style)
            if match and match[1] not in self.urls:
                self.urls.append(match[1])


parser = CarouselImages()
parser.feed(urlopen('https://crab.ye.wang/home', timeout=30).read().decode())
assert len(parser.urls) == 4, 'Review the carousel before importing a changed photo set.'
folder = Path(__file__).resolve().parent.parent / 'dist/assets/gallery'
folder.mkdir(parents=True, exist_ok=True)


def download(item):
    index, url = item
    data = urlopen(url, timeout=60).read()
    extension = '.jpg' if data.startswith(b'\xff\xd8') else '.png' if data.startswith(b'\x89PNG') else None
    assert extension, 'Unexpected image format'
    path = folder / f'group-{index:02d}{extension}'
    path.write_bytes(data)
    return str(path)


with ThreadPoolExecutor(max_workers=4) as pool:
    for path in pool.map(download, enumerate(parser.urls, 1)):
        print(path)
