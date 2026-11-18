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
  photos (no student webcam photos for training). Each notebook part sets itself up, so students can jump in.
- The leaderboard scores the fine-tuned network on the 372 test photos, trained on the same 60 photos
  for every team (pick(..., seed=0)), so it's fair. Board page: leaderboard.html; API: gradlabs.in
  /api/leaderboard/deep-learning (lib/leaderboard.ts in the site repo).
- The notebook is built by a script (make_nb.py, kept outside this repo); edit the notebook
  directly if that script isn't at hand. Test every code cell before pushing.
