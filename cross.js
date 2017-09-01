const crosswordSize = 15;
createGrid(crosswordSize);

var activeRow = 0;
var activeCol = 0;

const squares = document.getElementById("grid").querySelectorAll('td');
for (const square of squares) {
  square.addEventListener('click', updateCursor);
}

// Handle all keyboard input
const grid = document.getElementById("grid");
window.addEventListener('keydown', function (e) {
  const activeCell = grid.querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]')
  if (activeCell.lastChild.innerHTML != String.fromCharCode(e.which)) {
    if (e.which >= 65 && e.which <= 90) {       // If user input is A-Z
        activeCell.lastChild.innerHTML = String.fromCharCode(e.which);
        activeCell.className = activeCell.className.replace("black", "").trim();
    } else if (e.which == 190) {
        activeCell.lastChild.innerHTML = ".";   // If user wants a black square
        activeCell.className = (activeCell.className + " black").trim();
    } else if (e.which == 8) {
        activeCell.lastChild.innerHTML = null;  // If user hits delete
        activeCell.className = activeCell.className.replace("black", "").trim();
    }
    console.log(activeCell.lastChild.innerHTML);
  }
});

function updateCursor() {
  const previousCell = document.getElementById("grid").querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]');
  // console.log("Previous cursor: [" + previousCell.parentNode.dataset.row + "," + previousCell.dataset.col + "]");
  previousCell.className = previousCell.className.replace("active", "");
  // previousCell.className = undefined;

  const activeCell = event.currentTarget;
  activeRow = activeCell.parentNode.dataset.row;
  activeCol = activeCell.dataset.col;
  console.log("[" + activeRow + "," + activeCol + "]");
  activeCell.className = (activeCell.className + " active").trim();
  updateLabels(crosswordSize);
}

function createGrid(size) {
  const rows = size;
  const cols = size;
  var table = document.createElement("TABLE");
  table.setAttribute("id", "grid");
  document.body.appendChild(table);

	for (i = 0; i < rows; i++) {
    	var row = document.createElement("TR");
    	row.setAttribute("data-row", i);
    	document.getElementById("grid").appendChild(row);

		for (j = 0; j < cols; j++) {
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

function randomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function randomLetter() {
  var alphabet = "AABCDEEEFGHIIJLMNOOPRSTUWY";
  var random = randomNumber(0, 25);
  return alphabet.substring(random, random + 1);
}

function updateLabels(size) {
  // set a counter to 1
  var count = 1;
  var increment = false;
  const rows = size;
  const cols = size;
  const grid = document.getElementById("grid");
  // for each row
  for (i = 0; i < rows; i++) {
    // for each column
    for (j = 0; j < cols; j++) {
      increment = false;
      // if the cell isn't 'black'
      var currentCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (currentCell.className.search("black") == -1) {
        // if the row is 0, increment
        if (i == 0) {
          increment = true;
        // else if the cell above me is black, increment
        } else {
          upCell = grid.querySelector('[data-row="' + (i - 1) + '"]').querySelector('[data-col="' + j + '"]');
          if (upCell.className.search("black") > -1) {
            increment = true;
          }
        }
        // if the column is 0, increment
        if (j == 0) {
          increment = true;
        // else if the cell to my left is black, increment
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

// window.alert("This is how you create an alert.")
// document.write("This is how you write to the HTML document.")
