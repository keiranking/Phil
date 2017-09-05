const keyboard = {
  "a":      65,
  "z":      90,
  "black":  190,
  "delete": 8,
  "left":   37,
  "up":     38,
  "right":  39,
  "down":   40
};
const dir = {
  across: "across",
  down: "down"
};
const crosswordSize = 15;
createGrid(crosswordSize);

var isSymmetrical = true;
var activeRow = 0;
var activeCol = 0;
var lastDirection = dir.across;
const grid = document.getElementById("grid");
const squares = grid.querySelectorAll('td');

for (const square of squares) {
  square.addEventListener('click', mouseHandler);
}
window.addEventListener('keydown', keyboardHandler);

//____________________
// F U N C T I O N S

function mouseHandler() {
  const previousCell = grid.querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]');
  // console.log("Previous cursor: [" + previousCell.parentNode.dataset.row + "," + previousCell.dataset.col + "]");
  previousCell.className = previousCell.className.replace("active", "");
  const activeCell = event.currentTarget;
  activeRow = activeCell.parentNode.dataset.row;
  activeCol = activeCell.dataset.col;
  console.log("[" + activeRow + "," + activeCol + "]");
  activeCell.className = (activeCell.className + " active").trim();
}

function keyboardHandler(e) {
  var activeCell = grid.querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]');
  const symRow = crosswordSize - 1 - activeRow;
  const symCol = crosswordSize - 1 - activeCol;
  const symmetricalCell = grid.querySelector('[data-row="' + symRow + '"]').querySelector('[data-col="' + symCol + '"]');

  // If the input is different from what's already in the square...
  // if (activeCell.lastChild.innerHTML != String.fromCharCode(e.which)) {
    if (e.which >= keyboard.a && e.which <= keyboard.z) {
        activeCell.lastChild.innerHTML = String.fromCharCode(e.which);
        if (activeCell.className.search("black") > -1) {
          activeCell.className = activeCell.className.replace("black", "").trim();
          if (isSymmetrical == true) {
            symmetricalCell.lastChild.innerHTML = null;
            symmetricalCell.className = symmetricalCell.className.replace("black", "").trim();
          }
        }
        e = new Event('keydown');
        if (lastDirection == dir.across) {
          e.which = keyboard.right;
        } else {
          e.which = keyboard.down;
        }
        keyboardHandler(e);
    } else if (e.which == keyboard.black) {
        activeCell.lastChild.innerHTML = ".";
        activeCell.className = (activeCell.className + " black").trim();
        if (isSymmetrical == true) {
          symmetricalCell.lastChild.innerHTML = ".";
          symmetricalCell.className = (symmetricalCell.className + " black").trim();
        }
    } else if (e.which == keyboard.delete) {
        activeCell.lastChild.innerHTML = null;
        if (activeCell.className.search("black") > -1) {
          activeCell.className = activeCell.className.replace("black", "").trim();
          if (isSymmetrical == true) {
            symmetricalCell.lastChild.innerHTML = null;
            symmetricalCell.className = symmetricalCell.className.replace("black", "").trim();
          }
        }
        e = new Event('keydown');
        if (lastDirection == dir.across) {
          e.which = keyboard.left;
        } else {
          e.which = keyboard.up;
        }
        keyboardHandler(e);
    } else if (e.which >= keyboard.left && e.which <= keyboard.down) {
        const previousCell = grid.querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]');
        previousCell.className = previousCell.className.replace("active", "");
        switch (e.which) {
          case keyboard.left:
            activeCol = (activeCol == 0) ? activeCol : activeCol - 1;
            lastDirection = dir.across;
            break;
          case keyboard.up:
            activeRow = (activeRow == 0) ? activeRow : activeRow - 1;
            lastDirection = dir.down;
            break;
          case keyboard.right:
            activeCol = (activeCol == crosswordSize - 1) ? activeCol : Number(activeCol) + 1;
            lastDirection = dir.across;
            break;
          case keyboard.down:
            activeRow = (activeRow == crosswordSize - 1) ? activeRow : Number(activeRow) + 1;
            lastDirection = dir.down;
            break;
        }
        console.log("[" + activeRow + "," + activeCol + "]");
        // console.log(lastDirection);
        activeCell = grid.querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]');
        activeCell.className = (activeCell.className + " active").trim();
    }
    console.log(activeCell.lastChild.innerHTML);
    updateLabels(crosswordSize);
  // }
}

function createGrid(size) {
  const rows = size;
  const cols = size;
  var table = document.createElement("TABLE");
  table.setAttribute("id", "grid");
  document.body.appendChild(table);

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
  updateLabels(size);
}

function updateLabels(size) {
  var count = 1;
  var increment = false;
  const rows = size;
  const cols = size;
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

function pressVirtualKey(key) {
  var e = new Event('keydown');
  e.keyCode = key;
  document.dispatchEvent(e);
  console.log("dispatched key event..." + e.keyCode);
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
