# UI regression verification

## Current run — 2026-11-10

- All four Touchpad tests pass.
- Rebuilt packaged assets: 16 routes × every supported language at 412 × 915 mobile/touch emulation; no horizontal overflow, correct direction and zero unnamed buttons in these rendered routes.
- Native-bridge mock: five checks pass for naming/binding power confirmation to its original computer, retaining camera requester ID and clearing old apps/media after disconnect. No console errors/warnings during this scenario.
- Browser evidence: implementation-2026-11-10/android-ui-final.json and android-peer-ui-final.json.
- Android WebView/TalkBack, IME, insets, permissions, content URIs and actual camera remain device checks.

## Historical run — 2026-11-08

## Automated gesture tests

Command: `node --test verification/ui/touchpad.test.mjs`

All four tests passed:

- Cancelled touch never clicks the PC.
- Cancelled drag releases the held button, including cancellation with another remaining touch.
- Destroying the touchpad removes its global mouse handler and element handlers.
- Normal one-, two-, and three-finger taps retain their expected mouse buttons.

## Browser checks of the actual bundled assets

Chrome isolated context; mobile/touch viewport 412 × 915, scale 2.625; native mock, without a physical Android device.

- Reproduced the original app-search defect before rebuilding: searching Chrome, leaving and returning to Apps, then clearing search left only one app. After the fix all eight mock apps return.
- Checked 16 routes in each of every supported language (112 route/language combinations). Expected RTL/LTR direction and no horizontal page overflow passed. No console errors or warnings during these checks.
- Disconnecting and reconnecting while on the Remote page recreates a working touchpad; cancelling its gesture clears its active state.
- Malformed album-art URLs, application icon URLs, and device names do not create HTML handlers or elements. CSP also blocked the deliberately invalid test images.

## Scope limits

Browser checks use simulated devices and packet events. Clipboard access, document opening/sharing, camera, Android keyboard/IME behavior, system insets, and native bridge lifecycle changes still require Android device/emulator verification. Android compilation/lint are handled separately in the project validation report.

The bundled JavaScript was rebuilt from `ui/src/app.js` using esbuild 0.25.12, target Chrome 80, IIFE format, minification enabled. Packaged HTML and CSS match the files in `ui/`.
