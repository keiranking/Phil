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

function ScrambledError() {
   this.message = 'Cannot open scrambled Across Lite files';
   this.name = 'ScrambledError';
}

class PuzReader {
  constructor(buf) {
    this.buf = buf;
  }

  readShort(ix) {
    return this.buf[ix] | (this.buf[ix + 1] << 8);
  }

  readString() {
    let result = [];
    while (true) {
      let c = this.buf[this.ix++];
      if (c == 0) break;
      result.push(String.fromCodePoint(c));
    }
    return result.join('');
  }

  toJson() {
    let json = {};
    let w = this.buf[0x2c];
    let h = this.buf[0x2d];
    let scrambled = this.readShort(0x32);
    if (scrambled & 0x0004) {
      throw new ScrambledError;
    }
    json.size = {cols: w, rows: h};
    let grid = [];
    for (var i = 0; i < w * h; i++) {
      grid.push(String.fromCodePoint(this.buf[0x34 + i]));
    }
    json.grid = grid;
    this.ix = 0x34 + 2 * w * h;
    json.title = this.readString();
    json.author = this.readString();
    json.copyright = this.readString();
    var across = [];
    var down = [];
    var label = 1;
    for (var i = 0; i < w * h; i++) {
      if (grid[i] == '.') continue;
      var inc = 0;
      if (i % w == 0 || grid[i - 1] == '.') {
        across.push(label + ". " + this.readString());
        inc = 1;
      }
      if (i < w || grid[i - w] == '.') {
        down.push(label + ". " + this.readString());
        inc = 1;
      }
      label += inc;
    }
    json.clues = {across: across, down: down};
    // console.log(json);
    return json;
  }
}

class PuzWriter {
  constructor() {
    this.buf = []
  }

  pad(n) {
    for (var i = 0; i < n; i++) {
      this.buf.push(0);
    }
  }

  writeShort(x) {
    this.buf.push(x & 0xff, (x >> 8) & 0xff);
  }

  setShort(ix, x) {
    this.buf[ix] = x & 0xff;
    this.buf[ix + 1] = (x >> 8) & 0xff;
  }

  writeString(s) {
    if (s === undefined) s = '';
    for (var i = 0; i < s.length; i++) {
      var cp = s.codePointAt(i);
      if (cp < 0x100 && cp > 0) {
        this.buf.push(cp);
      } else {
        // TODO: expose this warning through the UI
        console.log('string "' + s + '" has non-ISO-8859-1 codepoint at offset ' + i);
        this.buf.push('?'.codePointAt(0));
      }
      if (cp >= 0x10000) i++;   // advance by one codepoint
    }
    this.buf.push(0);
  }

  writeHeader(json) {
    this.pad(2); // placeholder for checksum
    this.writeString('ACROSS&DOWN');
    this.pad(2); // placeholder for cib checksum
    this.pad(8); // placeholder for masked checksum
    this.version = '1.3';
    this.writeString(this.version);
    this.pad(2); // probably extra space for version string
    this.writeShort(0);  // scrambled checksum
    this.pad(12);  // reserved
    this.w = json.size.cols;
    this.h = json.size.rows;
    this.buf.push(this.w);
    this.buf.push(this.h);
    this.numClues = json.clues.across.length + json.clues.down.length;
    this.writeShort(this.numClues);
    this.writeShort(1);  // puzzle type
    this.writeShort(0);  // scrambled tag
  }

  writeFill(json) {
    const grid = json.grid;
    const BLACK_CP = '.'.codePointAt(0);
    this.solution = this.buf.length;
    for (var i = 0; i < grid.length; i++) {
      this.buf.push(grid[i].codePointAt(0));  // Note: assumes grid is ISO-8859-1
    }
    this.grid = this.buf.length;
    for (var i = 0; i < grid.length; i++) {
      var cp = grid[i].codePointAt(0);
      if (cp != BLACK_CP) cp = '-'.codePointAt(0);
      this.buf.push(cp);
    }
  }

  writeStrings(json) {
    this.stringStart = this.buf.length;
    this.writeString(json.title);
    this.writeString(json.author);
    this.writeString(json.copyright);
    const across = json.clues.across;
    const down = json.clues.down;
    var clues = [];
    for (var i = 0; i < across.length; i++) {
      const sp = across[i].split('. ');
      clues.push([2 * parseInt(sp[0]), sp[1]]);
    }
    for (var i = 0; i < down.length; i++) {
      const sp = down[i].split('. ');
      clues.push([2 * parseInt(sp[0]) + 1, sp[1]]);
    }
    clues.sort((a, b) => a[0] - b[0]);
    for (var i = 0; i < clues.length; i++) {
      this.writeString(clues[i][1]);
    }
    this.writeString(json.notepad);
  }

  checksumRegion(base, len, cksum) {
    for (var i = 0; i < len; i++) {
      cksum = (cksum >> 1) | ((cksum & 1) << 15);
      cksum = (cksum + this.buf[base + i]) & 0xffff;
    }
    return cksum;
  }

  strlen(ix) {
    var i = 0;
    while (this.buf[ix + i]) i++;
    return i;
  }

  checksumStrings(cksum) {
    let ix = this.stringStart;
    for (var i = 0; i < 3; i++) {
      const len = this.strlen(ix);
      if (len) {
        cksum = this.checksumRegion(ix, len + 1, cksum);
      }
      ix += len + 1;
    }
    for (var i = 0; i < this.numClues; i++) {
      const len = this.strlen(ix);
      cksum = this.checksumRegion(ix, len, cksum);
      ix += len + 1;
    }
    if (this.version == '1.3') {
      const len = this.strlen(ix);
      if (len) {
        cksum = this.checksumRegion(ix, len + 1, cksum);
      }
      ix += len + 1;
    }
    return cksum;
  }

  setMaskedChecksum(i, maskLow, maskHigh, cksum) {
    this.buf[0x10 + i] = maskLow ^ (cksum & 0xff);
    this.buf[0x14 + i] = maskHigh ^ (cksum >> 8);
  }

  computeChecksums() {
    var c_cib = this.checksumRegion(0x2c, 8, 0);
    this.setShort(0xe, c_cib);
    var cksum = this.checksumRegion(this.solution, this.w * this.h, c_cib);
    var cksum = this.checksumRegion(this.grid, this.w * this.h, cksum);
    cksum = this.checksumStrings(cksum);
    this.setShort(0x0, cksum);
    this.setMaskedChecksum(0, 0x49, 0x41, c_cib);
    var c_sol = this.checksumRegion(this.solution, this.w * this.h, 0);
    this.setMaskedChecksum(1, 0x43, 0x54, c_sol);
    var c_grid = this.checksumRegion(this.grid, this.w * this.h, 0);
    this.setMaskedChecksum(2, 0x48, 0x45, c_grid);
    var c_part = this.checksumStrings(0);
    this.setMaskedChecksum(3, 0x45, 0x44, c_part);
  }

  toPuz(json) {
    this.writeHeader(json);
    this.writeFill(json);
    this.writeStrings(json);
    this.computeChecksums();
    return new Uint8Array(this.buf);
  }
}

function openPuzzle() {
  document.getElementById("open-puzzle-input").click();
}

function isPuz(bytes) {
  const magic = 'ACROSS&DOWN';
  for (var i = 0; i < magic.length; i++) {
    if (bytes[2 + i] != magic.charCodeAt(i)) return false;
  }
  return bytes[2 + magic.length] == 0;
}

function openFile(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }
  let reader = new FileReader();
  try {
    switch (file.name.slice(file.name.lastIndexOf("."))) {
      case ".json":
      case ".xw":
      case ".txt":
        reader.onload = function(e) {
          convertJSONToPuzzle(JSON.parse(e.target.result));
        };
        reader.readAsText(file); // removing this line breaks the JSON import
        break;
      case ".puz":
        reader.onload = function(e) {
          const bytes = new Uint8Array(e.target.result);
          let puz;
          if (isPuz(bytes)) {
            puz = new PuzReader(bytes).toJson();
          } else {
            puz = JSON.parse(new TextDecoder().decode(bytes)); // TextDecoder doesn't work in Edge 16
          }
          convertJSONToPuzzle(puz);
        };
        reader.readAsArrayBuffer(file);
        break;
      default:
        break;
    }
    console.log("Loaded", file.name);
  }
  catch (err) {
    switch (err.name) {
      case "SyntaxError":
        new Notification("Invalid file. PUZ and JSON puzzle files only.", 10);
        break;
      case "ScrambledError":
        new Notification("Cannot open scrambled PUZ file.", 10);
        break;
      default:
        console.log("Error:", err);
    }
  }
}

function convertJSONToPuzzle(puz) {
  createNewPuzzle();
  if (puz.size.rows != DEFAULT_SIZE || puz.size.cols != DEFAULT_SIZE) {
    new Notification("Oops. Can only open 15 x 15 puzzles.", 10);
    return;
  }
  xw.rows = DEFAULT_SIZE;
  xw.cols = DEFAULT_SIZE;
  // Update puzzle title, author
  xw.title = puz.title || DEFAULT_TITLE;
  if (puz.title.slice(0,8).toUpperCase() == "NY TIMES") {
    xw.title = "NYT Crossword";
  }
  xw.author = puz.author || DEFAULT_AUTHOR;
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

  updateGridUI();
  updateLabelsAndClues();
  // Load in clues and display current clues
  for (let i = 0; i < xw.rows; i++) {
    for (let j = 0; j < xw.cols; j++) {
      const activeCell = grid.querySelector('[data-row="' + i + '"]').querySelector('[data-col="' + j + '"]');
      if (activeCell.firstChild.innerHTML) {
        const label = activeCell.firstChild.innerHTML + ".";
        for (let k = 0; k < puz.clues.across.length; k++) {
          if (label == puz.clues.across[k].slice(0, label.length)) {
            xw.clues[[i, j, ACROSS]] = puz.clues.across[k].slice(label.length).trim();
          }
        }
        for (let l = 0; l < puz.clues.down.length; l++) {
          if (label == puz.clues.down[l].slice(0, label.length)) {
            xw.clues[[i, j, DOWN]] = puz.clues.down[l].slice(label.length).trim();
          }
        }
      }
    }
  }
  updateUI();
}

function writeFile(format) {
  let filename = xw.title + "." + format;
  let serialized = convertPuzzleToJSON();
  let fileContents;
  switch (format) {
    case "puz":
      fileContents = new PuzWriter().toPuz(serialized);
      break;
    case "xw":
    case "json":
    default:
      fileContents = JSON.stringify(serialized);  // Convert JS object to JSON text
      break;
  }
  let file = new File([fileContents], filename);
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
  return puz;
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
      if (!layoutPDFInfo(doc, style)) {
        return;
      }
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
      let email = prompt("NYT submissions require an email address. \nLeave blank to omit.");
      if (email == null) {
        return null;
      }
      let address = prompt("NYT submissions also require a mailing address. \nLeave blank to omit.");
      if (address == null) {
        return null;
      }
      doc.setFontSize(9);
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
  return 1;
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

let openPuzzleInput = document.getElementById('open-puzzle-input');
let openWordlistInput = document.getElementById('open-wordlist-input');
openPuzzleInput.addEventListener('change', openFile, false);
openWordlistInput.addEventListener('change', openWordlistFile, false);
openPuzzleInput.onclick = function () {
    this.value = null;
};
