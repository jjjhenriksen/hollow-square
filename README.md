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
is entered. To inspect the static payload locally, run:

```sh
du -h vendor/opensheetmusicdisplay.min.js assets/* | sort -h
```

Story illustrations use lazy loading after the initial page. Keep new artwork
compressed and prefer responsive formats when adding assets.

## Credits

The notation renderer is the locally vendored [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) runtime. Review its upstream BSD-3-Clause license and the rights for the included artwork before redistributing this project.
