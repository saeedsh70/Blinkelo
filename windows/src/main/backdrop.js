'use strict';
// Frosted-glass theme: the island is painted with a heavily blurred copy of the desktop wallpaper (like Mica).
// A transparent window cannot blur what is behind it, so the wallpaper is shrunk to a few pixels and scaled back
// up once here; the renderer only stretches the tiny result, which costs nothing per frame.
const fs = require('fs');
const path = require('path');

function wallpaperFile() {
  if (process.platform !== 'win32' || !process.env.APPDATA) return '';
  return path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Themes', 'TranscodedWallpaper');
}

class Backdrop {
  constructor(nativeImage, log) {
    this.nativeImage = nativeImage;
    this.log = log || (() => {});
    this.stamp = '';
    this.url = null;
  }

  // Returns true when the picture changed since the last call.
  refresh() {
    const file = wallpaperFile();
    let stamp = 'none';
    try { if (file) { const st = fs.statSync(file); stamp = `${st.mtimeMs}:${st.size}`; } } catch (_) { stamp = 'none'; }
    if (stamp === this.stamp) return false;
    this.stamp = stamp;
    let url = null;
    if (stamp !== 'none') {
      try {
        const img = this.nativeImage.createFromBuffer(fs.readFileSync(file));
        if (!img.isEmpty()) {
          const tiny = img.resize({ width: 28, quality: 'best' });
          const soft = tiny.resize({ width: 280, quality: 'best' });
          url = `data:image/jpeg;base64,${soft.toJPEG(82).toString('base64')}`;
        }
      } catch (e) { this.log('backdrop failed', e.message); }
    }
    const changed = url !== this.url;
    this.url = url;
    return changed;
  }
}

module.exports = { Backdrop, wallpaperFile };
