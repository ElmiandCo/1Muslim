# HudHud Overlay (experimental)
Framework-independent transparent overlay. No Supabase, 1Muslim authentication, or LiveKit dependency.
Attach to a positioned video wrapper:
```ts
import { HudHudOverlay } from './src/index';
const overlay = new HudHudOverlay(document.querySelector('#video-wrapper')!, { motion: 'rise' });
overlay.show({ id: crypto.randomUUID(), text: 'Hello!', author: 'Viewer' });
overlay.configure({ motion: 'left', opacity: 0.7 });
```
Supports portrait and landscape containers by matching parent bounds. Works with in-page HTML5 players. Browser native fullscreen and cross-origin iframe behavior require separate adapters and testing.
No comment persistence, realtime delivery, or moderation included. Do not deploy to production before integration tests.
