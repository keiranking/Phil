const keyboard = {
  "a":      65,
  "z":      90,
  "black":  190,
  "delete": 8,
  "space":  32,
  "left":   37,
  "up":     38,
  "right":  39,
  "down":   40
};

const BLACK = ".";
const BLANK = "-";
const ACROSS = "across";
const DOWN = "down";
const SIZE = 15;

createGrid(SIZE);
// createUI();

var isSymmetrical = true;
var current = {
  row:        0,
  col:        0,
  acrossWord: '',
  downWord:   '',
  acrossStartIndex:0,
  acrossEndIndex:  0,
  downStartIndex:  0,
  downEndIndex:    0,
  direction:  ACROSS
};

const grid = document.getElementById("grid");
const squares = grid.querySelectorAll('td');

updateActiveWords();

for (const square of squares) {
  square.addEventListener('click', mouseHandler);
}
window.addEventListener('keydown', keyboardHandler);

//____________________
// F U N C T I O N S

function mouseHandler() {
  const previousCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  // console.log("Previous cursor: [" + previousCell.parentNode.dataset.row + "," + previousCell.dataset.col + "]");
  previousCell.className = previousCell.className.replace("active", "");
  const activeCell = event.currentTarget;
  current.row = activeCell.parentNode.dataset.row;
  current.col = activeCell.dataset.col;
  console.log("[" + current.row + "," + current.col + "]");
  activeCell.className += " active";
  activeCell.className.trim();

  updateActiveWords();
  updateActiveWordsUI();
}

function keyboardHandler(e) {
  var activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
  const symRow = SIZE - 1 - current.row;
  const symCol = SIZE - 1 - current.col;
  const symmetricalCell = grid.querySelector('[data-row="' + symRow + '"]').querySelector('[data-col="' + symCol + '"]');

  // If the input is different from what's already in the square...
  // if (activeCell.lastChild.innerHTML != String.fromCharCode(e.which)) {
    if ((e.which >= keyboard.a && e.which <= keyboard.z) || e.which == keyboard.space) {
        activeCell.lastChild.innerHTML = String.fromCharCode(e.which);
        if (activeCell.className.search("black") > -1) {
          activeCell.className = activeCell.className.replace("black", "").trim();
          if (isSymmetrical == true) {
            symmetricalCell.lastChild.innerHTML = " ";
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
    } else if (e.which == keyboard.delete) {
        activeCell.lastChild.innerHTML = " ";
        if (activeCell.className.search("black") > -1) {
          activeCell.className = activeCell.className.replace("black", "").trim();
          if (isSymmetrical == true) {
            symmetricalCell.lastChild.innerHTML = " ";
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
            current.col = (current.col == 0) ? current.col : current.col - 1;
            current.direction = ACROSS;
            break;
          case keyboard.up:
            current.row = (current.row == 0) ? current.row : current.row - 1;
            current.direction = DOWN;
            break;
          case keyboard.right:
            current.col = (current.col == SIZE - 1) ? current.col : Number(current.col) + 1;
            current.direction = ACROSS;
            break;
          case keyboard.down:
            current.row = (current.row == SIZE - 1) ? current.row : Number(current.row) + 1;
            current.direction = DOWN;
            break;
        }
        console.log("[" + current.row + "," + current.col + "]");
        // console.log(current.direction);
        activeCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');
        activeCell.className = (activeCell.className + " active").trim();
    }
    console.log(activeCell.lastChild.innerHTML);
    updateLabels();
    updateActiveWords();
    updateActiveWordsUI();
  // }
}

function createGrid(size) {
  const rows = size;
  const cols = size;
  var table = document.createElement("TABLE");
  table.setAttribute("id", "grid");
  document.getElementById("main").appendChild(table);

	for (var i = 0; i < rows; i++) {
    	var row = document.createElement("TR");
    	row.setAttribute("data-row", i);
    	document.getElementById("grid").appendChild(row);

		for (var j = 0; j < cols; j++) {
		    var col = document.createElement("TD");
        col.setAttribute("data-col", j);

        var label = document.createElement("DIV");
        label.setAttribute("class", "label");
        var labelContent = document.createTextNode("");

        var fill = document.createElement("DIV");
        fill.setAttribute("class", "fill");
        var fillContent = document.createTextNode(randomLetter());

    		// var t = document.createTextNode("[" + i + "," + j + "]");
        label.appendChild(labelContent);
        fill.appendChild(fillContent);
        col.appendChild(label);
        col.appendChild(fill);
    		document.querySelector('[data-row="' + i + '"]').appendChild(col);
      }
  }
  updateLabels();
}

function updateLabels() {
  var count = 1;
  var increment = false;
  const rows = SIZE;
  const cols = SIZE;
  const grid = document.getElementById("grid");

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      increment = false;
      // if the cell isn't 'black'
      var currentCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (currentCell.className.search("black") == -1) {
        // if the row is 0, increment the clue number
        if (i == 0) {
          increment = true;
        // else if the square above me is black, increment
        } else {
          upCell = grid.querySelector('[data-row="' + (i - 1) + '"]').querySelector('[data-col="' + j + '"]');
          if (upCell.className.search("black") > -1) {
            increment = true;
          }
        }
        // if the column is 0, increment
        if (j == 0) {
          increment = true;
        // else if the square to my left is black, increment
        } else {
          leftCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + (j - 1) + '"]');
          if (leftCell.className.search("black") > -1) {
            increment = true;
          }
        }
      }
      if (increment == true) {
        currentCell.firstChild.innerHTML = count;
        count++;
        increment = false;
      } else {
        currentCell.firstChild.innerHTML = "";
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
    var rowText = '';
    for (var i = 0; i < SIZE; i++) {
      var nextAcrossLetter = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + i + '"]').lastChild.innerHTML;
      nextAcrossLetter = (nextAcrossLetter == " ") ? "-" : nextAcrossLetter;
      rowText += nextAcrossLetter;
    }
    [current.acrossStartIndex, current.acrossEndIndex] = getWordIndices(rowText, current.col);
    current.acrossWord = rowText.slice(current.acrossStartIndex, current.acrossEndIndex);

    // Down
    var colText = '';
    for (var j = 0; j < SIZE; j++) {
      var nextDownLetter = grid.querySelector('[data-row="' + j + '"]').querySelector('[data-col="' + current.col + '"]').lastChild.innerHTML;
      nextDownLetter = (nextDownLetter == " ") ? "-" : nextDownLetter;
      colText += nextDownLetter;
    }
    [current.downStartIndex, current.downEndIndex] = getWordIndices(colText, current.row);
    current.downWord = colText.slice(current.downStartIndex, current.downEndIndex);
  }
  document.getElementById("across-word").innerHTML = current.acrossWord;
  document.getElementById("down-word").innerHTML = current.downWord;
  console.log("Across:", current.acrossWord, "Down:", current.downWord);
  // console.log(current.acrossWord.split("-").join("*"));
}

function getWordIndices(text, position) {
  var startIndex = text.slice(0, position).lastIndexOf(BLACK);
  startIndex = (startIndex == -1) ? 0 : startIndex + 1;
  var endIndex = text.slice(position, SIZE).indexOf(BLACK);
  endIndex = (endIndex == -1) ? SIZE : Number(position) + Number(endIndex);
  return [startIndex, endIndex];
}

function updateActiveWordsUI() {
  // Clear the grid of any highlights
  for (var i = 0; i < SIZE; i++) {
    for (var j = 0; j < SIZE; j++) {
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
  for (var i = current.acrossStartIndex; i < current.acrossEndIndex; i++) {
    const square = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + i + '"]');
    if (i != current.col) {
      square.className += (current.direction == ACROSS) ? " highlight" : " lowlight";
      square.className.trim();
    }
  }
  // Highlight down
  for (var j = current.downStartIndex; j < current.downEndIndex; j++) {
    const square = grid.querySelector('[data-row="' + j + '"]').querySelector('[data-col="' + current.col + '"]');
    if (j != current.row) {
      square.className += (current.direction == DOWN) ? " highlight" : " lowlight";
      square.className.trim();
    }
  }
}

function generateLayout() {
  locations = [
    [0,4], [1,4], [2,4], [12,4], [13,4], [14,4],
    [4,0], [4,1], [4,2], [4,12], [4,13], [4,14],
    [8,3], [7,4], [6,5], [5,6], [4,7], [3,8],
  ];

  isSymmetrical = true;
  for (var i = 0; i < locations.length; i++) {
    [current.row, current.col] = locations[i];
    // var e = new Event('click');
    // mouseHandler(e);
    var e = new Event('keydown');
    e.which = keyboard.black;
    keyboardHandler(e);
  }
  console.log("Quick layout.")
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function randomLetter() {
  var alphabet = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSSSTTTTTTUUUUVVWWXYYZ";
  var random = randomNumber(0, 100);
  return alphabet.substring(random, random + 1);
}

// window.alert("This is how you create an alert.")
// document.write("This is how you write to the HTML document.")
