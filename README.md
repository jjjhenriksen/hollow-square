# Hollow Square

Hollow Square is a small browser-playable Sacred Harp horror game about song, memory, and the class that remains.

It is a dependency-light static web project: the game runs from `index.html`, with its story, shape-note practice, short tune openings, optional four-part harmony, and included artwork kept in the repository.

## Run locally

Serve the repository with any static web server, then open the local address in a browser. For example:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000> after the server starts.

No package installation or build step is required.

## Performance check

The title screen defers the vendored notation renderer until a playable phrase
is entered. The title vignette and eleven story scenes are generated as deterministic
watercolor-and-ink SVG drawings by `artwork.js`. Seeded pigment shapes,
displacement, and granulation create uneven washes beneath broken pen lines
and fine hatching. The vignettes have transparent backgrounds: the actual page
is their paper, with no rectangular plate or bitmap overlay. The title takes
its green hymnal, candle, pine branches, and torn score from the earlier artwork.
The meetinghouse keeps the pew backs outside the hollow square, but cants
individual benches and dissolves much of their outline into the page. Fragmented
marks change pressure, pigment escapes plank edges, and an asymmetric wall
bleed replaces the tidy room grid. The central book rests on the open floor with a tight contact shadow, clear
of the foreground bench. The pencil has a solid lacquered body, wooden point,
graphite tip, and a small shadow that separates it from the printed page. Other scenes use book close-ups, a low floorboard view, and a leader’s
lectern. Books have buckled leaves, crooked shape-note staffs, worn bindings,
and interrupted ink contours. Candle wax and flame are chiefly wash shapes;
only the wick and faint, disconnected holder marks carry ink. Edit the scene geometry and shared forest-green,
rust-red, ochre, and ink palette there. Sons of Sorrow reuses
the heavy-book scene. The story inventory is meetinghouse, wrong pages,
thumbprint, empty chair, pencil note, floorboards, heavy book, three benches,
closed leader book, wrong shadow, and place in the square. No bitmap artwork
is loaded. To inspect the static payload locally, run:

```sh
du -h vendor/opensheetmusicdisplay.min.js artwork.js | sort -h
```

The wrong-shadow scene uses an elongated, translucent cast silhouette with
soft bleeding edges and a lower body that dissolves into the tabletop wash.
Its face and shoulders have no traced outline or hard portrait cutoff.

Candle flames and their light move gently; the flameless candle releases a
small drifting wisp, and the wrong shadow slowly deepens. These CSS animations
change only transform or opacity, pause when their screen is hidden, and stay
completely still when reduced motion is requested. Pigment filters are static;
there are no animation timers or frame loops to clean up.

## Handwritten marginalia

A few story pages carry a reader's handwritten note, mixing helpful reminders
with uneasy observations. Singing School also carries a practice reassurance.
The notes in `marginalia.js` are ordinary accessible text; they do not replace
printed instructions or introduce controls. `marginalia.css` reserves space in
the page flow and keeps them inline on narrow screens. Caveat is bundled as a
17 KB WOFF2 subset with its SIL Open Font License and source provenance in
`assets/fonts`; no font service is contacted while playing.

## Regression checks

Install the development dependencies and Chromium, then run the browser and
notation checks:

```sh
npm ci
npx playwright install chromium
npm test
```

## Security boundary

`index.html` applies a Content Security Policy to restrict scripts and resource
loads. This meta-delivered policy cannot enforce `frame-ancestors` or set
response-only security headers; those protections must be configured by the
publishing host.

## Credits

The notation renderer is the locally vendored [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) runtime. Review its upstream BSD-3-Clause license before redistributing this project. The title and story drawings are authored in `artwork.js`.
