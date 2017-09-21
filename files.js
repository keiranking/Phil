function openJSONFile(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    const puzzle = JSON.parse(e.target.result);
    console.log("Loaded", puzzle.title, "by", puzzle.author);
    displayJSONPuzzle(puzzle);
  };
  reader.readAsText(file);
}

function displayJSONPuzzle(puz) {

  if (puz.size.rows != SIZE || puz.size.cols != SIZE) {
    console.log("Oops. JSON puzzle is the wrong size.");
    return;
  }
  const rows = SIZE;
  const cols = SIZE;

  // Display puzzle title, author
  document.getElementById("puzzle-title").innerHTML = puz.title;
  if (puz.title.slice(0,8) == "NY TIMES") {
    document.getElementById("puzzle-title").innerHTML = "NYT Crossword";
  }

  document.getElementById("puzzle-author").innerHTML = puz.author;

  // Display fill in grid
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const activeCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');

      const k = (i * rows) + j;
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
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const activeCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (activeCell.firstChild.innerHTML) {
        const label = activeCell.firstChild.innerHTML + ".";
        for (let k = 0; k < puz.clues.across.length; k++) {
          if (label == puz.clues.across[k].slice(0, label.length)) {
            // clues[[i, j, ACROSS]] = puz.clues.across[k];
            clues[[i, j, ACROSS]] = puz.clues.across[k].slice(label.length).trim();
          }
        }
        for (let l = 0; l < puz.clues.down.length; l++) {
          if (label == puz.clues.down[l].slice(0, label.length)) {
            // clues[[i, j, DOWN]] = puz.clues.down[l];
            clues[[i, j, DOWN]] = puz.clues.down[l].slice(label.length).trim();
          }
        }
      }
    }
  }

  updateUI();
}

document.getElementById('file-input').addEventListener('change', openJSONFile, false);
