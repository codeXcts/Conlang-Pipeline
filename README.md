# Family Language tools (offline)

Seven small pages that run in any browser with no internet and nothing to install.
They share one word list, so you import it once (on any page) and every tool uses it.

| Page | What it does |
|---|---|
| `index.html` | **Lookup**: search words both ways, filters, stars, export |
| `flashcards.html` | **Cards**: spaced-repetition flashcards, separate progress per person |
| `quiz.html` | **Quiz**: big-button multiple choice for kids, scores and streaks |
| `glosser.html` | **Gloss**: splits a sentence into roots and endings (*mağišta* → eat-CMD) |
| `builder.html` | **Build**: adds endings/prefixes to a root with the spelling rules, checks for clashes |
| `phrasebook.html` | **Phrases**: the phrasebook, idioms, proverbs and pet names, searchable |
| `reader.html` | **Read**: stories with tap-to-define words |

## Setup
1. Put all the files in one folder (or the root of a GitHub repo).
2. Open `index.html` and tap **Import**. Load the app's meaning sheet (`Meaning-list-*.txt`).
3. Optional: turn on GitHub Pages. If a `words.json` or `wordlist.txt` sits next to `index.html`, the Lookup page loads it on first visit.

Everything is saved in the browser on that device (localStorage). Flashcard progress can be backed up and restored from the Cards page.

## Grammar rules
Endings, irregular forms and spelling rules live in `RULES` near the top of `core.js`
(as of grammar.md, 2026-11-17). Edit them there when the grammar changes.

## Updating content
- **Phrasebook:** tap **Update** and load the newest `canon/phrasebook.md`.
- **Stories:** on the Read page tap **Add text** and load a file from `canon/stories/`.
