# Phil, a crossword maker

[![Version](images/version.svg)]()

<img src="images/screenshot.png" align="right" width="600" height="400">

Phil helps you make crosswords, using client-side JavaScript.
* Import & export .xw ([JSON](https://www.xwordinfo.com/JSON/)) or .puz files.
* Use the built-in dictionary, or any text file you want.
* Print to PDF.
* Create a New York Times submission in seconds.

## Related repositories

Phil uses [Font Awesome](https://github.com/FortAwesome/Font-Awesome/) icons and [jsPDF](https://github.com/MrRio/jsPDF/) (along with [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable/)) for generating PDFs.

The Phil solving engine (in progress) uses the [Glucose](http://www.labri.fr/perso/lsimon/glucose/) 3.0 SAT solver. The sources (with our modifications) are in the [third_party](third_party) directory.

## Getting started

To use Phil:

1. Go to [keiranking.com/phil](http://www.keiranking.com/phil).

To run your own copy of Phil:

1. Install a working [Emscripten](http://kripken.github.io/emscripten-site/) environment. On Mac, using [homebrew](http://braumeister.org/formula/emscripten) is a good choice.

2. From the command line, run:

   ```
   cd third_party/glucose-3.0/simp
   make xwsolve.js
   ```

   At this point, `xwsolve.js` and `xwsolve.wasm` should be generated.

3. Go back to the Phil main directory (`cd ../../..`) and create symbolic links (aliases):

   ```
   ln -s third_party/glucose-3.0/simp/xwsolve.* .
   ```

4. Run a local webserver. If you have Python 3 installed, then:

   ```
   python3 -m http.server 8000
   ```

   If you have only Python 2 installed, then:

   ```
   python -m SimpleHTTPServer 8000
   ```

5. Point your browser to [localhost:8000](http://localhost:8000).

## Crossword resources

* [Wordlists](http://www.puzzlers.org/dokuwiki/doku.php?id=solving:wordlists:about:start)
* [Crossword theme categories](http://www.cruciverb.com/index.php?action=ezportal;sa=page;p=70)
* [OneLook](http://onelook.com/) and [Crossword Tracker](http://crosswordtracker.com/) search engines

## License
Licensed under [the Apache License, v2.0](http://www.apache.org/licenses/LICENSE-2.0) (the 'License').

Unless required by law or agreed in writing, software distributed under the License
is distributed on an **'as is' basis, without warranties or conditions**, express or implied.
See the [License](LICENSE.txt) for the specific language governing permissions and limitations.

&copy; Keiran King
