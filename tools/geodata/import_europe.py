"""Resample pinned Mapzen Skadi HGT tiles to the game's local metric grids.
Downloads use system curl with TLS verification. Raw archives stay in ignored artifacts.
Run: python3 tools/geodata/import_europe.py
"""
from pathlib import Path
import array, gzip, hashlib, json, math, subprocess, sys
ROOT=Path(__file__).resolve().parents[2];CACHE=ROOT/'artifacts/europe-source';CACHE.mkdir(parents=True,exist_ok=True)
SOURCES={'N50E007':'b2d914aa292fa0b7e9ae2724261a903733f104e7e4626e7b7fe7dbe3ea61452d','N54W002':'4750963904204efa051ad5c4de34535df30610cd88758b35732de56cb6e5f063','N55W002':'d85071a97b4851263c4fe40eef548db02d986e07761fd7905ae9c4bf0652fce8'}
tiles={};provenance={}
for name,digest in SOURCES.items():
 url=f'https://s3.amazonaws.com/elevation-tiles-prod/skadi/{name[:3]}/{name}.hgt.gz';path=CACHE/(name+'.hgt.gz')
 if not path.exists():subprocess.run(['curl','--fail','--location',url,'--output',str(path)],check=True)
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,name+' source changed; review before updating hash'
 data=array.array('h',gzip.decompress(path.read_bytes()))
 if sys.byteorder=='little':data.byteswap()
 size=math.isqrt(len(data));assert size*size==len(data)
 tiles[name]=(data,size);provenance[name]={'url':url,'sha256':digest,'samplesPerSide':size}
def sample(lat,lon):
 sy=math.floor(lat);sx=math.floor(lon);name=f'N{sy:02d}'+('E' if sx>=0 else 'W')+f'{abs(sx):03d}';a,n=tiles[name];x=(lon-sx)*(n-1);y=(sy+1-lat)*(n-1);ix=min(n-2,int(x));iy=min(n-2,int(y));u=x-ix;v=y-iy
 vals=[a[iy*n+ix],a[iy*n+ix+1],a[(iy+1)*n+ix],a[(iy+1)*n+ix+1]]
 assert -32768 not in vals,(lat,lon,'DEM void; do not silently replace')
 return round(vals[0]*(1-u)*(1-v)+vals[1]*u*(1-v)+vals[2]*(1-u)*v+vals[3]*u*v)
for region,lat,lon,width,depth in [('rhine',50.30,7.40,32000,32000),('tyne',55.08,-1.75,32000,32000)]:
 cell=80;cols=width//cell+1;rows=depth//cell+1;latm=111132;lonm=111320*math.cos(math.radians(lat-depth/2/latm));used=['N50E007'] if region=='rhine' else ['N54W002','N55W002']
 heights=[sample(lat-z*cell/latm,lon+x*cell/lonm) for z in range(rows) for x in range(cols)]
 doc={'version':1,'region':region,'northLatitude':lat,'westLongitude':lon,'metresPerLatitudeDegree':latm,'metresPerLongitudeDegree':lonm,'cellM':cell,'columns':cols,'rows':rows,'datum':'WGS84 / EGM96','sourceFormat':'Mapzen Skadi, bilinear resampling, rounded to metre; no vertical exaggeration','sources':[provenance[s] for s in used],'heights':heights}
 (ROOT/f'src/content/geodata/{region}-dem.json').write_text(json.dumps(doc,separators=(',',':'))+'\n');print(region,min(heights),max(heights),len(heights))
