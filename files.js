function openPuzzle() {
  document.getElementById("open-puzzle-input").click();
}

function openJSONFile(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  let reader = new FileReader();
  reader.onload = function(e) {
    try {
      const puz = JSON.parse(e.target.result);
      convertJSONToPuzzle(puz);
      console.log("Loaded", puz.title, "by", puz.author);
    }
    catch(err) {
      if (err.name == "SyntaxError") {
        window.alert("Invalid puzzle file.");
        return;
      }
    }
  };
  reader.readAsText(file);
}

function convertJSONToPuzzle(puz) {
  createNewPuzzle();
  console.log("Created new puzzle");

  if (puz.size.rows != DEFAULT_SIZE || puz.size.cols != DEFAULT_SIZE) {
    console.log("Oops. Can only open 15 x 15 puzzles.");
    return;
  }
  xw.rows = DEFAULT_SIZE;
  xw.cols = DEFAULT_SIZE;

  // Display puzzle title, author
  xw.title = puz.title;
  if (puz.title.slice(0,8) == "NY TIMES") {
    xw.title = "NYT Crossword";
  }
  xw.author = puz.author;

  // Display fill in grid
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const activeCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');

      const k = (i * xw.rows) + j;
      const cellFill = (puz.grid[k].length > 1) ? puz.grid[k][0] : puz.grid[k]; // Strip rebus answers to their first letter

      xw.fill[i] = xw.fill[i].slice(0, j) + cellFill.toUpperCase() + xw.fill[i].slice(j + 1);
      activeCell.lastChild.innerHTML = xw.fill[i][j];
      if (xw.fill[i][j] == BLACK) {
        activeCell.className += " black";
        activeCell.className.trim();
      }
    }
  }
  updateUI();

  // Load in clues and display current clues
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const activeCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (activeCell.firstChild.innerHTML) {
        const label = activeCell.firstChild.innerHTML + ".";
        for (let k = 0; k < puz.clues.across.length; k++) {
          if (label == puz.clues.across[k].slice(0, label.length)) {
            // clues[[i, j, ACROSS]] = puz.clues.across[k];
            xw.clues[[i, j, ACROSS]] = puz.clues.across[k].slice(label.length).trim();
          }
        }
        for (let l = 0; l < puz.clues.down.length; l++) {
          if (label == puz.clues.down[l].slice(0, label.length)) {
            // clues[[i, j, DOWN]] = puz.clues.down[l];
            xw.clues[[i, j, DOWN]] = puz.clues.down[l].slice(label.length).trim();
          }
        }
      }
    }
  }
  updateUI();
}

function writeJSONFile() {
  let filename = xw.title + ".xw";
  let file = new File([convertPuzzleToJSON()], filename);
  let puzzleURL = window.URL.createObjectURL(file);

  let puzzleLink = document.getElementById("download-puzzle-link");
  puzzleLink.setAttribute("href", puzzleURL);
  puzzleLink.setAttribute("download", filename);
  puzzleLink.click();
}

function convertPuzzleToJSON() {
  let puz = {};
  puz["author"] = xw.author;
  puz["title"] = xw.title;
  puz["size"] = {
    "rows": xw.rows,
    "cols": xw.cols
  };
  // Translate clues to standard JSON puzzle format
  puz["clues"] = {
    "across": [],
    "down": []
  };
  for (const key in xw.clues) {
    const location = key.split(",");
    const label = grid.querySelector('[data-row="' + location[0] + '"]').querySelector('[data-col="' + location[1] + '"]').firstChild.innerHTML;
    if (label) {
      if (location[2] == ACROSS) {
        puz.clues.across.push(label + ". " + xw.clues[location]);
      } else {
        puz.clues.down.push(label + ". " + xw.clues[location]);
      }
    }
  }
  // Read grid
  puz["grid"] = [];
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const square = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      puz.grid.push(square.lastChild.innerHTML);
    }
  }

  return JSON.stringify(puz);  // Convert JS object to JSON text
}

function printPDF() {
  let doc = new jsPDF('p', 'pt');

  const pageOrigin = { "x": 50, "y": 50 };
  const gridOrigin = { "x": pageOrigin.x, "y": pageOrigin.y };
  const labelOffset = { "x": 1, "y": 3 };
  const fillOffset = { "x": 20, "y": 20 };
  const squareSize = 24;
  const innerLineWidth = .5;
  const outerLineWidth = 2;

  doc.setFont("helvetica");
  doc.setFontType("normal");

  // doc.setTextColor(255, 0, 0);
  // doc.text(xw.title, 20, 20);

  // Draw grid
  doc.setDrawColor(0);
  doc.setLineWidth(outerLineWidth);
  doc.rect(gridOrigin.x, gridOrigin.y, xw.rows * squareSize, xw.cols * squareSize, 'D');

  doc.setLineWidth(innerLineWidth);
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const square = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      doc.setFillColor(square.className.search("black") > -1 ? 0 : 255);
      doc.rect(gridOrigin.x + (j * squareSize), gridOrigin.y + (i * squareSize), squareSize, squareSize, 'FD');
    }
  }

  // Make PDF
  doc.save(xw.title + ".pdf");
}

function pdf_drawGridAt(x, y) {
}

document.getElementById('open-puzzle-input').addEventListener('change', openJSONFile, false);
document.getElementById('open-wordlist-input').addEventListener('change', openWordlistFile, false);
