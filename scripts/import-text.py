#!/usr/bin/env python3
"""Import only Dostoevsky's public-domain novel, not the source site's design.
Run from this repository: python3 scripts/import-text.py
Python standard library only; source is Windows-1251. Network required on import only.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
import json, re, time

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://ilibrary.ru'
INDEX = BASE + '/text/1199/index.html'
EDITION = 'Ф. М. Достоевский. Собрание сочинений в 15-ти томах. Л.: Наука, 1991. Т. 9–10.'


def fetch(url):
    for attempt in range(5):
        try:
            req = Request(url, headers={'User-Agent': 'KaramazovDigitalMuseum/1.0 (public-domain text import)'})
            with urlopen(req, timeout=60) as response:
                raw = response.read()
            return raw, raw.decode('windows-1251')
        except Exception:
            if attempt == 4: raise
            time.sleep(1 + attempt)


def plain(value):
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]*>', '', value))).strip()


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paragraphs = []
        self.buffer = []
        self.ignore = 0
        self.fnn = 0

    def flush(self):
        # Preserve poetry line breaks; normalize layout whitespace only.
        value = ''.join(self.buffer)
        value = '\n'.join(re.sub(r'[\t\r \xa0]+', ' ', line).strip() for line in value.split('\n'))
        value = re.sub(r'\n{3,}', '\n\n', value).strip()
        if value: self.paragraphs.append(value)
        self.buffer = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.ignore += 1
        if self.ignore: return
        if tag == 'fnn': self.fnn += 1
        if tag in ('z', 'h5', 'h6'): self.flush()
        if tag in ('br', 'v'): self.buffer.append('\n')
        if tag == 'fnn': self.buffer.append('[')

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.ignore = max(0, self.ignore - 1)
            return
        if self.ignore: return
        if tag == 'fnn':
            self.buffer.append(']')
            self.fnn = max(0, self.fnn - 1)
        if tag in ('z', 'h5', 'h6'): self.flush()

    def handle_data(self, value):
        if not self.ignore:
            # Source indentation is not an authorial line break.
            self.buffer.append(re.sub(r'\s+', ' ', value))


def extract(source, preface=False):
    content = source.split('<div id="text"', 1)[1].split('<iframe id="tocFrame"', 1)[0]
    # End of the site's title navigation. Only the first header block is removed.
    content = content.split('</div>', 1)[1]
    if preface:
        content = content[content.find('<br clear=all>'):]
        content = re.sub(r'<div class="title">.*?</div>', '', content, flags=re.S)
        content = re.sub(r'<h1>.*?</h1>', '', content, flags=re.S)
        content = re.sub(r'<div class="subtitle">.*?</div>', '', content, flags=re.S)
        content = re.sub(r'<h5><i>От автора</i></h5>', '', content)
    else:
        # h2/h3 are part/book headers; h4 is the chapter header, already in manifest.
        content = content.split('</h4>', 1)[1]
    parser = TextParser()
    parser.feed(content)
    parser.flush()
    assert parser.paragraphs, 'No chapter paragraphs found'
    return parser.paragraphs


def manifest(index):
    records, part, book, book_title, chapter = [], 0, 0, 'От автора', 0
    toc = index.split('<div class="toc"', 1)[1].split('</table>', 1)[0]
    for row in re.findall(r'<tr\b.*?</tr>', toc, flags=re.S):
        m = re.search(r'<a href="(/text/1199/p\.(\d+)/index.html)"[^>]*>(.*?)</a>', row, re.S)
        if not m: continue
        title = plain(m[3])
        if title.startswith('Часть '):
            part += 1
            continue
        if title.startswith('Книга '):
            book += 1
            book_title = title.split('. ', 1)[1]
            chapter = 0
            continue
        if title == 'Эпилог':
            book, book_title, chapter = 13, 'Эпилог', 0
            continue
        if title == 'От автора':
            record_id, ch_title = 'preface', title
        else:
            chapter += 1
            record_id = f'{book}-{chapter}'
            ch_title = title.split('. ', 1)[1]
        records.append(dict(id=record_id, order=len(records), part=part, book=book,
                            bookTitle=book_title, chapter=chapter, title=ch_title,
                            sourceUrl=BASE + m[1]))
    assert len(records) == 97, f'Expected preface + 96 chapters, found {len(records)}'
    assert [sum(r['book'] == i for r in records) for i in range(1, 14)] == [5,8,11,7,7,3,4,8,9,7,10,14,3]
    return records


def main():
    index_raw, index = fetch(INDEX)
    chapters = manifest(index)
    (ROOT / 'src/data').mkdir(parents=True, exist_ok=True)
    (ROOT / 'public/text/chapters').mkdir(parents=True, exist_ok=True)
    (ROOT / 'src/data/chapters.json').write_text(json.dumps(chapters, ensure_ascii=False, indent=2) + '\n')
    hashes = []
    search = []
    def import_chapter(record):
        raw, source = fetch(record['sourceUrl'])
        paragraphs = extract(source, record['id'] == 'preface')
        return record, paragraphs, sha256(raw).hexdigest()
    with ThreadPoolExecutor(max_workers=4) as executor:
        for record, paragraphs, digest in executor.map(import_chapter, chapters):
            target = ROOT / 'public/text/chapters' / (record['id'] + '.json')
            target.write_text(json.dumps({'paragraphs': paragraphs}, ensure_ascii=False, indent=2) + '\n')
            search.append({k:record[k] for k in ('id','title','book','order')} | {'text':'\n\n'.join(paragraphs)})
            hashes.append({'id':record['id'], 'sourceUrl':record['sourceUrl'], 'sha256':digest,
                           'paragraphs':len(paragraphs), 'characters':sum(map(len,paragraphs))})
            print(record['id'], len(paragraphs), sum(map(len,paragraphs)), flush=True)
    (ROOT / 'public/text/search.json').write_text(json.dumps(search, ensure_ascii=False, separators=(',',':')) + '\n')
    provenance = dict(importedAt=str(date.today()), edition=EDITION, indexUrl=INDEX,
                      indexSha256=sha256(index_raw).hexdigest(), chapterCount=96, preface=True,
                      sourcePages=hashes)
    (ROOT / 'public/text/provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print('COMPLETE:',len(search),'sections;',sum(x['characters'] for x in hashes),'characters')

if __name__ == '__main__': main()
