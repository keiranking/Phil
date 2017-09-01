var activeRow = 0;
var activeCol = 0;

const squares = document.getElementById("grid").querySelectorAll('td');
for (const square of squares) {
  square.addEventListener('click', updateCursor);
}

const grid = document.getElementById("grid");
window.addEventListener('keydown', function (e) {
  const activeCell = grid.querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]')
  if (activeCell.innerHTML != String.fromCharCode(e.which)) {
    if (e.which >= 65 && e.which <= 90) {
        activeCell.innerHTML = String.fromCharCode(e.which);
        activeCell.className = activeCell.className.replace("black", "").trim();
    } else if (e.which == 190) {
        activeCell.innerHTML = ".";
        activeCell.className = (activeCell.className + " black").trim();
    } else if (e.which == 8) {
        activeCell.innerHTML = null;
        activeCell.className = activeCell.className.replace("black", "").trim();
    }
    console.log(activeCell.innerHTML);
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
}


// window.alert("This is how you create an alert.")
// document.write("This is how you write to the HTML document.")
