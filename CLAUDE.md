# Deep learning session — notes for Claude

- Follow study-notebook-design/GUIDELINES.md (Rishal's design advice). Built from starter-webinar.
- Stand-alone, like the GenAI webinar: no links to other courses, no branding, no company names
  on the pages or in the notebooks.
- Unlisted: keep `<meta name="robots" content="noindex, nofollow">` on every page. Served at
  gradlabs.in/learn/deep-learning/ and listed only on the unlisted gradlabs.in/activities page.
- No date, time or speaker: the session can repeat.
- "Deep learning right now" (the first page) describes the field in late 2026. Refresh it a few days
  before each session.
- Two hours, one notebook (Rishal, 18 Nov 2026): one project throughout, rock-paper-scissors on the public
  photos (no student webcam photos for training). The notebook has four labs (Lab 1–4; "Part" means the session page's parts). Each lab sets itself up, so students can jump in.
- The leaderboard scores the fine-tuned network on the 372 test photos, trained on the same 60 photos
  for every team (pick(..., seed=0)), so it's fair. Board page: leaderboard.html; API: gradlabs.in
  /api/leaderboard/deep-learning (lib/leaderboard.ts in the site repo).
- The notebook is built by a script (make_nb.py, kept outside this repo); edit the notebook
  directly if that script isn't at hand. Test every code cell before pushing.
- Home page (19 Nov 2026): the hero is a mini teachable machine (assets/tm.js: MediaPipe MobileNet embeddings + a
  7-nearest-neighbour vote, webcam, loads on Start camera, Camera off button, off when the tab is hidden, falls back
  to a Teachable Machine link). Session page 2 is a live Teachable Machine demo. Not tested by Claude with a real
  webcam or the real model (both unreachable from the sandbox): test with a mock (see the session notes).
- The 2-hour plan, with Teachable Machine and a 10-minute break after Lab 2: 0:00 intro + Teachable Machine + setup,
  0:15 a neuron → Lab 1, 0:35 layers / loop / overfitting / convolution, 0:50 Lab 2, 1:05 break, 1:15 transfer learning,
  CLIP, Practice 2 (show of hands), 1:20 Lab 3 + leaderboard, 1:45 Lab 4, winners, questions. No more additions.
