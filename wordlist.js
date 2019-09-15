// Phil
// ------------------------------------------------------------------------
// Copyright 2017 Keiran King

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// (https://www.apache.org/licenses/LICENSE-2.0)

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ------------------------------------------------------------------------

var traceWordListSuggestions = false;

let wordlist = [
    [], [], [], [], [],
    [], [], [], [], [],
    [], [], [], [], [], []
];

openDefaultWordlist("https://raw.githubusercontent.com/keiranking/Phil/master/WL-SP.txt");

//____________________
// F U N C T I O N S

function addToWordlist(newWords) {
    for (i = 0; i < newWords.length; i++) {
	const word = newWords[i].trim().toUpperCase();
	if (word.length < wordlist.length) { // Make sure we don't access outside the wordlist array
	    wordlist[word.length].push(word);
	}
    }
}

function sortWordlist() {
    for (let i = 3; i < wordlist.length; i++) {
	wordlist[i].sort();
    }
}

// source: https://github.com/jashkenas/underscore/blob/master/underscore.js#L1320
function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};
function cloneObject(src) {
    let target = {};
    for (let prop in src) {
	if (src.hasOwnProperty(prop)) {
	    // if the value is a nested object, recursively copy all it's properties
	    if (isObject(src[prop])) {
		target[prop] = cloneObject(src[prop]);
	    } else {
		target[prop] = src[prop];
	    }
	}
    }
    return target;
}

function openWordlist() {
    document.getElementById("open-wordlist-input").click();
}

function openWordlistFile(e) {
    wordlist = [
	[], [], [], [], [],
	[], [], [], [], [],
	[], [], [], [], [], []
    ];

    const file = e.target.files[0];
    if (!file) {
	return;
    }
    let reader = new FileReader();
    reader.onload = function(e) {
	const words = e.target.result.split(/\s/g);
	addToWordlist(words);
	sortWordlist();
	removeWordlistDuplicates();
	invalidateSolverWordlist();
    };
    reader.readAsText(file);
}

function openDefaultWordlist(url) {
    let textFile = new XMLHttpRequest();
    textFile.open("GET", url, true);
    textFile.onreadystatechange = function() {
	if (textFile.readyState === 4 && textFile.status === 200) {  // Makes sure the document is ready to parse, and it's found the file.
	    const words = textFile.responseText.split(/\s/g);
	    addToWordlist(words);
	    sortWordlist();
	    console.log("Loaded " + wordlist.length + " words from the default wordlist.")
	}
    }
    textFile.send(null);
}

function removeWordlistDuplicates() {
    for (let i = 3; i < wordlist.length; i++) {
	if (wordlist[i].length >= 2) {
	    for (let j = wordlist[i].length - 1; j >0; j--) {
		if (wordlist[i][j] == wordlist[i][j - 1]) {
		    wordlist[i].splice(j, 1);
		}
	    }
	}
    }
}

function matchFromWordlist(word) {
    const l = word.length;
    const actualLettersInWord = word.replace(/-/g, "").length;
    if (actualLettersInWord >= 1 && actualLettersInWord < l) { // Only search if word isn't completely blank or filled
	word = word.split(DASH).join("\\w");
	const pattern = new RegExp(word);
	let matches = [];
	for (let i = 0; i < wordlist[l].length; i++) {
	    if (wordlist[l][i].search(pattern) > -1) {
		matches.push(wordlist[l][i]);
	    }
	}
	return matches;
    } else {
	return [];
    }
}

// Determines whether the given letter in WORD at POS1 appears in
// at least one word in the given WORDS at letter position POS2.
// CACHE is a set of previously determined harmonious letters.
function wordIsHarmonious( word, pos1, words, pos2, cache ) {
    if( traceWordListSuggestions ) console.log( "wordIsHarmonious(word=" + word + ", pos1=" + pos1 + ", words="+words + ", pos2=" + pos2 + ")");
    if( words === undefined ) return( false );
    letter = word.substring( pos1, pos1+1 ).toLowerCase();
    if( traceWordListSuggestions ) console.log( "letter = '" + letter + "'" );
    if( cache.has(letter) ) {
	if( traceWordListSuggestions ) console.log( "word '" + word + "' is harmonious (cached)" );
	return( true );
    } else {
	for( i = 0; i < words.length; i++ ) {
	    if( traceWordListSuggestions ) console.log( "wordIsHarmonious: checking " + word + " vs. " + words[i] + " on letter '" + words[ i ].substring( pos2, pos2+1 ).toLowerCase() + "'" );
	    if( letter == words[ i ].substring( pos2, pos2+1 ).toLowerCase() ) {
		cache.add( letter );
		if( traceWordListSuggestions ) console.log( "word '" + word + "' is harmonious" );
		return( true );
	    }
	}
	if( traceWordListSuggestions ) console.log( "word '" + word + "' is NOT harmonious" );
	return( false );
    }
}

function displayDefintion() {
    alert("displayDefintion");
}

// Add *all* clues for acrossMatches.
// Annotate those clues as "recommended" if they are harmonious with at least one downMatch.
// Annotate those clues as "highly-recommended" if they are harmonious with *all* downMatches.
// (Optimization: Once we miss a downMatch for an acrossMatch, we need look no further for highly-recommended for that acrossMatch.)
function checkHarmoniousness( document, oneWayMatches, otherWayMatches, hpos, vpos, matchList, pos ) {
    if( traceWordListSuggestions ) console.log( "oneWayMatches=" + oneWayMatches);
    if( traceWordListSuggestions ) console.log( "otherWayMatches=" + otherWayMatches);
    for (let am1 in oneWayMatches ) {
	if( traceWordListSuggestions ) console.log( "checking oneWayMatches[" + am1 + "] for " + oneWayMatches[am1] );
	for( let am2 in oneWayMatches[am1] ) {
	    if( traceWordListSuggestions ) console.log( "\t\t[" + am1 + "][" + am2 + "]=" + oneWayMatches[am1][am2] );
	    let am = oneWayMatches[am1][am2];
	    if( am !== undefined ) {
		let li = document.createElement("LI");
		li.innerHTML = am.toLowerCase();
		li.className = "";
		// li.addEventListener('click', printScore);
		// li.addEventListener('mouseover', displayDefintion);
		li.addEventListener('dblclick', fillGridWithMatch);
		let nHarmonious = 0;
		let harmoniousAtIntersection = false;

		// HARMONIOUSNESS_CHECK:
		for( let dm1 in otherWayMatches ) {
		    let cache = new Set();
		    if( traceWordListSuggestions ) console.log( "\t\t\tchecking otherWayMatches='"+ otherWayMatches[dm1] +"'");
		    //		    if( !wordIsHarmonious( am, hpos, otherWayMatches[dm1], vpos, cache ) ) {
		    // At this point, if otherWayMatches[dm1] is undefined, that means that the word is complete
		    // and we ought to consider that the word is harmonious
		    if( otherWayMatches[dm1] !== undefined && !wordIsHarmonious( am, parseInt(dm1, 10), otherWayMatches[dm1], vpos, cache ) ) {
			if( traceWordListSuggestions ) console.log( "breaking from HARMONIOUSNESS_CHECK")
			// break HARMONIOUSNESS_CHECK;
		    } else {
			nHarmonious++;
			if( dm1 == pos ) {
			    if( traceWordListSuggestions ) console.log( "Setting harmoniousAtIntersection to true" );
			    harmoniousAtIntersection = true;
			}
		    }
		}
		if( traceWordListSuggestions ) console.log( "nHarmonious=" + nHarmonious );
		if( nHarmonious == otherWayMatches.length ) {
		    li.setAttribute("class", "highly-recommended");
		} else {
		    if( harmoniousAtIntersection ) {
			li.setAttribute("class", "recommended");
		    }
		}
//		if( nHarmonious || !showOnlyRecommendations ) {
		if( !showOnlyRecommendations || ( nHarmonious == otherWayMatches.length )) {
		    matchList.appendChild(li);
		}
	    }
	}
    }
}

// TODO: only add word if in same pos (row or col)

// 1. Mark suggested words with the "recommended" class when the word forms a valid word
//    both across and down for words that intersect at the current square.
// 2. Mark suggested words with the "highly-recommended" class when the word forms a valid word
//    both across and down for *all* words that intersect the word.

//  For example, with the following board and the cursor at the asterisk (which is blank):
//
//       +---+---+---+---+
//       | A | * |   |   |
//       +---+---+---+---+
//       | B | X |   |   |
//       +---+---+---+---+
//       | C |   | Y |   |
//       +---+---+---+---+
//       | D |   |   |   |
//       +---+---+---+---+
//
// Fill in suggestions for the first row (A---) and the second column (-X--).
//
// Suggested words for the first row (A---) that match the cross character in the list of suggested words
// for the second column (-X--) are annotated with the class name "recommended".
//
// Suggested words for the first row (A---) that match the cross character in the list of suggested words
// for *all* intersecting columns (-X--, --Y-) are annotated with the class name "highly-recommended".
//
// Likewise for the other direction:
//
// Suggested words for the first column (-X--) that match the cross character in the list of suggested words
// for the first row (A---) are annotated with the class name "recommended".
//
// Suggested words for the first column (-X--) that match the cross character in the list of suggested words
// for *all* intersecting rows (A---, BX--, C-Y- and D---) are annotated with the class name "highly-recommended".
//

// Only consider words that are neither completely empty nor completely full.

function updateMatchesUI() {
    let acrossMatchList = document.getElementById("across-matches");
    let downMatchList = document.getElementById("down-matches");
    acrossMatchList.innerHTML = "";
    downMatchList.innerHTML = "";
    console.log( "showOnlyRecommendations=" + showOnlyRecommendations );
    let downWords = [];
    let acrossWords = [];

    console.log( "updateMatchesUI: working on ACROSS direction" );
    console.log( "updateMatchesUI: current.acrossStartIndex=" + current.acrossStartIndex + " current.acrossEndIndex=" + current.acrossEndIndex );
    for( let i = current.acrossStartIndex; i< current.acrossEndIndex; i++ ) {
	let word = getWordAt(current.row, i, DOWN, false);
	downWords.push( word );
	if( traceWordListSuggestions ) console.log( "updateMatchesUI: pushing \"" + word + "\"" );
    }

    console.log( "updateMatchesUI: working on DOWN direction" );
    console.log( "updateMatchesUI: current.downStartIndex=" + current.downStartIndex + " current.downEndIndex=" + current.downEndIndex );
    for( let i = current.downStartIndex; i< current.downEndIndex; i++ ) {
	let word = getWordAt(i, current.col, ACROSS, false);
	acrossWords.push( word );
	if( traceWordListSuggestions ) console.log( "updateMatchesUI: pushing \"" + word + "\"" );
    }

    let acrossMatches = [];
    let downMatches = [];

    for( let w of acrossWords ) {
	const actualLettersInWord = w.replace(/-/g, "").length;
	if( actualLettersInWord == w.length ) {
	    if( traceWordListSuggestions ) console.log( "pushing <undefined> onto acrossMatches" );
	    acrossMatches.push( undefined );
	} else {
	    var words = matchFromWordlist( w );
	    if( traceWordListSuggestions ) console.log( "pushing " + words + " onto acrossMatches" );
	    acrossMatches.push( words );
	}
    }

    for( let w of downWords ) {
	const actualLettersInWord = w.replace(/-/g, "").length;
	if( actualLettersInWord == w.length )  {
	    if( traceWordListSuggestions ) console.log( "pushing <undefined> onto downMatches" );
	    downMatches.push( undefined );
	} else {
	    var words = matchFromWordlist( w );
	    if( traceWordListSuggestions ) console.log( "pushing " + words + " onto downMatches" );
	    downMatches.push( words );
	}
    }
    let hpos = current.col - current.acrossStartIndex;
    let vpos = current.row - current.downStartIndex;

    console.log("Checking acrossMatches...");
    checkHarmoniousness( document, [matchFromWordlist( current.acrossWord ) ], downMatches, hpos, vpos, acrossMatchList, current.col );
    console.log("Checking downMatches...");
    checkHarmoniousness( document, [matchFromWordlist( current.downWord ) ], acrossMatches, vpos, hpos, downMatchList, current.row );


    //    let cache2 = new Set();
    //    for (let i = 0; i < downMatches.length; i++) {
    //	let li = document.createElement("LI");
    //	li.innerHTML = downMatches[i].toLowerCase();
    //	li.className = "";
    //	li.addEventListener('dblclick', fillGridWithMatch);
    //	let h = wordIsHarmonious( downMatches[ i ], vpos, acrossMatches, hpos, cache2 );
    //	if( h ) {
    //	    li.setAttribute("class", "recommended");
    //	}
    //	if( h || !showOnlyRecommendations ) {
    //	    downMatchList.appendChild(li);
    //	}
    //    }
}
// Set Undo button's state to STATE
function setUndoButton( state, tooltip ) {
    console.log( "setUndoButton: setting state = " + state + ", tooltip=\"" + tooltip + "\"" );
    let undoButton = document.getElementById("undo");

    if( undoButton.getAttribute( "data-state" ) != state ) {
	console.log( "setUndoButton: toggling button-on" );
	undoButton.classList.toggle("button-on");
    }

    undoButton.setAttribute( "data-state",  state );
    undoButton.setAttribute( "data-tooltip", tooltip );
}

// Undo the latest action done by fillGridWithMatch()
function undo() {
    if( undoStack.length > 0 ) {
	console.log("undo: undoing puzzle to before last grid fill...");
	const previousCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
	previousCell.classList.remove("active");

	let undoContext = undoStack.pop();
	xw = undoContext.xw;
	current = undoContext.current;

	if( undoStack.length <= 0 ) {
	    setUndoButton( "off", "No further undo information available" );
	} else {
	    let undoContext = undoStack[ undoStack.length-1 ];
	    setUndoButton( "on", "Undo latest grid fill for \"" + undoContext.fill + "\"");
	}

	isMutated = true;
	// updateActiveWords();
	// updateMatchesUI();
	updateUI();
	const currentCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
	currentCell.classList.add("active");

	grid.focus();
    }
}

function fillGridWithMatch(e) {
    const li = e.currentTarget;
    const fill = li.innerHTML.toUpperCase();
    const dir = (li.parentNode.id == "across-matches") ? ACROSS : DOWN;

    let undoContext = {};
    undoContext.xw = cloneObject( xw );
    undoContext.current = cloneObject( current );
    undoContext.fill = fill;
    undoStack.push( undoContext );
    setUndoButton( "on", "Undo latest grid fill for \"" + fill + "\"" );

    if (dir == ACROSS) {
	xw.fill[current.row] = xw.fill[current.row].slice(0, current.acrossStartIndex) + fill + xw.fill[current.row].slice(current.acrossEndIndex);
	for (let i = current.acrossStartIndex; i < current.acrossEndIndex; i++) {
	    const square = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + i + '"]');
	    square.lastChild.innerHTML = fill[i - current.acrossStartIndex];
	}
    } else {
	for (let j = current.downStartIndex; j < current.downEndIndex; j++) {
	    xw.fill[j] = xw.fill[j].slice(0, current.col) + fill[j - current.downStartIndex] + xw.fill[j].slice(current.col + 1);
	    const square = grid.querySelector('[data-row="' + j + '"]').querySelector('[data-col="' + current.col + '"]');
	    square.lastChild.innerHTML = fill[j - current.downStartIndex];
	}
    }
    isMutated = true;
    console.log("Filled '" + li.innerHTML + "' going " + dir);
    // updateActiveWords();
    // updateMatchesUI();
    updateUI();
    grid.focus();
}
