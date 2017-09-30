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
      puz.grid.push(xw.fill[i][j]);
    }
  }

  return JSON.stringify(puz);  // Convert JS object to JSON text
}

function printPDF() {
  let doc = new jsPDF('p', 'pt');
  let format = {
    "squareSize":     24,
    "pageOrigin":     { "x": 50, "y": 50 },
    "gridOrigin":     { "x": 50, "y": 50 },
    "labelOffset":    { "x": 1, "y": 6 },
    "fillOffset":     { "x": 12, "y": 17 },
    "labelFontSize":  7,
    "fillFontSize":   14,
    "innerLineWidth": .5,
    "outerLineWidth": 2
  };

  layoutPDFGrid(doc, format, true);
  doc.addPage();
  layoutPDFGrid(doc, format);
  doc.addPage();
  layoutPDFCluesForNYT(doc, format);

  doc.save(xw.title + ".pdf"); // Generate PDF and automatically download it
}

function layoutPDFGrid(doc, format, isFilled) {
  // Draw grid
  doc.setDrawColor(0);
  doc.setLineWidth(format.outerLineWidth);
  doc.rect(format.gridOrigin.x, format.gridOrigin.y,
           xw.rows * format.squareSize, xw.cols * format.squareSize, 'D');
  doc.setLineWidth(format.innerLineWidth);
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      doc.setFillColor(xw.fill[i][j] == BLACK ? 0 : 255);
      doc.rect(format.gridOrigin.x + (j * format.squareSize),
               format.gridOrigin.y + (i * format.squareSize), format.squareSize, format.squareSize, 'FD');
    }
  }
  // Label grid
  doc.setFont("helvetica");
  doc.setFontType("normal");
  doc.setFontSize(format.labelFontSize);
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const square = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      const label = square.firstChild.innerHTML;
      if (label) {
        doc.text(format.gridOrigin.x + (j * format.squareSize) + format.labelOffset.x,
                 format.gridOrigin.y + (i * format.squareSize) + format.labelOffset.y, label);
      }
    }
  }
  // Fill grid
  if (isFilled) {
    doc.setFontSize(format.fillFontSize);
    for (let i = 0; i < xw.rows; i++) {
      for (let j = 0; j < xw.cols; j++) {
        doc.text(format.gridOrigin.x + (j * format.squareSize) + format.fillOffset.x,
                 format.gridOrigin.y + (i * format.squareSize) + format.fillOffset.y,
                 xw.fill[i][j], null, null, "center");
      }
    }
  }
}

function layoutPDFClues(doc, format) {
  //
}

function layoutPDFCluesForNYT(doc, format) {
  // let data = [];
  // doc.autoTable(["","",""], data);
}

document.getElementById('open-puzzle-input').addEventListener('change', openJSONFile, false);
document.getElementById('open-wordlist-input').addEventListener('change', openWordlistFile, false);
