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
        activeCell.innerHTML = undefined;
        activeCell.className = activeCell.className.replace("black", "").trim();        
    }
    console.log(activeCell.innerHTML);
  }
});
// const grid = document.getElementById("grid");
// grid.addEventListener('keydown', updateSquare(e));

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

// function updateSquare(e) {
//   if (e.keyCode == 90) {
//     document.getElementById("grid").querySelector('[data-row="' + activeRow + '"]').querySelector('[data-col="' + activeCol + '"]').innerHTML = e;
//   }
// }

// Writing into an HTML element, using innerHTML.
// Writing into the HTML output using document.write().
// Writing into an alert box, using window.alert().
// Writing into the browser console, using console.log().

/*
var isOff = true;
function light() {
    var pic;
    if (isOff == true) {
        pic = "https://www.w3schools.com/html/pic_bulbon.gif"
        isOff = false;
    } else {
        pic = "https://www.w3schools.com/html/pic_bulboff.gif"
        isOff = true;
    }
    document.getElementById('myImage').src = pic;
    console.log("Switch flipped.")
}

function shrink() {
	document.getElementById('myImage').width = document.getElementById('myImage').width * .9
	document.getElementById('myImage').height = document.getElementById('myImage').height * .9
  console.log("Less light.")
}
*/

/*
document.getElementById('math').innerHTML = Math.floor((Math.random() * 12) + 1);
window.alert("This is how you create an alert.")
document.write("This is how you write to the HTML document.")
console.log("This is how you write to the console (for debugging).");

var x, y;
x = "5";
y = 5.0;
if (x == y) {
  console.log("x and y are equal value");
}
if (x === y) {
  console.log("x and y are equal value and type");
}
*/
