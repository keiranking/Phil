// Phil
// ------------------------------------------------------------------------
// Copyright 2017 Keiran King

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// (https://www.apache.org/licenses/LICENSE-2.0)

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ------------------------------------------------------------------------

const keyboard = {
  a: 65,
  b: 66,
  c: 67,
  d: 68,
  e: 69,
  f: 70,
  g: 71,
  h: 72,
  i: 73,
  j: 74,
  k: 75,
  l: 76,
  m: 77,
  n: 78,
  o: 79,
  p: 80,
  q: 81,
  r: 82,
  s: 83,
  t: 84,
  u: 85,
  v: 86,
  w: 87,
  x: 88,
  y: 89,
  z: 90,
  black: 190,
  ".": 190,
  delete: 8,
  enter: 13,
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
};
const BLACK = ".";
const DASH = "-";
const BLANK = " ";
const ACROSS = "across";
const DOWN = "down";
const DEFAULT_SIZE = 21;
const DEFAULT_TITLE = "Untitled";
const DEFAULT_AUTHOR = "Anonymous";
const DEFAULT_CLUE = "(blank clue)";
const DEFAULT_NOTIFICATION_LIFETIME = 10; // in seconds

let history = [];
let isSymmetrical = true;
let grid = undefined;
let squares = undefined;
let isMutated = false;
let forced = null;
// createNewPuzzle();
let solveWorker = null;
let solveWorkerState = null;
let solveTimeout = null;
let solveWordlist = null;
let solvePending = [];

//____________________
// C L A S S E S
class Crossword {
  constructor(rows = DEFAULT_SIZE, cols = DEFAULT_SIZE) {
    this.clues = {};
    this.title = DEFAULT_TITLE;
    this.author = DEFAULT_AUTHOR;
    this.rows = rows;
    this.cols = cols;
    this.fill = [];
    //
    for (let i = 0; i < this.rows; i++) {
      this.fill.push("");
      for (let j = 0; j < this.cols; j++) {
        this.fill[i] += BLANK;
      }
    }
  }
}

class Grid {
  constructor(rows, cols) {
    document.getElementById("main").innerHTML = "";
    let table = document.createElement("TABLE");
    table.setAttribute("id", "grid");
    table.setAttribute("tabindex", "1");
    document.getElementById("main").appendChild(table);

    for (let i = 0; i < rows; i++) {
      let row = document.createElement("TR");
      row.setAttribute("data-row", i);
      document.getElementById("grid").appendChild(row);

      for (let j = 0; j < cols; j++) {
        let col = document.createElement("TD");
        col.setAttribute("data-col", j);

        let label = document.createElement("DIV");
        label.setAttribute("class", "label");
        let labelContent = document.createTextNode("");

        let fill = document.createElement("DIV");
        fill.setAttribute("class", "fill");
        let fillContent = document.createTextNode(xw.fill[i][j]);

        label.appendChild(labelContent);
        fill.appendChild(fillContent);
        col.appendChild(label);
        col.appendChild(fill);
        row.appendChild(col);
      }
    }
    grid = document.getElementById("grid");
    squares = grid.querySelectorAll("td");
    for (const square of squares) {
      square.addEventListener("click", mouseHandler);
    }
    grid.addEventListener("keydown", keyboardHandler);
  }

  update() {
    for (let i = 0; i < xw.rows; i++) {
      for (let j = 0; j < xw.cols; j++) {
        const activeCell = grid
          .querySelector('[data-row="' + i + '"]')
          .querySelector('[data-col="' + j + '"]');
        let fill = xw.fill[i][j];
        if (fill == BLANK && forced != null) {
          fill = forced[i][j];
          activeCell.classList.add("pencil");
        } else {
          activeCell.classList.remove("pencil");
        }
        activeCell.lastChild.innerHTML = fill;
        if (fill == BLACK) {
          activeCell.classList.add("black");
        } else {
          activeCell.classList.remove("black");
        }
      }
    }
  }
}

class Button {
  constructor(id) {
    this.id = id;
    this.dom = document.getElementById(id);
    this.tooltip = this.dom.getAttribute("data-tooltip");
    // this.type = type; // "normal", "toggle", "menu", "submenu"
    this.state = this.dom.className; // "normal", "on", "open", "disabled"
  }

  setState(state) {
    this.state = state;
    this.dom.className = this.state == "normal" ? "" : this.state;
  }

  addEvent(e, func) {
    this.dom.addEventListener(e, func);
    if (this.state == "disabled") {
      this.setState("normal");
    }
  }

  press() {
    // switch (this.type) {
    //   case "toggle":
    //   case "submenu":
    //     this.setState((this.state == "on") ? "normal" : "on");
    //     break;
    //   case "menu":
    //     this.setState((this.state == "open") ? "normal" : "open");
    //     break;
    //   default:
    //     break;
  }
}

class Menu {
  // in dev
  constructor(id, buttons) {
    this.id = id;
    this.buttons = buttons;

    let div = document.createElement("DIV");
    div.setAttribute("id", this.id);
    for (var button in buttons) {
      div.appendChild(button);
    }
    document.getElementById("toolbar").appendChild(div);
  }
}

class Toolbar {
  constructor(id) {
    this.id = id;
    this.buttons = {
      // rewrite this programmatically
      newPuzzle: new Button("new-grid"),
      openPuzzle: new Button("open-JSON"),
      exportJSON: new Button("export-JSON"),
      exportPUZ: new Button("export-PUZ"),
      exportPDF: new Button("print-puzzle"),
      exportNYT: new Button("print-NYT-submission"),
      export: new Button("export"),
      quickLayout: new Button("quick-layout"),
      freezeLayout: new Button("toggle-freeze-layout"),
      clearFill: new Button("clear-fill"),
      toggleSymmetry: new Button("toggle-symmetry"),
      openWordlist: new Button("open-wordlist"),
      autoFill: new Button("auto-fill"),
    };
  }
}

class Notification {
  constructor(message, lifetime = undefined) {
    this.message = message;
    this.id = String(randomNumber(1, 10000));
    this.post();
    if (lifetime) {
      this.dismiss(lifetime);
    }
  }

  post() {
    let div = document.createElement("DIV");
    div.setAttribute("id", this.id);
    div.setAttribute("class", "notification");
    div.innerHTML = this.message;
    div.addEventListener("click", this.dismiss);
    document.getElementById("footer").appendChild(div);
  }

  update(message) {
    document.getElementById(this.id).innerHTML = message;
  }

  dismiss(seconds = 0) {
    let div = document.getElementById(this.id);
    // seconds = (seconds === true) ? 10 : seconds;
    setTimeout(function () {
      div.remove();
    }, seconds * 1000);
  }
}

class Interface {
  constructor(rows, cols) {
    this.grid = new Grid(rows, cols);
    this.sidebar;
    this.toolbar = new Toolbar("toolbar");

    this.isSymmetrical = true;
    this.row = 0;
    this.col = 0;
    this.acrossWord = "";
    this.downWord = "";
    this.acrossStartIndex = 0;
    this.acrossEndIndex = cols;
    this.downStartIndex = 0;
    this.downEndIndex = rows;
    this.direction = ACROSS;

    console.log("Grid UI created.");
  }

  toggleDirection() {
    this.direction = this.direction == ACROSS ? DOWN : ACROSS;
  }

  update() {
    updateInfoUI();
    updateLabelsAndClues();
    updateActiveWords();
    updateGridHighlights();
    updateSidebarHighlights();
    updateCluesUI();
  }
}

new Notification(document.getElementById("shortcuts").innerHTML, 300);
// new Notification("Tip: <kbd>.</kbd> makes a black square.", 300);
// new Notification("Tip: <kbd>Enter</kbd> toggles direction.", 300);

let xw = new Crossword(); // model
let current = new Interface(xw.rows, xw.cols); // view-controller
current.update();

//____________________
// F U N C T I O N S

function createNewPuzzle(rows, cols) {
  xw["clues"] = {};
  xw["title"] = DEFAULT_TITLE;
  xw["author"] = DEFAULT_AUTHOR;
  xw["rows"] = rows || DEFAULT_SIZE;
  xw["cols"] = cols || xw.rows;
  xw["fill"] = [];
  for (let i = 0; i < xw.rows; i++) {
    xw.fill.push("");
    for (let j = 0; j < xw.cols; j++) {
      xw.fill[i] += BLANK;
    }
  }
  updateInfoUI();
  document.getElementById("main").innerHTML = "";
  createGrid(xw.rows, xw.cols);

  isSymmetrical = true;
  current = {
    row: 0,
    col: 0,
    acrossWord: "",
    downWord: "",
    acrossStartIndex: 0,
    acrossEndIndex: DEFAULT_SIZE,
    downStartIndex: 0,
    downEndIndex: DEFAULT_SIZE,
    direction: ACROSS,
  };

  grid = document.getElementById("grid");
  squares = grid.querySelectorAll("td");

  updateActiveWords();
  updateGridHighlights();
  updateSidebarHighlights();
  updateCluesUI();

  for (const square of squares) {
    square.addEventListener("click", mouseHandler);
  }
  grid.addEventListener("keydown", keyboardHandler);
  console.log("New puzzle created.");
}

function mouseHandler(e) {
  const previousCell = grid
    .querySelector('[data-row="' + current.row + '"]')
    .querySelector('[data-col="' + current.col + '"]');
  previousCell.classList.remove("active");
  const activeCell = e.currentTarget;
  if (activeCell == previousCell) {
    current.direction = current.direction == ACROSS ? DOWN : ACROSS;
  }
  current.row = Number(activeCell.parentNode.dataset.row);
  current.col = Number(activeCell.dataset.col);
  console.log("[" + current.row + "," + current.col + "]");
  activeCell.classList.add("active");

  isMutated = false;
  updateUI();
}

function keyboardHandler(e) {
  isMutated = false;
  let activeCell = grid
    .querySelector('[data-row="' + current.row + '"]')
    .querySelector('[data-col="' + current.col + '"]');
  const symRow = xw.rows - 1 - current.row;
  const symCol = xw.cols - 1 - current.col;

  if (
    (e.which >= keyboard.a && e.which <= keyboard.z) ||
    e.which == keyboard.space
  ) {
    let oldContent = xw.fill[current.row][current.col];
    xw.fill[current.row] =
      xw.fill[current.row].slice(0, current.col) +
      String.fromCharCode(e.which) +
      xw.fill[current.row].slice(current.col + 1);
    if (oldContent == BLACK) {
      if (isSymmetrical) {
        xw.fill[symRow] =
          xw.fill[symRow].slice(0, symCol) +
          BLANK +
          xw.fill[symRow].slice(symCol + 1);
      }
    }
    // move the cursor
    e = new Event("keydown");
    if (current.direction == ACROSS) {
      e.which = keyboard.right;
    } else {
      e.which = keyboard.down;
    }
    isMutated = true;
  }
  if (e.which == keyboard.black) {
    if (xw.fill[current.row][current.col] == BLACK) {
      // if already black...
      e = new Event("keydown");
      e.which = keyboard.delete; // make it a white square
    } else {
      xw.fill[current.row] =
        xw.fill[current.row].slice(0, current.col) +
        BLACK +
        xw.fill[current.row].slice(current.col + 1);
      if (isSymmetrical) {
        xw.fill[symRow] =
          xw.fill[symRow].slice(0, symCol) +
          BLACK +
          xw.fill[symRow].slice(symCol + 1);
      }
    }
    isMutated = true;
  }
  if (e.which == keyboard.enter) {
    current.direction = current.direction == ACROSS ? DOWN : ACROSS;
  }
  if (e.which == keyboard.delete) {
    e.preventDefault();
    let oldContent = xw.fill[current.row][current.col];
    xw.fill[current.row] =
      xw.fill[current.row].slice(0, current.col) +
      BLANK +
      xw.fill[current.row].slice(current.col + 1);
    if (oldContent == BLACK) {
      if (isSymmetrical) {
        xw.fill[symRow] =
          xw.fill[symRow].slice(0, symCol) +
          BLANK +
          xw.fill[symRow].slice(symCol + 1);
      }
    } else {
      // move the cursor
      e = new Event("keydown");
      if (current.direction == ACROSS) {
        e.which = keyboard.left;
      } else {
        e.which = keyboard.up;
      }
    }
    isMutated = true;
  }
  if (e.which >= keyboard.left && e.which <= keyboard.down) {
    e.preventDefault();
    const previousCell = grid
      .querySelector('[data-row="' + current.row + '"]')
      .querySelector('[data-col="' + current.col + '"]');
    previousCell.classList.remove("active");
    let content = xw.fill[current.row][current.col];
    switch (e.which) {
      case keyboard.left:
        if (current.direction == ACROSS || content == BLACK) {
          current.col -= current.col == 0 ? 0 : 1;
        }
        current.direction = ACROSS;
        break;
      case keyboard.up:
        if (current.direction == DOWN || content == BLACK) {
          current.row -= current.row == 0 ? 0 : 1;
        }
        current.direction = DOWN;
        break;
      case keyboard.right:
        if (current.direction == ACROSS || content == BLACK) {
          current.col += current.col == xw.cols - 1 ? 0 : 1;
        }
        current.direction = ACROSS;
        break;
      case keyboard.down:
        if (current.direction == DOWN || content == BLACK) {
          current.row += current.row == xw.rows - 1 ? 0 : 1;
        }
        current.direction = DOWN;
        break;
    }
    console.log("[" + current.row + "," + current.col + "]");
    activeCell = grid
      .querySelector('[data-row="' + current.row + '"]')
      .querySelector('[data-col="' + current.col + '"]');
    activeCell.classList.add("active");
  }
  updateUI();
}

function updateUI() {
  if (isMutated) {
    autoFill(true); // quick fill
  }
  updateGridUI();
  updateLabelsAndClues();
  updateActiveWords();
  updateGridHighlights();
  updateSidebarHighlights();
  updateMatchesUI();
  updateCluesUI();
  updateInfoUI();
}

function updateGridUI() {
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const activeCell = grid
        .querySelector('[data-row="' + i + '"]')
        .querySelector('[data-col="' + j + '"]');
      let fill = xw.fill[i][j];
      if (fill == BLANK && forced != null) {
        fill = forced[i][j];
        activeCell.classList.add("pencil");
      } else {
        activeCell.classList.remove("pencil");
      }
      activeCell.lastChild.innerHTML = fill;
      if (fill == BLACK) {
        activeCell.classList.add("black");
      } else {
        activeCell.classList.remove("black");
      }
    }
  }
}

function updateCluesUI() {
  let acrossClueNumber = document.getElementById("across-clue-number");
  let downClueNumber = document.getElementById("down-clue-number");
  let acrossClueText = document.getElementById("across-clue-text");
  let downClueText = document.getElementById("down-clue-text");
  // const currentCell = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + current.col + '"]');

  // If the current cell is black, empty interface and get out
  if (xw.fill[current.row][current.col] == BLACK) {
    acrossClueNumber.innerHTML = "";
    downClueNumber.innerHTML = "";
    acrossClueText.innerHTML = "";
    downClueText.innerHTML = "";
    return;
  }
  // Otherwise, assign values
  const acrossCell = grid
    .querySelector('[data-row="' + current.row + '"]')
    .querySelector('[data-col="' + current.acrossStartIndex + '"]');
  const downCell = grid
    .querySelector('[data-row="' + current.downStartIndex + '"]')
    .querySelector('[data-col="' + current.col + '"]');
  acrossClueNumber.innerHTML = acrossCell.firstChild.innerHTML + "a.";
  downClueNumber.innerHTML = downCell.firstChild.innerHTML + "d.";
  acrossClueText.innerHTML =
    xw.clues[[current.row, current.acrossStartIndex, ACROSS]];
  downClueText.innerHTML =
    xw.clues[[current.downStartIndex, current.col, DOWN]];
}

function updateInfoUI() {
  document.getElementById("puzzle-title").innerHTML = xw.title;
  document.getElementById("puzzle-author").innerHTML = xw.author;
}

function createGrid(rows, cols) {
  let table = document.createElement("TABLE");
  table.setAttribute("id", "grid");
  table.setAttribute("tabindex", "1");
  // table.setAttribute("tabindex", "0");
  document.getElementById("main").appendChild(table);

  for (let i = 0; i < rows; i++) {
    let row = document.createElement("TR");
    row.setAttribute("data-row", i);
    document.getElementById("grid").appendChild(row);

    for (let j = 0; j < cols; j++) {
      let col = document.createElement("TD");
      col.setAttribute("data-col", j);

      let label = document.createElement("DIV");
      label.setAttribute("class", "label");
      let labelContent = document.createTextNode("");

      let fill = document.createElement("DIV");
      fill.setAttribute("class", "fill");
      let fillContent = document.createTextNode(xw.fill[i][j]);

      // let t = document.createTextNode("[" + i + "," + j + "]");
      label.appendChild(labelContent);
      fill.appendChild(fillContent);
      col.appendChild(label);
      col.appendChild(fill);
      row.appendChild(col);
    }
  }
  updateLabelsAndClues();
}

function updateLabelsAndClues() {
  let count = 1;
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      let isAcross = false;
      let isDown = false;
      if (xw.fill[i][j] != BLACK) {
        isDown = i == 0 || xw.fill[i - 1][j] == BLACK;
        isAcross = j == 0 || xw.fill[i][j - 1] == BLACK;
      }
      const grid = document.getElementById("grid");
      let currentCell = grid
        .querySelector('[data-row="' + i + '"]')
        .querySelector('[data-col="' + j + '"]');
      if (isAcross || isDown) {
        currentCell.firstChild.innerHTML = count; // Set square's label to the count
        count++;
      } else {
        currentCell.firstChild.innerHTML = "";
      }

      if (isAcross) {
        xw.clues[[i, j, ACROSS]] = xw.clues[[i, j, ACROSS]] || DEFAULT_CLUE;
      } else {
        delete xw.clues[[i, j, ACROSS]];
      }
      if (isDown) {
        xw.clues[[i, j, DOWN]] = xw.clues[[i, j, DOWN]] || DEFAULT_CLUE;
      } else {
        delete xw.clues[[i, j, DOWN]];
      }
    }
  }
}

function updateActiveWords() {
  if (xw.fill[current.row][current.col] == BLACK) {
    current.acrossWord = "";
    current.downWord = "";
    current.acrossStartIndex = null;
    current.acrossEndIndex = null;
    current.downStartIndex = null;
    current.downEndIndex = null;
  } else {
    current.acrossWord = getWordAt(current.row, current.col, ACROSS, true);
    current.downWord = getWordAt(current.row, current.col, DOWN, true);
  }
  document.getElementById("across-word").innerHTML = current.acrossWord;
  document.getElementById("down-word").innerHTML = current.downWord;
  // console.log("Across:", current.acrossWord, "Down:", current.downWord);
  // console.log(current.acrossWord.split(DASH).join("*"));
}

function getWordAt(row, col, direction, setCurrentWordIndices) {
  let text = "";
  let [start, end] = [0, 0];
  if (direction == ACROSS) {
    text = xw.fill[row];
  } else {
    for (let i = 0; i < xw.rows; i++) {
      text += xw.fill[i][col];
    }
  }
  text = text.split(BLANK).join(DASH);
  [start, end] = getWordIndices(text, direction == ACROSS ? col : row);
  // Set global word indices if needed
  if (setCurrentWordIndices) {
    if (direction == ACROSS) {
      [current.acrossStartIndex, current.acrossEndIndex] = [start, end];
    } else {
      [current.downStartIndex, current.downEndIndex] = [start, end];
    }
  }
  return text.slice(start, end);
}

function getWordIndices(text, position) {
  let start = text.slice(0, position).lastIndexOf(BLACK);
  start = start == -1 ? 0 : start + 1;
  let end = text.slice(position, DEFAULT_SIZE).indexOf(BLACK);
  end = end == -1 ? DEFAULT_SIZE : Number(position) + end;
  return [start, end];
}

function updateGridHighlights() {
  // Clear the grid of any highlights
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const square = grid
        .querySelector('[data-row="' + i + '"]')
        .querySelector('[data-col="' + j + '"]');
      square.classList.remove("highlight", "lowlight");
    }
  }
  // Highlight across squares
  for (let j = current.acrossStartIndex; j < current.acrossEndIndex; j++) {
    const square = grid
      .querySelector('[data-row="' + current.row + '"]')
      .querySelector('[data-col="' + j + '"]');
    if (j != current.col) {
      square.classList.add(
        current.direction == ACROSS ? "highlight" : "lowlight"
      );
    }
  }
  // Highlight down squares
  for (let i = current.downStartIndex; i < current.downEndIndex; i++) {
    const square = grid
      .querySelector('[data-row="' + i + '"]')
      .querySelector('[data-col="' + current.col + '"]');
    if (i != current.row) {
      square.classList.add(
        current.direction == DOWN ? "highlight" : "lowlight"
      );
    }
  }
}

function updateSidebarHighlights() {
  let acrossHeading = document.getElementById("across-heading");
  let downHeading = document.getElementById("down-heading");
  const currentCell = grid
    .querySelector('[data-row="' + current.row + '"]')
    .querySelector('[data-col="' + current.col + '"]');

  acrossHeading.classList.remove("highlight");
  downHeading.classList.remove("highlight");

  if (!currentCell.classList.contains("black")) {
    if (current.direction == ACROSS) {
      acrossHeading.classList.add("highlight");
    } else {
      downHeading.classList.add("highlight");
    }
  }
}

function setClues() {
  xw.clues[[current.row, current.acrossStartIndex, ACROSS]] =
    document.getElementById("across-clue-text").innerHTML;
  xw.clues[[current.downStartIndex, current.col, DOWN]] =
    document.getElementById("down-clue-text").innerHTML;
  // console.log("Stored clue:", xw.clues[[current.row, current.acrossStartIndex, ACROSS]], "at [" + current.row + "," + current.acrossStartIndex + "]");
  // console.log("Stored clue:", xw.clues[[current.downStartIndex, current.col, DOWN]], "at [" + current.downStartIndex + "," + current.col + "]");
}

function setTitle() {
  xw.title = document.getElementById("puzzle-title").innerHTML;
}

function setAuthor() {
  xw.author = document.getElementById("puzzle-author").innerHTML;
}

function suppressEnterKey(e) {
  if (e.which == keyboard.enter) {
    e.preventDefault();
    // console.log("Enter key behavior suppressed.");
  }
}

function generatePattern() {
  let title = xw.title;
  let author = xw.author;
  createNewPuzzle();
  xw.title = title;
  xw.author = author;

  const pattern = patterns[randomNumber(0, patterns.length)]; // select random pattern
  if (!isSymmetrical) {
    // patterns are encoded as only one half of the grid...
    toggleSymmetry(); // so symmetry needs to be on to populate correctly
  }
  for (let i = 0; i < pattern.length; i++) {
    const row = pattern[i][0];
    const col = pattern[i][1];
    const symRow = xw.rows - 1 - row;
    const symCol = xw.cols - 1 - col;
    xw.fill[row] =
      xw.fill[row].slice(0, col) + BLACK + xw.fill[row].slice(col + 1);
    xw.fill[symRow] =
      xw.fill[symRow].slice(0, symCol) +
      BLACK +
      xw.fill[symRow].slice(symCol + 1);
  }
  isMutated = true;
  updateUI();
  console.log("Generated layout.");
}

function toggleSymmetry() {
  isSymmetrical = !isSymmetrical;
  // Update UI button
  let symButton = document.getElementById("toggle-symmetry");
  symButton.classList.toggle("button-on");
  buttonState = symButton.getAttribute("data-state");
  symButton.setAttribute("data-state", buttonState == "on" ? "off" : "on");
  symButton.setAttribute("data-tooltip", "Turn " + buttonState + " symmetry");
}

// function toggleHelp() {
//   document.getElementById("help").style.display = "none";
// }

function clearFill() {
  for (let i = 0; i < xw.rows; i++) {
    xw.fill[i] = xw.fill[i].replace(/\w/g, " "); // replace letters with spaces
  }
  isMutated = true;
  updateUI();
}

function autoFill(isQuick = false) {
  console.log("Auto-filling...");
  forced = null;
  grid.classList.remove("sat", "unsat");
  if (!solveWorker) {
    solveWorker = new Worker("xw_worker.js");
    solveWorkerState = "ready";
  }
  if (solveWorkerState != "ready") {
    cancelSolveWorker();
  }
  solvePending = [isQuick];
  runSolvePending();
}

function runSolvePending() {
  if (solveWorkerState != "ready" || solvePending.length == 0) return;
  let isQuick = solvePending[0];
  solvePending = [];
  solveTimeout = window.setTimeout(cancelSolveWorker, 30000);
  if (solveWordlist == null) {
    console.log("Rebuilding wordlist...");
    solveWordlist = "";
    for (let i = 3; i < wordlist.length; i++) {
      solveWordlist += wordlist[i].join("\n") + "\n";
    }
  }
  //console.log(wordlist_str);
  let puz = xw.fill.join("\n") + "\n";
  solveWorker.postMessage(["run", solveWordlist, puz, isQuick]);
  solveWorkerState = "running";
  solveWorker.onmessage = function (e) {
    switch (e.data[0]) {
      case "sat":
        if (solveWorkerState == "running") {
          if (isQuick) {
            console.log("Autofill: Solution found.");
            grid.classList.add("sat");
          } else {
            xw.fill = e.data[1].split("\n");
            xw.fill.pop(); // strip empty last line
            updateGridUI();
            grid.focus();
          }
        }
        break;
      case "unsat":
        if (solveWorkerState == "running") {
          if (isQuick) {
            console.log("Autofill: No quick solution found.");
            grid.classList.add("unsat");
          } else {
            console.log("Autofill: No solution found.");
            // TODO: indicate on UI
          }
        }
        break;
      case "forced":
        if (solveWorkerState == "running") {
          forced = e.data[1].split("\n");
          forced.pop; // strip empty last line
          updateGridUI();
        }
        break;
      case "done":
        console.log(
          "Autofill: returning to ready, state was ",
          solveWorkerState
        );
        solveWorkerReady();
        break;
      case "ack_cancel":
        console.log("Autofill: Cancel acknowledged.");
        solveWorkerReady();
        break;
      default:
        console.log("Autofill: Unexpected return,", e.data);
        break;
    }
  };
}

function solveWorkerReady() {
  if (solveTimeout) {
    window.clearTimeout(solveTimeout);
    solveTimeout = null;
  }
  solveWorkerState = "ready";
  runSolvePending();
}

function cancelSolveWorker() {
  if (solveWorkerState == "running") {
    solveWorker.postMessage(["cancel"]);
    solveWorkerState = "cancelwait";
    console.log("Autofill: Cancel sent."); // TODO: indicate on UI
    window.clearTimeout(solveTimeout);
    solveTimeout = null;
  }
}

function invalidateSolverWordlist() {
  solveWordlist = null;
}

function showMenu(e) {
  let menus = document.querySelectorAll("#toolbar .menu");
  for (let i = 0; i < menus.length; i++) {
    menus[i].classList.add("hidden");
  }
  const id = e.target.getAttribute("id");
  let menu = document.getElementById(id + "-menu");
  if (menu) {
    menu.classList.remove("hidden");
  }
}

function hideMenu(e) {
  e.target.classList.add("hidden");
}

function setDefault(e) {
  let d = e.target.parentNode.querySelector(".default");
  d.classList.remove("default");
  e.target.classList.add("default");
  menuButton = document.getElementById(
    e.target.parentNode.getAttribute("id").replace("-menu", "")
  );
  menuButton.innerHTML = e.target.innerHTML;
}

function doDefault(e) {
  const id = e.target.parentNode.getAttribute("id");
  let menu = document.getElementById(id + "-menu");
  if (menu) {
    let d = menu.querySelector(".default");
    d.click();
  }
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * max) + min;
}

function randomLetter() {
  let alphabet =
    "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSSSTTTTTTUUUUVVWWXYYZ";
  return alphabet[randomNumber(0, alphabet.length)];
}
