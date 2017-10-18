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

  // Update puzzle title, author
  xw.title = puz.title;
  if (puz.title.slice(0,8) == "NY TIMES") {
    xw.title = "NYT Crossword";
  }
  xw.author = puz.author;

  // Update fill
  new_fill = [];
  for (let i = 0; i < xw.rows; i++) {
    new_fill.push("");
    for (let j = 0; j < xw.cols; j++) {
      const k = (i * xw.rows) + j;
      new_fill[i] += (puz.grid[k].length > 1) ? puz.grid[k][0].toUpperCase() : puz.grid[k].toUpperCase(); // Strip rebus answers to their first letter
    }
  }
  xw.fill = new_fill;
  isMutated = true;

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

function printPDF(style) {
  let doc = new jsPDF('p', 'pt');
  if (style) {
    style = style.toUpperCase();
  }
  switch (style) {
    case "NYT":
      layoutPDFGrid(doc, 117, 210, true); // filled
      doc.addPage();
      layoutPDFGrid(doc, 117, 210); // unfilled
      doc.addPage();
      layoutPDFClues(doc, style);
      layoutPDFInfo(doc, style);
      break;
    default:
      layoutPDFGrid(doc, 50, 80);
      layoutPDFClues(doc);
      layoutPDFInfo(doc);
      break;
  }
  doc.save(xw.title + ".pdf"); // Generate PDF and automatically download it
}

function generatePDFClues() {
  let acrossClues = [], downClues = [];
  let byLabel = // this variable is a whole function...
    function (a, b) { // that is called when sort() compares values
      if (a["label"] > b["label"]) {
        return 1;
      } else if (a["label"] < b["label"]) {
        return -1;
      } else {
        return 0;
      }
    };

  for (const key in xw.clues) {
    let [i, j, direction] = key.split(",");
    const cell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
    let label = Number(cell.firstChild.innerHTML);
    if (direction == ACROSS) {
      // acrossClues.push([label, xw.clues[key], getWordAt(i, j, direction)]);
      // acrossClues.sort(byLabel);
      acrossClues.push({ "label": label, "clue": xw.clues[key], "answer": getWordAt(i, j, direction)});
      acrossClues.sort(byLabel);
    } else {
      downClues.push({ "label": label, "clue": xw.clues[key], "answer": getWordAt(i, j, direction)});
      downClues.sort(byLabel);
    }
  }
  return [acrossClues, downClues];
}

function layoutPDFGrid(doc, x, y, isFilled) {
  let format = {
    "squareSize":     24,
    // "pageOrigin":     { "x": 50, "y": 50 },
    "gridOrigin":     { "x": x, "y": y },
    "labelOffset":    { "x": 1, "y": 6 },
    "fillOffset":     { "x": 12, "y": 17 },
    "labelFontSize":  7,
    "fillFontSize":   14,
    "innerLineWidth": .5,
    "outerLineWidth": 2
  };
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

function layoutPDFInfo(doc, style) {
  doc.setFont("helvetica");
  switch (style) {
    case "NYT":
      doc.setFontSize(9);
      let email = prompt("NYT submissions require an email address. \nLeave blank to omit.") || "";
      let address = prompt("NYT submissions also require a mailing address. \nLeave blank to omit.") || "";
      for (let i = 1; i <= 5; i++) {
        doc.setPage(i);
        doc.text(doc.internal.pageSize.width / 2, 40,
                 (xw.author + "\n\n" + email + (email ? "      " : "") + address),
                 null, null, "center");
        doc.setLineWidth(0.5);
        doc.line(0 + 150, 48, doc.internal.pageSize.width - 150, 48);
      }
      break;
    default:
      doc.setFontSize(18);
      doc.setFontType("normal");
      doc.text(50, 50 + 8, xw.title);
      doc.setFontSize(9);
      doc.setFontType("bold");
      doc.text(50, 50 + 20, xw.author.toUpperCase());
      break;
  }
}

function layoutPDFClues(doc, style) {
  const [acrossClues, downClues] = generatePDFClues();

  switch (style) {
    case "NYT":
      let clueFormat =
        { columnStyles: { label: { columnWidth: 20, halign: "right", overflow: "visible" },
                          clue: { columnWidth: 320, overflow: "linebreak" },
                          answer: { columnWidth: 120, font: "courier", overflow: "visible", fontSize: 11 }
                        },
          margin: { top: 75, left: 75 }
        };
      doc.autoTableSetDefaults({
        headerStyles: {fillColor: false, textColor: 0, fontSize: 16, fontStyle: "normal", overflow: "visible"},
        bodyStyles: { fillColor: false, textColor: 0, fontSize: 10, cellPadding: 6 },
        alternateRowStyles: { fillColor: false }
        });
      // Print across clues
      doc.autoTable([ { title: "Across", dataKey: "label"},
                      { title: "", dataKey: "clue"},
                      { title: "", dataKey: "answer"}
                    ], acrossClues, clueFormat);
      // Print down clues
      clueFormat["startY"] = doc.autoTable.previous.finalY + 10;
      doc.autoTable([ { title: "Down", dataKey: "label"},
                      { title: "", dataKey: "clue"},
                      { title: "", dataKey: "answer"}
                    ], downClues, clueFormat);
      break;
    default:
      const format = {
        "font": "helvetica",
        "fontSize": 9,
        "labelWidth": 13,
        "clueWidth": 94,
        "columnSeparator": 18,
        "marginTop": [465, 465, 465, 85],
        "marginBottom": doc.internal.pageSize.height - 50,
        "marginLeft": 50,
        "marginRight": 0
      };
      doc.setFont(format.font);
      doc.setFontSize(format.fontSize);
      let currentColumn = 0;
      let x = format.marginLeft;
      let y = format.marginTop[currentColumn];
      const acrossTitle = [{ "label": "ACROSS", "clue": " " }];
      const downTitle = [{ "label": " ", "clue": " "}, {"label": "DOWN", "clue": " " }];
      let allClues = acrossTitle.concat(acrossClues).concat(downTitle).concat(downClues);
      for (let i = 0; i < allClues.length; i++) { // Position clue on page
        const clueText = doc.splitTextToSize(allClues[i].clue, format.clueWidth);
        let adjustY = clueText.length * (format.fontSize + 2);
        if (y + adjustY > format.marginBottom) {
          currentColumn++;
          x += format.labelWidth + format.clueWidth + format.columnSeparator;
          y = format.marginTop[currentColumn];
        }
        if (["across", "down"].includes(String(allClues[i].label).toLowerCase())) { // Make Across, Down headings bold
          doc.setFontType("bold");
        } else {
          doc.setFontType("normal");
        }
        doc.text(x, y, String(allClues[i].label)); // Print clue on page
        doc.text(x + format.labelWidth, y, clueText);
        y += adjustY;
      }
      break;
    }
}

document.getElementById('open-puzzle-input').addEventListener('change', openJSONFile, false);
document.getElementById('open-wordlist-input').addEventListener('change', openWordlistFile, false);
