'use strict';
// Project links shown in the app (settings, tray). CommonJS so main + esbuild bundles can use it.
const REPO = 'https://github.com/saeedsh70/Blinkelo';
module.exports = {
  REPO,
  DONATE: `${REPO}/blob/main/DONATE.md`,
  ISSUES: `${REPO}/issues/new/choose`,
  RELEASES: `${REPO}/releases/latest`,
};
