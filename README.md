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

## Credits

The notation renderer is the locally vendored [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) runtime. Review its upstream BSD-3-Clause license and the rights for the included artwork before redistributing this project.
