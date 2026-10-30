#!/usr/bin/env python3
"""Structural and quote integrity checks; runs offline with no dependencies."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
chapters=json.loads((ROOT/'src/data/chapters.json').read_text())
assert len(chapters)==97
assert len({c['id'] for c in chapters})==97
assert [c['order'] for c in chapters]==list(range(97))
assert [sum(c['book']==b for c in chapters) for b in range(1,14)]==[5,8,11,7,7,3,4,8,9,7,10,14,3]
texts={}
for c in chapters:
    paragraphs=json.loads((ROOT/f"public/text/chapters/{c['id']}.json").read_text())['paragraphs']
    assert paragraphs and all(isinstance(p,str) and p.strip() for p in paragraphs), c['id']
    text='\n\n'.join(paragraphs)
    assert len(text)>3000,c['id']
    assert not any(s in text for s in ('poems.push','window.','function(', '©1996', '<iframe')),c['id']
    texts[c['id']]=text
search=json.loads((ROOT/'public/text/search.json').read_text())
assert len(search)==97
assert all(x['text']==texts[x['id']] for x in search)
quotes=json.loads((ROOT/'src/data/quotes.json').read_text())
assert len(quotes)>=12
for q in quotes:
    assert q['text'] in texts[q['chapterId']], q
assert texts['13-3'].split('\n\n')[-1].endswith('и еще раз все мальчики подхватили его восклицание.')
print(f"PASS: 12 books + epilogue; 96 chapters + preface; {len(quotes)} exact quotes; search corpus matches chapter corpus.")
