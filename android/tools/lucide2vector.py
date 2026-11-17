#!/usr/bin/env python3
"""Converts lucide SVG icons (24x24, stroke 2) to Android vector drawables."""
import re, sys, os
from xml.etree import ElementTree as ET

def num(v, d=0.0):
    try: return float(v)
    except Exception: return d

def circle_path(cx, cy, r):
    return f"M{cx-r},{cy}a{r},{r} 0 1,0 {2*r},0a{r},{r} 0 1,0 {-2*r},0"

def ellipse_path(cx, cy, rx, ry):
    return f"M{cx-rx},{cy}a{rx},{ry} 0 1,0 {2*rx},0a{rx},{ry} 0 1,0 {-2*rx},0"

def rect_path(x, y, w, h, rx, ry):
    if rx <= 0 and ry <= 0:
        return f"M{x},{y}h{w}v{h}h{-w}z"
    rx = rx or ry; ry = ry or rx
    rx = min(rx, w / 2); ry = min(ry, h / 2)
    return (f"M{x+rx},{y}h{w-2*rx}a{rx},{ry} 0 0 1 {rx},{ry}v{h-2*ry}a{rx},{ry} 0 0 1 {-rx},{ry}"
            f"h{-(w-2*rx)}a{rx},{ry} 0 0 1 {-rx},{-ry}v{-(h-2*ry)}a{rx},{ry} 0 0 1 {rx},{-ry}z")

def convert(svg_text, color="#FFFFFFFF", size=24):
    root = ET.fromstring(svg_text)
    paths = []
    for el in root.iter():
        tag = el.tag.split('}')[-1]
        a = el.attrib
        if tag == 'path': d = a.get('d')
        elif tag == 'circle': d = circle_path(num(a.get('cx')), num(a.get('cy')), num(a.get('r')))
        elif tag == 'ellipse': d = ellipse_path(num(a.get('cx')), num(a.get('cy')), num(a.get('rx')), num(a.get('ry')))
        elif tag == 'rect': d = rect_path(num(a.get('x')), num(a.get('y')), num(a.get('width')), num(a.get('height')), num(a.get('rx')), num(a.get('ry')))
        elif tag == 'line': d = f"M{a.get('x1')},{a.get('y1')}L{a.get('x2')},{a.get('y2')}"
        elif tag == 'polyline': d = 'M' + ' L'.join(a.get('points').split())
        elif tag == 'polygon': d = 'M' + ' L'.join(a.get('points').split()) + 'z'
        else: continue
        if d: paths.append(d)
    body = "\n".join(
        f'    <path android:pathData="{d}" android:strokeColor="{color}" android:strokeWidth="2" '
        f'android:strokeLineCap="round" android:strokeLineJoin="round" android:fillColor="#00000000"/>' for d in paths)
    return (f'<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="{size}dp" android:height="{size}dp" '
            f'android:viewportWidth="24" android:viewportHeight="24">\n{body}\n</vector>\n')

if __name__ == '__main__':
    src, out_dir = sys.argv[1], sys.argv[2]
    for spec in sys.argv[3:]:
        name, icon = spec.split('=')
        with open(os.path.join(src, icon + '.svg')) as f:
            xml = convert(f.read())
        with open(os.path.join(out_dir, name + '.xml'), 'w') as f:
            f.write(xml)
        print('wrote', name)
