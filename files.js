function openFile() {
  document.getElementById("file-input").click();
}

function openJSONFile(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    const puz = JSON.parse(e.target.result);
    console.log("Loaded", puz.title, "by", puz.author);
    convertJSONToPuzzle(puz);
  };
  reader.readAsText(file);
}

function convertJSONToPuzzle(puz) {
  createNewPuzzle();

  if (puz.size.rows != SIZE || puz.size.cols != SIZE) {
    console.log("Oops. JSON puzzle is the wrong size.");
    return;
  }
  xw.rows = SIZE;
  xw.cols = SIZE;

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
      const fill = (puz.grid[k].length > 1) ? puz.grid[k][0] : puz.grid[k];

      activeCell.lastChild.innerHTML = fill.toUpperCase();
      if (fill == BLACK) {
        activeCell.className += " black";
        activeCell.className.trim();
      }
    }
  }
  // console.log(puz.clues.across, puz.clues.down)
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
  console.log(convertPuzzleToJSON());
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

document.getElementById('file-input').addEventListener('change', openJSONFile, false);
