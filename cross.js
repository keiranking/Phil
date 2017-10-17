const keyboard = {
  "a":      65, "b": 66, "c": 67, "d": 68, "e": 69, "f": 70, "g": 71, "h": 72,
  "i":      73, "j": 74, "k": 75, "l": 76, "m": 77, "n": 78, "o": 79, "p": 80,
  "q":      81, "r": 82, "s": 83, "t": 84, "u": 85, "v": 86, "w": 87, "x": 88, "y": 89,
  "z":      90,
  "black":  190, ".": 190,
  "delete": 8,
  "enter":  13,
  "space":  32,
  "left":   37,
  "up":     38,
  "right":  39,
  "down":   40
};
const BLACK = ".";
const DASH = "-";
const BLANK = " ";
const ACROSS = "across";
const DOWN = "down";
const DEFAULT_SIZE = 15;
const DEFAULT_TITLE = "Untitled";
const DEFAULT_AUTHOR = "Anonymous";
const DEFAULT_CLUE = "(blank clue)";

let xw = {};
let current = {};
let isSymmetrical = true;
let grid = undefined;
let squares = undefined;
let isMutated = false;
createNewPuzzle();

//____________________
// F U N C T I O N S

function createNewPuzzle(rows, cols) {
  xw["clues"] = {};
  xw["title"] = DEFAULT_TITLE;
  xw["author"] = DEFAULT_AUTHOR;
  xw["rows"] = rows || DEFAULT_SIZE;
  xw["cols"] = cols || xw.rows;
  xw["fill"] = [];
  for (let i = 0; i < xw.rows; i++) {
    xw.fill.push("");
    for (let j = 0; j < xw.cols; j++) {
      xw.fill[i] += BLANK;
    }
  }
  console.log(xw.fill);
  updateInfoUI();
  document.getElementById("main").innerHTML = "";
  createGrid(xw.rows, xw.cols);

  isSymmetrical = true;
  current = {
    "row":        0,
    "col":        0,
    "acrossWord": '',
    "downWord":   '',
    "acrossStartIndex":0,
    "acrossEndIndex":  DEFAULT_SIZE,
    "downStartIndex":  0,
    "downEndIndex":    DEFAULT_SIZE,
    "direction":  ACROSS
  };

  grid = document.getElementById("grid");
  squares = grid.querySelectorAll('td');

  updateActiveWords();
  updateGridHighlights();
  updateSidebarHighlights();
  updateCluesUI();

  for (const square of squares) {
    square.addEventListener('click', mouseHandler);
  }
  grid.addEventListener('keydown', keyboardHandler);
}

function mouseHandler(e) {
  const previousCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  previousCell.className = previousCell.className.replace("active", "");
  const activeCell = e.currentTarget;
  if (activeCell == previousCell) {
    current.direction = (current.direction == ACROSS) ? DOWN : ACROSS;
  }
  current.row = Number(activeCell.parentNode.dataset.row);
  current.col = Number(activeCell.dataset.col);
  console.log("[" + current.row + "," + current.col + "]");
  activeCell.className += " active";
  activeCell.className = activeCell.className.trim();

  isMutated = false;
  updateUI();
}

function keyboardHandler(e) {
  isMutated = false;
  let activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  const symRow = xw.rows - 1 - current.row;
  const symCol = xw.cols - 1 - current.col;

  if ((e.which >= keyboard.a && e.which <= keyboard.z) || e.which == keyboard.space) {
    let oldContent = xw.fill[current.row][current.col];
    xw.fill[current.row] = xw.fill[current.row].slice(0, current.col) + String.fromCharCode(e.which) + xw.fill[current.row].slice(current.col + 1); // update model
    if (oldContent == BLACK) {
      if (isSymmetrical) {
        xw.fill[symRow] = xw.fill[symRow].slice(0, symCol) + BLANK + xw.fill[symRow].slice(symCol + 1); // update model
      }
    }
    // move the cursor
    e = new Event('keydown');
    if (current.direction == ACROSS) {
      e.which = keyboard.right;
    } else {
      e.which = keyboard.down;
    }
    isMutated = true;
  }
  if (e.which == keyboard.black) {
      if (xw.fill[current.row][current.col] == BLACK) { // if already black...
        e = new Event('keydown');
        e.which = keyboard.delete; // make it a white square
      } else {
        xw.fill[current.row] = xw.fill[current.row].slice(0, current.col) + BLACK + xw.fill[current.row].slice(current.col + 1); // update model
        if (isSymmetrical) {
          xw.fill[symRow] = xw.fill[symRow].slice(0, symCol) + BLACK + xw.fill[symRow].slice(symCol + 1); // update model
        }
      }
      isMutated = true;
  }
  if (e.which == keyboard.enter) {
      current.direction = (current.direction == ACROSS) ? DOWN : ACROSS;
  }
  if (e.which == keyboard.delete) {
    let oldContent = xw.fill[current.row][current.col];
    xw.fill[current.row] = xw.fill[current.row].slice(0, current.col) + BLANK + xw.fill[current.row].slice(current.col + 1); // update model
      if (oldContent == BLACK) {
        if (isSymmetrical) {
          xw.fill[symRow] = xw.fill[symRow].slice(0, symCol) + BLANK + xw.fill[symRow].slice(symCol + 1); // update model
        }
      } else { // move the cursor
        console.log(xw.fill[current.row][current.col]);
        e = new Event('keydown');
        if (current.direction == ACROSS) {
          e.which = keyboard.left;
        } else {
          e.which = keyboard.up;
        }
      }
      isMutated = true;
  }
  if (e.which >= keyboard.left && e.which <= keyboard.down) {
      const previousCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
      previousCell.className = previousCell.className.replace("active", "");
      let content = xw.fill[current.row][current.col];
      switch (e.which) {
        case keyboard.left:
          if (current.direction == ACROSS || content == BLACK) {
            current.col = (current.col == 0) ? current.col : current.col - 1;
            if (content == BLACK) {
              current.direction = ACROSS;
            }
          } else {
            current.direction = ACROSS;
          }
          break;
        case keyboard.up:
          if (current.direction == DOWN || content == BLACK) {
            current.row = (current.row == 0) ? current.row : current.row - 1;
            if (content == BLACK) {
              current.direction = DOWN;
            }
          } else {
            current.direction = DOWN;
          }
          break;
        case keyboard.right:
          if (current.direction == ACROSS || content == BLACK) {
            current.col = (current.col == xw.cols - 1) ? current.col : current.col + 1;
            if (content == BLACK) {
              current.direction = ACROSS;
            }
          } else {
            current.direction = ACROSS;
          }
          break;
        case keyboard.down:
          if (current.direction == DOWN || content == BLACK) {
            current.row = (current.row == xw.rows - 1) ? current.row : current.row + 1;
            if (content == BLACK) {
              current.direction = DOWN;
            }
          } else {
            current.direction = DOWN;
          }
          break;
      }
      console.log("[" + current.row + "," + current.col + "]");
      activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
      activeCell.className = (activeCell.className + " active").trim();
  }
  updateUI();
}

function updateUI() {
  console.log("Fill change:", isMutated);
  updateGridUI();
  updateLabelsAndClues();
  updateActiveWords();
  updateGridHighlights();
  updateSidebarHighlights();
  updateMatchesUI();
  updateCluesUI();
  updateInfoUI();
}

function updateGridUI() {
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const activeCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      activeCell.lastChild.innerHTML = xw.fill[i][j];
      if (xw.fill[i][j] == BLACK) {
        if (activeCell.className.search("black") == -1) {
          activeCell.className += " black";
          activeCell.className.trim();
        }
      } else {
        if (activeCell.className.search("black") > -1) {
          activeCell.className = activeCell.className.replace("black", "").trim();
        }
      }
    }
  }
}

function updateCluesUI() {
  let acrossClueNumber = document.getElementById("across-clue-number");
  let downClueNumber = document.getElementById("down-clue-number");
  let acrossClueText = document.getElementById("across-clue-text");
  let downClueText = document.getElementById("down-clue-text");
  const currentCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');

  // If the current cell is black, empty interface and get out
  if (currentCell.className.search("black") != -1) {
    acrossClueNumber.innerHTML = "";
    downClueNumber.innerHTML = "";
    acrossClueText.innerHTML = "";
    downClueText.innerHTML = "";
    return;
  }
  // Otherwise, assign values
  const acrossCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.acrossStartIndex + '"]');
  const downCell = grid.querySelector('[data-row="' + current.downStartIndex + '"]').querySelector('[data-col="' + current.col + '"]');
  acrossClueNumber.innerHTML = acrossCell.firstChild.innerHTML + "a.";
  downClueNumber.innerHTML = downCell.firstChild.innerHTML + "d.";
  acrossClueText.innerHTML = xw.clues[[current.row, current.acrossStartIndex, ACROSS]];
  downClueText.innerHTML = xw.clues[[current.downStartIndex, current.col, DOWN]];
}

function updateInfoUI() {
  document.getElementById("puzzle-title").innerHTML = xw.title;
  document.getElementById("puzzle-author").innerHTML = xw.author;
}

function createGrid(rows, cols) {
  let table = document.createElement("TABLE");
  table.setAttribute("id", "grid");
  table.setAttribute("tabindex", "1");
  // table.setAttribute("tabindex", "0");
  document.getElementById("main").appendChild(table);

	for (let i = 0; i < rows; i++) {
    	let row = document.createElement("TR");
    	row.setAttribute("data-row", i);
    	document.getElementById("grid").appendChild(row);

		for (let j = 0; j < cols; j++) {
		    let col = document.createElement("TD");
        col.setAttribute("data-col", j);

        let label = document.createElement("DIV");
        label.setAttribute("class", "label");
        let labelContent = document.createTextNode("");

        let fill = document.createElement("DIV");
        fill.setAttribute("class", "fill");
        let fillContent = document.createTextNode(xw.fill[i][j]);

    		// let t = document.createTextNode("[" + i + "," + j + "]");
        label.appendChild(labelContent);
        fill.appendChild(fillContent);
        col.appendChild(label);
        col.appendChild(fill);
    		document.querySelector('[data-row="' + i + '"]').appendChild(col);
      }
  }
  updateLabelsAndClues();
}

function updateLabelsAndClues() {
  let count = 1;
  let increment = false;
  const grid = document.getElementById("grid");

  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      let isAcross = false;
      let isDown = false;
      increment = false;
      // if the cell isn't 'black'
      let currentCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (currentCell.className.search("black") == -1) {
        if (i == 0) { // if the row is 0, increment the clue number
          increment = true;
          isDown = true;
        } else {      // else if the square above me is black, increment
          const upCell = grid.querySelector('[data-row="' + (i - 1) + '"]').querySelector('[data-col="' + j + '"]');
          if (upCell.className.search("black") > -1) {
            increment = true;
            isDown = true;
          }
        }
        if (j == 0) { // if the column is 0, increment
          increment = true;
          isAcross = true;
        } else {      // else if the square to my left is black, increment
          const leftCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + (j - 1) + '"]');
          if (leftCell.className.search("black") > -1) {
            increment = true;
            isAcross = true;
          }
        }
      }
      if (increment) {
        currentCell.firstChild.innerHTML = count; // Set square's label to the count
        count++;
        increment = false;

        if (isAcross) {
          xw.clues[[i, j, ACROSS]] = xw.clues[[i, j, ACROSS]] || DEFAULT_CLUE;
        } else {
          delete xw.clues[[i, j, ACROSS]];
        }
        if (isDown) {
          xw.clues[[i, j, DOWN]] = xw.clues[[i, j, DOWN]] || DEFAULT_CLUE;
        } else {
          delete xw.clues[[i, j, DOWN]];
        }
      } else {
        currentCell.firstChild.innerHTML = "";
        delete xw.clues[[i, j, ACROSS]];
        delete xw.clues[[i, j, DOWN]];
      }
    }
  }
}

function updateActiveWords() {
  if (xw.fill[current.row][current.col] == BLACK) {
    current.acrossWord = '';
    current.downWord = '';
    current.acrossStartIndex = null;
    current.acrossEndIndex = null;
    current.downStartIndex = null;
    current.downEndIndex = null;
  } else {
    current.acrossWord = getWordAt(current.row, current.col, ACROSS, true);
    current.downWord = getWordAt(current.row, current.col, DOWN, true);
  }
  document.getElementById("across-word").innerHTML = current.acrossWord;
  document.getElementById("down-word").innerHTML = current.downWord;
  // console.log("Across:", current.acrossWord, "Down:", current.downWord);
  // console.log(current.acrossWord.split(DASH).join("*"));
}

function getWordAt(row, col, direction, setCurrentWordIndices) {
  let text = "";
  let [start, end] = [0, 0];
  if (direction == ACROSS) {
    text = xw.fill[row];
  } else {
    for (let i = 0; i < xw.rows; i++) {
      text += xw.fill[i][col];
    }
  }
  text = text.split(BLANK).join(DASH);
  [start, end] = getWordIndices(text, (direction == ACROSS) ? col : row);
  // Set global word indices if needed
  if (setCurrentWordIndices) {
    if (direction == ACROSS) {
      [current.acrossStartIndex, current.acrossEndIndex] = [start, end];
    } else {
      [current.downStartIndex, current.downEndIndex] = [start, end];
    }
  }
  return text.slice(start, end);
}

function getWordIndices(text, position) {
  let start = text.slice(0, position).lastIndexOf(BLACK);
  start = (start == -1) ? 0 : start + 1;
  let end = text.slice(position, DEFAULT_SIZE).indexOf(BLACK);
  end = (end == -1) ? DEFAULT_SIZE : Number(position) + end;
  return [start, end];
}

function updateGridHighlights() {
  // Clear the grid of any highlights
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const square = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (square.className.search("highlight") > -1) {
        square.className = square.className.replace("highlight", "").trim();
      }
      if (square.className.search("lowlight") > -1) {
        square.className = square.className.replace("lowlight", "").trim();
      }
    }
  }

  // Highlight across squares
  for (let j = current.acrossStartIndex; j < current.acrossEndIndex; j++) {
    const square = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + j + '"]');
    if (j != current.col) {
      square.className += (current.direction == ACROSS) ? " highlight" : " lowlight";
      square.className = square.className.trim();
    }
  }

  // Highlight down squares
  for (let i = current.downStartIndex; i < current.downEndIndex; i++) {
    const square = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + current.col + '"]');
    if (i != current.row) {
      square.className += (current.direction == DOWN) ? " highlight" : " lowlight";
      square.className = square.className.trim();
    }
  }
}

function updateSidebarHighlights() {
  let acrossHeading = document.getElementById("across-heading");
  let downHeading = document.getElementById("down-heading");
  const currentCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');

  if (acrossHeading.className.search("highlight") > -1) {
    acrossHeading.className = acrossHeading.className.replace("highlight", "").trim();
  }
  if (downHeading.className.search("highlight") > -1) {
    downHeading.className = downHeading.className.replace("highlight", "").trim();
  }

  if (currentCell.className.search("black") == -1) {
    if (current.direction == ACROSS) {
      acrossHeading.className += " highlight";
    } else {
      downHeading.className += " highlight";
    }
  }
}

function setClues() {
    xw.clues[[current.row, current.acrossStartIndex, ACROSS]] = document.getElementById("across-clue-text").innerHTML;
    xw.clues[[current.downStartIndex, current.col, DOWN]] = document.getElementById("down-clue-text").innerHTML;
    // console.log("Stored clue:", xw.clues[[current.row, current.acrossStartIndex, ACROSS]], "at [" + current.row + "," + current.acrossStartIndex + "]");
    // console.log("Stored clue:", xw.clues[[current.downStartIndex, current.col, DOWN]], "at [" + current.downStartIndex + "," + current.col + "]");
}

function setTitle() {
  xw.title = document.getElementById("puzzle-title").innerHTML;
}

function setAuthor() {
  xw.author = document.getElementById("puzzle-author").innerHTML;
}

function suppressEnterKey(e) {
  if (e.which == keyboard.enter) {
    e.preventDefault();
    // console.log("Enter key behavior suppressed.");
  }
}

function loadPatterns(url) {
  let p = [];
  let pF = new XMLHttpRequest();
  pF.open("GET", url, true);
  pF.onreadystatechange = function() {
    if (pF.readyState === 4 && pF.status === 200) {  // Makes sure the document is ready to parse, and it's found the file.
      p = JSON.parse(pF.responseText);
      console.log(p, "Loaded standard patterns.");
      // console.log(gridPatterns[0]);
    }
    console.log(p);
  }
  pF.send(null);
  return p;
}

function generatePattern() {
  let title = xw.title;
  let author = xw.author;
  createNewPuzzle();
  xw.title = title;
  xw.author = author;
  // "Delete" active square before applying pattern to prevent 2 active squares
  const activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  activeCell.className = activeCell.className.replace("active", "").trim();

  const pattern = patterns[randomNumber(0, patterns.length)]; // select random pattern
  if (!isSymmetrical) {
    toggleSymmetry();
  }
  for (let i = 0; i < pattern.length; i++) {
    [current.row, current.col] = pattern[i];
    let e = new Event('keydown');
    e.which = keyboard.black;
    keyboardHandler(e);
  }
  console.log("Generated layout.")
}

function toggleSymmetry() {
  isSymmetrical = (isSymmetrical) ? false : true;

  // Update UI button
  let symButton = document.getElementById("toggle-symmetry");
  if (symButton.getAttribute("data-state") == "on") {
    symButton.setAttribute("data-state", "off");
    symButton.className = symButton.className.replace("button-on", "");
    symButton.setAttribute("data-tooltip", "Turn on symmetry");
  } else {
    symButton.setAttribute("data-state", "on");
    symButton.className += " button-on";
    symButton.className = symButton.className.trim();
    symButton.setAttribute("data-tooltip", "Turn off symmetry");
  }
}

function toggleHelp() {
  document.getElementById("help").style.display = "none";
}

function clearFill() {
  for (let i = 0; i < xw.rows; i++) {
    xw.fill[i] = xw.fill[i].replace(/\w/g, ' '); // replace any letters with spaces
    for (let j = 0; j < xw.cols; j++) {
      const currentCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (currentCell.className.search("black") == -1) {
        currentCell.lastChild.innerHTML = BLANK;
      }
    }
  }
  isMutated = true;
  updateUI();
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function randomLetter() {
  let alphabet = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSSSTTTTTTUUUUVVWWXYYZ";
  let random = randomNumber(0, 100);
  return alphabet.substring(random, random + 1);
}
