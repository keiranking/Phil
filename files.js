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
  const rows = SIZE;
  const cols = SIZE;

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
  // clearFill();
  updateUI();
}

document.getElementById('file-input').addEventListener('change', openJSONFile, false);
