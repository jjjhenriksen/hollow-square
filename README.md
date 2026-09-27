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
is entered. The title vignette and eleven story scenes are generated as small,
deterministic SVG drawings by `artwork.js`; edit the scene geometry and shared
paper, forest-green, rust-red, and brass palette there. Sons of Sorrow reuses
the heavy-book scene. The story inventory is meetinghouse, wrong pages,
thumbprint, empty chair, pencil note, floorboards, heavy book, three benches,
closed leader book, wrong shadow, and place in the square. No bitmap artwork
is loaded. To inspect the static payload locally, run:

```sh
du -h vendor/opensheetmusicdisplay.min.js artwork.js | sort -h
```

Programmatic artwork is static and has no offscreen animation to clean up.

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
