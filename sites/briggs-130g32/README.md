# 130G32 Engine Lab

Hands-on learning site for the Briggs and Stratton 130G32-0022-F1 (208cc) engine.

Plain HTML, CSS, and JavaScript. No backend.

Made by Dev2go / Matthew Tietjen, for Lenéa Benson.

Run it: `python3 -m http.server 8130` in this folder, then open http://127.0.0.1:8130/

- Progress, flashcard marks, checklists, and your own photos save in the browser (localStorage).
- `ipl/` holds the official Briggs and Stratton IPL diagrams (rev 23-Nov-2020). They are copyrighted by Briggs and Stratton and marked "Not for reproduction": keep this site for personal study and do not post it publicly with that folder. The 3D model is posted online.
- Part-number product photos are saved in `img/parts/` with their sources in each caption.
- Other photos and diagrams come from Wikimedia Commons under free licenses; credits are shown under each one.
- `models/engine-xr550.glb` is a similar single-cylinder OHV engine (not a 130G32), extracted from the XR550 SolidWorks file's display mesh: 394 parts, 2.8 MB.
- `js/vendor/` holds three.js r160 (MIT license) so the 3D page works offline.
