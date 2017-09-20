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
const SIZE = 15;

let clues = {};

createGrid(SIZE);

let isSymmetrical = true;
let current = {
  row:        0,
  col:        0,
  acrossWord: '',
  downWord:   '',
  acrossStartIndex:0,
  acrossEndIndex:  SIZE,
  downStartIndex:  0,
  downEndIndex:    SIZE,
  direction:  ACROSS
};

const grid = document.getElementById("grid");
const squares = grid.querySelectorAll('td');

updateActiveWords();
updateGridHighlights();
updateCluesUI();

for (const square of squares) {
  square.addEventListener('click', mouseHandler);
}
grid.addEventListener('keydown', keyboardHandler);

//____________________
// F U N C T I O N S

function mouseHandler() {
  const previousCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  previousCell.className = previousCell.className.replace("active", "");
  const activeCell = event.currentTarget;
  if (activeCell == previousCell) {
    current.direction = (current.direction == ACROSS) ? DOWN : ACROSS;
  }
  current.row = activeCell.parentNode.dataset.row;
  current.col = activeCell.dataset.col;
  console.log("[" + current.row + "," + current.col + "]");
  activeCell.className += " active";
  activeCell.className.trim();

  updateUI();
}

function keyboardHandler(e) {
  let activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  const symRow = SIZE - 1 - current.row;
  const symCol = SIZE - 1 - current.col;
  const symmetricalCell = grid.querySelector('[data-row="' + symRow + '"]').querySelector('[data-col="' + symCol + '"]');

  if ((e.which >= keyboard.a && e.which <= keyboard.z) || e.which == keyboard.space) {
      activeCell.lastChild.innerHTML = String.fromCharCode(e.which);
      if (activeCell.className.search("black") > -1) {
        activeCell.className = activeCell.className.replace("black", "").trim();
        if (isSymmetrical == true) {
          symmetricalCell.lastChild.innerHTML = BLANK;
          symmetricalCell.className = symmetricalCell.className.replace("black", "").trim();
        }
      }
      // move the cursor
      e = new Event('keydown');
      if (current.direction == ACROSS) {
        e.which = keyboard.right;
      } else {
        e.which = keyboard.down;
      }
      keyboardHandler(e);
  } else if (e.which == keyboard.black) {
      activeCell.lastChild.innerHTML = BLACK;
      activeCell.className += " black";
      activeCell.className.trim();
      if (isSymmetrical == true) {
        symmetricalCell.lastChild.innerHTML = BLACK;
        symmetricalCell.className += " black";
        symmetricalCell.className.trim();
      }
  } else if (e.which == keyboard.enter) {
      current.direction = (current.direction == ACROSS) ? DOWN : ACROSS;
  } else if (e.which == keyboard.delete) {
      activeCell.lastChild.innerHTML = BLANK;
      if (activeCell.className.search("black") > -1) {
        activeCell.className = activeCell.className.replace("black", "").trim();
        if (isSymmetrical == true) {
          symmetricalCell.lastChild.innerHTML = BLANK;
          symmetricalCell.className = symmetricalCell.className.replace("black", "").trim();
        }
      }
      // move the cursor
      e = new Event('keydown');
      if (current.direction == ACROSS) {
        e.which = keyboard.left;
      } else {
        e.which = keyboard.up;
      }
      keyboardHandler(e);
  } else if (e.which >= keyboard.left && e.which <= keyboard.down) {
      const previousCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
      previousCell.className = previousCell.className.replace("active", "");
      switch (e.which) {
        case keyboard.left:
          if (current.direction == ACROSS) {
            current.col = (current.col == 0) ? current.col : current.col - 1;
          } else {
            current.direction = ACROSS;
          }
          break;
        case keyboard.up:
          if (current.direction == DOWN) {
            current.row = (current.row == 0) ? current.row : current.row - 1;
          } else {
            current.direction = DOWN;
          }
          break;
        case keyboard.right:
          if (current.direction == ACROSS) {
            current.col = (current.col == SIZE - 1) ? current.col : Number(current.col) + 1;
          } else {
            current.direction = ACROSS;
          }
          break;
        case keyboard.down:
          if (current.direction == DOWN) {
            current.row = (current.row == SIZE - 1) ? current.row : Number(current.row) + 1;
          } else {
            current.direction = DOWN;
          }
          break;
      }
      console.log("[" + current.row + "," + current.col + "]");
      // console.log(current.direction);
      activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
      activeCell.className = (activeCell.className + " active").trim();
  }
  // console.log(activeCell.lastChild.innerHTML);
  updateUI();
}

function updateUI() {
  updateLabelsAndClues();
  updateActiveWords();
  updateGridHighlights();
  updateMatchesUI();
  updateCluesUI();
}

function updateCluesUI() {
  let acrossClueNumber = document.getElementById("across-clue-number");
  let downClueNumber = document.getElementById("down-clue-number");
  let acrossClueText = document.getElementById("across-clue-text");
  let downClueText = document.getElementById("down-clue-text");
  const currentCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');

  // If the current cell is black, empty clues and get out
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
  acrossClueText.innerHTML = clues[[current.row, current.acrossStartIndex, ACROSS]];
  downClueText.innerHTML = clues[[current.downStartIndex, current.col, DOWN]];
}

function createGrid(size) {
  const rows = size;
  const cols = size;
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
        let fillContent = document.createTextNode(BLANK);

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
  const rows = SIZE;
  const cols = SIZE;
  const grid = document.getElementById("grid");

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let isAcross = false;
      let isDown = false;
      increment = false;
      // if the cell isn't 'black'
      let currentCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (currentCell.className.search("black") == -1) {
        // if the row is 0, increment the clue number
        if (i == 0) {
          increment = true;
          isDown = true;
        // else if the square above me is black, increment
        } else {
          const upCell = grid.querySelector('[data-row="' + (i - 1) + '"]').querySelector('[data-col="' + j + '"]');
          if (upCell.className.search("black") > -1) {
            increment = true;
            isDown = true;
          }
        }
        // if the column is 0, increment
        if (j == 0) {
          increment = true;
          isAcross = true;
        // else if the square to my left is black, increment
        } else {
          const leftCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + (j - 1) + '"]');
          if (leftCell.className.search("black") > -1) {
            increment = true;
            isAcross = true;
          }
        }
      }
      if (increment == true) {
        currentCell.firstChild.innerHTML = count; // Set square's label to the count
        count++;
        increment = false;

        if (isAcross) {
          clues[[i, j, ACROSS]] = clues[[i, j, ACROSS]] || "(blank clue)";
        }
        if (isDown) {
          clues[[i, j, DOWN]] = clues[[i, j, DOWN]] || "(blank clue)";
        }
      } else {
        currentCell.firstChild.innerHTML = "";
        clues[[i, j, ACROSS]] = undefined;
        clues[[i, j, DOWN]] = undefined;
      }
    }
  }
}

function updateActiveWords() {

  const activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  if (activeCell.lastChild.innerHTML == BLACK) {
    current.acrossWord = '';
    current.downWord = '';
    current.acrossStartIndex = null;
    current.acrossEndIndex = null;
    current.downStartIndex = null;
    current.downEndIndex = null;
  } else {
    // Across
    let rowText = '';
    for (let i = 0; i < SIZE; i++) {
      let nextAcrossLetter = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + i + '"]').lastChild.innerHTML;
      nextAcrossLetter = (nextAcrossLetter == BLANK) ? DASH : nextAcrossLetter;
      rowText += nextAcrossLetter;
    }
    [current.acrossStartIndex, current.acrossEndIndex] = getWordIndices(rowText, current.col);
    current.acrossWord = rowText.slice(current.acrossStartIndex, current.acrossEndIndex);

    // Down
    let colText = '';
    for (let j = 0; j < SIZE; j++) {
      let nextDownLetter = grid.querySelector('[data-row="' + j + '"]').querySelector('[data-col="' + current.col + '"]').lastChild.innerHTML;
      nextDownLetter = (nextDownLetter == BLANK) ? DASH : nextDownLetter;
      colText += nextDownLetter;
    }
    [current.downStartIndex, current.downEndIndex] = getWordIndices(colText, current.row);
    current.downWord = colText.slice(current.downStartIndex, current.downEndIndex);
  }
  document.getElementById("across-word").innerHTML = current.acrossWord;
  document.getElementById("down-word").innerHTML = current.downWord;
  console.log("Across:", current.acrossWord, "Down:", current.downWord);
  // console.log(current.acrossWord.split(DASH).join("*"));
}

function getWordIndices(text, position) {
  let startIndex = text.slice(0, position).lastIndexOf(BLACK);
  startIndex = (startIndex == -1) ? 0 : startIndex + 1;
  let endIndex = text.slice(position, SIZE).indexOf(BLACK);
  endIndex = (endIndex == -1) ? SIZE : Number(position) + Number(endIndex);
  return [startIndex, endIndex];
}

function updateGridHighlights() {
  const rows = SIZE;
  const cols = SIZE;
  // Clear the grid of any highlights
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const square = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (square.className.search("highlight") > -1) {
        square.className = square.className.replace("highlight", "").trim();
      }
      if (square.className.search("lowlight") > -1) {
        square.className = square.className.replace("lowlight", "").trim();
      }
    }
  }

  // Highlight across
  for (let i = current.acrossStartIndex; i < current.acrossEndIndex; i++) {
    const square = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + i + '"]');
    if (i != current.col) {
      square.className += (current.direction == ACROSS) ? " highlight" : " lowlight";
      square.className.trim();
    }
  }
  // Highlight down
  for (let j = current.downStartIndex; j < current.downEndIndex; j++) {
    const square = grid.querySelector('[data-row="' + j + '"]').querySelector('[data-col="' + current.col + '"]');
    if (j != current.row) {
      square.className += (current.direction == DOWN) ? " highlight" : " lowlight";
      square.className.trim();
    }
  }
}

function generateLayout() {
  gridPatterns = [
    [
      [0,4], [1,4], [2,4], [12,4], [13,4], [14,4],
      [4,0], [4,1], [4,2], [4,12], [4,13], [4,14],
      [8,3], [7,4], [6,5], [5,6], [4,7], [3,8]
    ],
    [
      [0,5], [1,5], [2,5], [12,4], [13,4], [14,4],
      [5,0], [5,1], [5,2], [4,3], [3,13], [3,14],
      [5,6], [4,7], [4,8], [6,9], [7,10], [5,11]
    ]
  ];

  // "Delete" active square before applying pattern to prevent 2 active squares
  const activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  activeCell.className = activeCell.className.replace("active", "").trim();

  const pattern = gridPatterns[randomNumber(0, gridPatterns.length)]; // select random pattern
  isSymmetrical = true;
  for (let i = 0; i < pattern.length; i++) {
    [current.row, current.col] = pattern[i];
    let e = new Event('keydown');
    e.which = keyboard.black;
    keyboardHandler(e);
  }
  console.log("Quick layout.")
}

function toggleSymmetry() {
  isSymmetrical = (isSymmetrical) ? false : true;
}

function clearFill() {
  const rows = SIZE;
  const cols = SIZE;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const currentCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (currentCell.className.search("black") == -1) {
        currentCell.lastChild.innerHTML = BLANK;
      }
    }
  }
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function randomLetter() {
  let alphabet = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSSSTTTTTTUUUUVVWWXYYZ";
  let random = randomNumber(0, 100);
  return alphabet.substring(random, random + 1);
}

// window.alert("This is how you create an alert.")
// document.write("This is how you write to the HTML document.")
