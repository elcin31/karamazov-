#!/usr/bin/env python3
"""Import the explicitly curated lawful archive; no runtime dependency on Commons.
Requires Pillow. Source metadata is retained in docs/archive-provenance-v2.json.
Use --refresh to ask Commons for current metadata; otherwise reuse the audited snapshot.
"""
import argparse, hashlib, io, json, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path
from PIL import Image, ImageOps
ROOT=Path(__file__).resolve().parents[1]
UA='KaramazovMuseum/2.0 (https://github.com/elcin31/karamazov-; attribution and license verification)'

def fetch(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=75) as r:return r.read()
        except urllib.error.HTTPError as error:
            if error.code == 429:
                raise RuntimeError(f'Commons requests a pause: Retry-After={error.headers.get("Retry-After", "unspecified")}s') from error
            if attempt==3:raise
            time.sleep(3*(attempt+1))
        except Exception:
            if attempt==3:raise
            time.sleep(3*(attempt+1))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--refresh',action='store_true');parser.add_argument('--local-only',action='store_true');args=parser.parse_args()
    selected=json.loads((ROOT/'scripts/archive-selection.json').read_text())
    provenance_path=ROOT/'docs/archive-provenance-v2.json'
    provenance=json.loads(provenance_path.read_text())
    existing=json.loads((ROOT/'src/data/images.json').read_text())
    output=[];failed=[];directory=ROOT/'public/images/archive';directory.mkdir(parents=True,exist_ok=True)
    for n,record in enumerate(selected,1):
        ident=record['id'];page=provenance.get(ident)
        if args.refresh:
            params={'action':'query','format':'json','titles':record['file'],'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':1400}
            pages=json.loads(fetch('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))['query']['pages'];page=next(iter(pages.values()));provenance[ident]=page;time.sleep(1)
        info=page['imageinfo'][0];license_name=info['extmetadata'].get('LicenseShortName',{}).get('value','')
        assert license_name in {'Public domain','CC0','CC BY-SA 4.0','CC BY-SA 3.0','CC BY 4.0','CC BY 3.0','CC BY 2.5 au','FAL'},f'{ident}: unsupported license {license_name}'
        file=directory/(ident+'.webp')
        if not file.exists():
            if args.local_only: continue
            source=(info.get('thumburl') or info['url']) if record['file'].lower().endswith(('.pdf','.djvu')) else info['url'];source=source.split('?')[0]
            if record.get('pageNumber'):source=source.replace('/page1-',f"/page{record['pageNumber']}-")
            try: raw=fetch(source)
            except Exception as error:
                failed.append({'id':ident,'error':str(error)});print('DEFERRED',ident,str(error),flush=True)
                if 'Retry-After' in str(error): break
                continue
            image=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
            # Never enlarge a source, including archival scans with low native resolution.
            image.thumbnail((min(1600,info['width']),min(1600,info['height'])),Image.Resampling.LANCZOS)
            image.save(file,'WEBP',quality=86,method=6)
            print(f'{n}/{len(selected)} {ident} {image.width}x{image.height}',flush=True);time.sleep(12)
        image=Image.open(file);item={k:v for k,v in record.items() if k!='file'}
        item.update(src=f'/images/archive/{ident}.webp',width=image.width,height=image.height)
        item['description']+=' Веб-копия: пропорциональное уменьшение (если необходимо), преобразование в WebP; без ретуши и изменения цвета.'
        if license_name!='Public domain':item['description']+=f' Производная веб-копия распространяется на условиях {license_name}; указаны автор и исходная карточка.'
        item['sourceWidth']=info['width'];item['sourceHeight']=info['height'];item['fileSha256']=hashlib.sha256(file.read_bytes()).hexdigest()
        output.append(item)
    ids={i['id'] for i in output};existing=json.loads((ROOT/'src/data/images.json').read_text())
    catalog=[i for i in existing if i['id'] not in ids]+output
    (ROOT/'src/data/images.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    provenance_path.write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')
    print(f'Imported {len(output)} distinct archive records; {len(catalog)} total catalog records. Deferred: {failed}')
    if failed: raise SystemExit(1)
if __name__=='__main__':main()
