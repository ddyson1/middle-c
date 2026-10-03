# Editing the lessons, for Rulin

Everything the game says, and every note it teaches, lives in two small files. You can change your lines, the drills, and the fingerings without touching any code, straight from the browser. When you save, the live game at [devindyson.com/middle-c](https://devindyson.com/middle-c/) updates itself about a minute later.

- [Edit lessons.json](https://github.com/ddyson1/middle-c/edit/main/src/lessons.json) holds the seven lessons: every line of instruction, every drill, every teaching screen.
- [Edit tunes.json](https://github.com/ddyson1/middle-c/edit/main/src/tunes.json) holds the seven tunes: the notes, their lengths, and the finger numbers.

## How to make an edit

1. Open one of the two links above (sign in to GitHub if it asks).
2. Change the text you want to change.
3. Press the green **Commit changes** button, then **Commit changes** again in the box that pops up. That is "save".
4. Wait about a minute, then refresh the game. Your words are live.

A robot checks every save. If you break something, the deploy fails quietly and the live game just keeps the previous version, so you cannot take the site down. If your change does not appear after a couple of minutes, something got flagged. Undo your edit or tell Devin, nothing is lost either way.

## The shape of the file

Both files are JSON, which just means the text is wrapped in punctuation the game reads. Two rules keep it happy:

- Your words always live between double quotes: `"line": "Press C. Nothing else counts yet."`
- Never type a double quote inside your words. Apostrophes are fine (write `don't` normally).

Everything else, the brackets, colons and commas, is scaffolding. Leave it where it is and you can rewrite any sentence freely.

## lessons.json, lesson by lesson

Each lesson has a `name`, the `tune` it ends with, and a list of `steps`. A step's `"t"` says what kind it is.

**"show"** is a teaching screen. Yours to rewrite completely:

- `title` is the big heading.
- `text` is the paragraph under it.
- `line` is the coaching line that sits just above the keyboard. This is your voice.
- `glow` lights keys, `labels` prints their names on them, `demo` plays keys in order when the student presses Show me, and `fingers` puts numbered badges on keys. These use key numbers (table below).

**"drill"** is practice. `line` is yours; `items` are the questions:

- `{"t": "find", "pc": 2}` means press any D. The number is the letter, not the octave: C 0, D 2, E 4, F 5, G 7, A 9, B 11 (sharps and flats are the numbers in between: C sharp 1, E flat 3, F sharp 6, A flat 8, B flat 10).
- `{"t": "name", "m": 62}` lights key 62 and asks its name.
- `{"t": "read", "clef": "treble", "d": 30}` shows a note on the staff to press. The `d` numbers are staff positions, best changed together with Devin.
- `{"t": "echo", "seq": [60, 62, 64]}` plays those keys, student plays them back.
- Add `"shuffle": true` to a drill and its questions mix into a new order each time the game loads.

**"play"** runs the tune in three passes, and **"done"** is the finish screen. In both, `line` is yours.

## Key numbers

Middle C is 60, and each key up or down changes the number by 1, black keys included.

| C4 (middle C) | D4 | E4 | F4 | G4 | A4 | B4 | C5 |
|---|---|---|---|---|---|---|---|
| 60 | 62 | 64 | 65 | 67 | 69 | 71 | 72 |

One octave down, subtract 12: C3 is 48, D3 is 50, E3 is 52, and so on. B flat 4 is 70.

## tunes.json and your fingerings

A tune is a list of events: `[2, "E4:3"]` means a note 2 eighths long (a quarter note), right hand, E in the 4th octave, played with finger 3. The third slot, when present, is the left hand: `[2, "E4:3", "C3:5"]`.

- Lengths are counted in eighth notes: 1 eighth, 2 quarter, 3 dotted quarter, 4 half, 6 dotted half, 8 whole.
- Fingers are 1 thumb to 5 pinky, for either hand. To add one, change `"C4"` to `"C4:1"`. To change one, just change the digit.
- The same key may take different fingers in different places. That is how you write a position shift.

During the first pass of a tune, the lit key shows its finger in a small badge. No fingering on a note simply means no badge.

Two tunes are waiting for your fingerings, because they leave the five finger position and I did not want to guess your teaching: **twinkle** and **birthday**. The other five have drafts; correct anything that is not how you would teach it.

## House style, if you want it

Short lines. Specific over encouraging. No praise for every press, the game already shows green. No exclamation points, no em dashes, no emojis. But these were written before you got here, and the voice is yours now.
