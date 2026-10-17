"""Rebuild the hero WebP sequence. Requires: pip install imageio-ffmpeg"""
import json
import subprocess
from pathlib import Path
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'public/assets/silver-textile-hero-original.mp4'
output = ROOT / 'public/assets/hero-sequence'
variants = {}
for name, width in [('desktop', 1440), ('mobile', 864)]:
    folder = output / name
    folder.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y',
        '-i', str(source), '-vf', f'fps=24,scale={width}:-2', '-an',
        '-c:v', 'libwebp', '-quality', '76', '-compression_level', '4',
        '-start_number', '0', str(folder / 'frame-%04d.webp'),
    ], check=True)
    frames = sorted(folder.glob('frame-*.webp'))
    variants[name] = {'width': width, 'height': width * 9 // 16, 'count': len(frames), 'bytes': sum(f.stat().st_size for f in frames)}
    print(name, variants[name], flush=True)
manifest = {'fps': 24, 'frameCount': variants['desktop']['count'], 'variants': variants}
assert variants['mobile']['count'] == manifest['frameCount']
(output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Sequence ready', flush=True)
