/**
 * Crossword puzzle filler.
 */
const UNFILLED_CHAR = '.';
const BLOCK_CHAR = '#';

const DIR_ACROSS = 0;
const DIR_DOWN = 1;

/*
 * Bitmap helpers.  We store viable characters as a bit-per-letter; since
 * we have 26 possible letters we can fit it all in a u32.
 */
const ALL_CHARS = "abcdefghijklmnopqrstuvwxyz";
const ALL_CHARS_BITMAP = (1 << (ALL_CHARS.length + 1)) - 1;
const ALL_CHARS_BASE = ALL_CHARS.charCodeAt(0);

function char_to_bitmap(x) {
  if (x === BLOCK_CHAR)
    return 0;
  return x.toLowerCase().charCodeAt(0) - ALL_CHARS_BASE;
}

function bitmap_to_char(x) {
  return String.fromCharCode(x + ALL_CHARS_BASE);
}

class Wordlist {

  constructor(word_array) {
    this.words = [];
    this.word_bitmaps = [];
    this.scores = {};
    this.len_idx = new Map();

    for (var i=0; i < word_array.length; i++) {
      var w = word_array[i];
      var split = w.split(/;|\s/);
      if (split.length >= 2) {
        var [word, score] = [split[0], parseInt(split[1], 10)];
      } else {
        var [word, score] = [split[0], 1];
      }
      this.scores[word] = score;
      this.words.push(word);
    }

    // Sort by length, then by score descending, then alphabetically.
    // This means we can easily find the highest ranked words of a given
    // length.
    var self = this;
    this.words.sort(function(a, b) {

      if (a.length != b.length)
        return a.length - b.length;

      if (self.scores[b] != self.scores[a])
        return self.scores[b] - self.scores[a];

      return a.localeCompare(b);
    });

    for (var i = 0; i < this.words.length; i++) {
      var wlen = this.words[i].length;
      if (!this.len_idx.has(wlen)) {
        this.len_idx.set(wlen, i);
      }
      var bitmap = [];
      var word = this.words[i];
      for (var j=0; j < word.length; j++) {
        bitmap.push(1 << char_to_bitmap(word[j]));
      }
      this.word_bitmaps.push(bitmap);
    }
    console.log(this.words.length + " words loaded.");
  }

  at(index) {
    return this.words[index];
  }

  bitmap_at(index) {
    return this.word_bitmaps[index];
  }

  score(value) {
    return this.scores[value];
  }

  index(length) {
    var val = this.len_idx.get(length);
    if (val === undefined) {
      val = this.words.length;
    }
    return val;
  }
}

class Cell {
  constructor(cell_id, value) {
    this.value = value;
    this.cell_id = cell_id;
    this.resetValid();
  }

  resetValid() {
    if (this.value != UNFILLED_CHAR) {
      this.valid_letters = 1 << char_to_bitmap(this.value);
    } else {
      this.valid_letters = ALL_CHARS_BITMAP;
    }
  }

  set(value) {
    this.value = value;
    this.resetValid();
  }

  validLettersString() {
    var valid = [];
    for (var i=0; i < ALL_CHARS.length; i++) {
      var ch = ALL_CHARS[i];
      if ((1 << char_to_bitmap(ch)) & this.valid_letters) {
        valid.push(ch);
      }
    }
    return valid.join("");
  }

  checkpoint() {
    return [this.value, this.valid_letters];
  }

  restore(state) {
    this.value = state[0];
    this.valid_letters = state[1];
  }

  cross(e) {
    if (e == this.across_entry) {
      return this.down_entry;
    }
    return this.across_entry;
  }

  setEntry(e, direction) {
    if (direction === DIR_ACROSS) {
      this.across_entry = e;
    } else {
      this.down_entry = e;
    }
  }

  getValidLetters() {
    return this.valid_letters;
  }

  entry(direction) {
    return (direction === DIR_DOWN) ? this.down_entry : this.across_entry;
  }

  applyMask(valid_bitmap) {
    this.valid_letters &= valid_bitmap;
  }

  getValue() {
    return this.value;
  }

  getId() {
    return this.cell_id;
  }
}

class Entry {
  constructor(cells, direction, wordlist, grid) {
    this.cells = cells;
    this.direction = direction;
    this.wordlist = wordlist;
    this.grid = grid;
    this.fill_index = 0;

    this.resetDict();
    this.satisfy();
  }

  resetDict() {
    var start = this.wordlist.index(this.cells.length);
    var end = this.wordlist.index(this.cells.length + 1);
    this.valid_words = [];
    for (var i = 0; i < end-start; i++) {
      this.valid_words.push(start + i);
    }
  }

  randomize(amt) {
    if (amt <= 0.0 || amt > 1.0)
      return;

    for (let i = 0; i < amt * this.valid_words.length; i++) {
      var x = Math.floor(Math.random() * this.valid_words.length);
      var y = Math.floor(Math.random() * this.valid_words.length);
      var tmp = this.valid_words[x];
      this.valid_words[x] = this.valid_words[y];
      this.valid_words[y] = tmp;
    }
  }

  checkpoint() {
    return [this.valid_words.slice(), this.fill_index];
  }

  restore(state) {
    this.valid_words = state[0];
    this.fill_index = state[1];
  }

  cellPattern() {
    var pattern = "";
    for (var i = 0; i < this.cells.length; i++) {
      pattern += this.cells[i].getValue().toLowerCase();
    }
    return pattern;
  }

  bitPattern() {
    var pattern = [];
    for (var i = 0; i < this.cells.length; i++) {
      pattern.push(this.cells[i].getValidLetters());
    }
    return pattern;
  }

  completed() {
    var pattern = this.cellPattern();
    return pattern.indexOf(UNFILLED_CHAR) === -1;
  }

  cellIndex(cell_id) {
    for (var i = 0; i < this.cells.length; i++) {
      if (this.cells[i].getId() == cell_id)
        return i;
    }
    return -1;
  }

  recomputeValidLetters() {
    var fills;
    if (this.completed()) {
      fills = [this.bitPattern()];
    } else {
      fills = [];
      for (var i = 0; i < this.valid_words.length; i++) {
        fills.push(this.wordlist.bitmap_at(this.valid_words[i]));
      }
      for (i = 0; i < this.cells.length; i++) {
        var valid_letters = 0;
        for (var j = 0; j < fills.length; j++) {
          valid_letters |= fills[j][i];
        }
        this.cells[i].applyMask(valid_letters);
      }
    }
  }

  fill() {
    if (this.fill_index >= this.valid_words.length) {
      return null;
    }

    var fill = this.wordlist.at(this.valid_words[this.fill_index]);
    for (var i = 0; i < fill.length; i++) {
      this.cells[i].set(fill.charAt(i));
    }
    return fill;
  }

  satisfy() {
    var pattern = this.bitPattern();

    var orig_len = this.valid_words.length;
    var new_valid = [];
    for (var i = 0; i < orig_len; i++) {
      var word = this.wordlist.at(this.valid_words[i]);

      if (this.grid.isUsed(word)) {
        continue;
      }

      if (word.length != pattern.length) {
        continue;
      }

      var skip = false;
      var bitmap = this.wordlist.bitmap_at(this.valid_words[i]);
      for (var j = 0; j < pattern.length; j++) {
        if (!(pattern[j] & bitmap[j])) {
          skip = true;
          break;
        }
      }
      if (skip) {
        continue;
      }

      new_valid.push(this.valid_words[i]);
    }
    this.valid_words = new_valid;
    this.recomputeValidLetters();
    return orig_len != this.valid_words.length;
  }

  nextWord() {
    this.fill_index += 1;
  }

  numFills() {
    if (this.completed()) {
      return 1;
    }
    return this.valid_words.length;
  }

  fills() {
    var self = this;
    return this.valid_words.map(function(i) {
      var word = self.wordlist.at(i);
      var score = self.wordlist.score(word);
      return [word, '' + score]
    });
  }
}

class StackLevel {
}

class Grid {
  constructor(template, wordlist) {
    var rows = template.trim().split("\n");
    this.height = rows.length;
    this.width = rows[0].length;
    this.cells = [];
    this.entries = [];
    this.used_words = new Set();

    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        var cell_id = y * this.width + x;

        this.cells.push(new Cell(cell_id, rows[y][x]));
      }
    }

    for (var dir = DIR_ACROSS; dir <= DIR_DOWN; dir++) {

      var xincr = (dir == DIR_ACROSS) ? 1 : 0;
      var yincr = (dir == DIR_DOWN) ? 1 : 0;

      for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {

          var is_black = rows[y][x] === BLOCK_CHAR;
          var start_of_row = (dir == DIR_ACROSS && x == 0) ||
                             (dir == DIR_DOWN && y == 0);

          var start_of_entry = ((!is_black) &&
            // previous character was '#' or start of line?
            (start_of_row || rows[y - yincr][x - xincr] == BLOCK_CHAR) &&
            // next character not '#'?, i.e. exclude unchecked squares
            (x + xincr < this.width && y + yincr < this.height &&
             rows[y + yincr][x + xincr] != BLOCK_CHAR))

          if (!start_of_entry)
            continue;

          var cell_list = [];
          var [xt, yt] = [x, y];
          for (; xt < this.width && yt < this.height; xt += xincr, yt += yincr) {
            if (rows[yt][xt] == BLOCK_CHAR)
              break;

            cell_list.push(this.cells[yt * this.width + xt]);
          }
          var entry = new Entry(cell_list, dir, wordlist, this);
          this.entries.push(entry);

          for (var i=0; i < cell_list.length; i++) {
            cell_list[i].setEntry(entry, dir);
          }
        }
      }
    }
    this.satisfyAll();
  }

  satisfyAll() {
    var changed = true;
    while (changed) {
      changed = false;
      for (var i = 0; i < this.entries.length; i++) {
        var this_changed = this.entries[i].satisfy();
        changed = changed || this_changed;
      }
    }
  }

  randomize(amt) {
    for (var i = 0; i < this.entries.length; i++) {
      this.entries[i].randomize(amt);
    }
  }

  isUsed(word) {
    return this.used_words.has(word);
  }

  getNextFillVictim() {
    var nfills = -1;
    var best = this.entries[0];
    for (var i = 0; i < this.entries.length; i++) {
      var entry = this.entries[i];
      if (entry.completed())
        continue;

      var this_fills = this.entries[i].numFills();
      if (nfills == -1 || this_fills < nfills) {
        best = entry;
        nfills = this_fills;
      }
    }
    return best;
  }

  numFills() {
    var fills = this.entries.map(function(x) {
      return x.numFills();
    });
    var sum = 0;
    for (var i = 0; i < fills.length; i++) {
      if (!fills[i])
        return 0;
      sum += fills[i];
    }
    if (sum == fills.length)
      return 1;

    return sum;
  }

  getFills(x, y, direction) {
    // get entry from position
    if (x < 0 || x >= this.width || y < 0 || y >= this.height ||
        direction < DIR_ACROSS || direction > DIR_DOWN) {
      throw "out of range";
    }

    var cell = this.cells[this.width * y + x];
    var entry = cell.entry(direction);

    if (!entry)
      return [];

    return entry.fills();
  }

  getCellLetters(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      throw "out of range";
    }

    var cell_id = this.width * y + x;
    var cell = this.cells[cell_id];
    var across_entry = cell.entry(0);
    var down_entry = cell.entry(1);
    var result = new Map();

    for (const entry of [across_entry, down_entry]) {
      if (!entry)
        continue;

      var alphact = new Map();
      var offset = entry.cellIndex(cell_id);
      for (const f of entry.fills()) {
        var alpha = f[0].charAt(offset);
        var ct = alphact.get(alpha) || 0;
        alphact.set(alpha, ct + 1);
      }
      for (var [k, v] of alphact.entries()) {
        // $FlowFixMe
        if (!result.has(k) || result.get(k) > v) {
          result.set(k, v);
        }
      }
    }
    return result;
  }

  fillStep(stack) {
    var stackLevel = stack.pop();

    // if we already filled at this level, restore pre-fill state
    // and advance to next word
    if (stackLevel.saved_entries) {
      stackLevel.saved_cells.map(function(saved) {
        saved[0].restore(saved[1]);
      });
      stackLevel.saved_entries.map(function(saved) {
        saved[0].restore(saved[1]);
      });
      this.used_words.delete(stackLevel.filled_word);
      stackLevel.entry.nextWord();
      this.satisfyAll();
    }

    // finished?
    var num_fills = this.numFills();
    if (num_fills == 1) {
      this.entries.forEach(function(e) {
        if (!e.completed()) {
          e.fill();
        }
      });
      return true;
    }

    // backtrack?
    if (num_fills == 0) {
      return false;
    }

    stackLevel.saved_entries = this.entries.map(function(e) {
      return [e, e.checkpoint()];
    });
    stackLevel.saved_cells = this.cells.map(function(c) {
      return [c, c.checkpoint()];
    });

    // fill next best word
    var fill = stackLevel.entry.fill();
    if (!fill) {
      return false;
    }

    stackLevel.filled_word = fill;
    this.used_words.add(fill);

    // fill next level down
    stack.push(stackLevel);
    stackLevel = new StackLevel();
    this.satisfyAll();
    stackLevel.entry = this.getNextFillVictim();
    stack.push(stackLevel);
    return false;
  }

  // return [stack, done]
  fillOne(stack) {

    if (!stack) {
      stack = [];

      var stackLevel = new StackLevel();
      this.satisfyAll();
      stackLevel.entry = this.getNextFillVictim();
      stack.push(stackLevel);
    }

    if (!stack.length)
      return [stack, true];

    var result = this.fillStep(stack);
    return [stack, result];
  }

  fillAsync(callback, state) {
    var newstate, done;
    var self = this;
    [newstate, done] = this.fillOne(state);
    callback(this.toString(), function() {
      if (!done) {
        self.fillAsync(callback, newstate);
      }
    });
  }

  fill() {

    var stack = [];

    var stackLevel = new StackLevel();
    this.satisfyAll();
    stackLevel.entry = this.getNextFillVictim();
    stack.push(stackLevel);

    while (stack.length) {
      if (this.fillStep(stack))
        return 1;
      console.log(" => " + this.toString());
    }
    return 0;
  }

  toString() {
    var self = this;
    return this.cells.map(function(c) {
      var str = '';
      if ((c.getId() % self.width) == 0)
        str += "\n";
      str += c.getValue();
      return str;
    }).join("").trim();
  }
}

class Filler {
  constructor(template, wordlist) {
    this.grid = new Grid(template, wordlist);
    this.wordlist = wordlist;
  }

  updateGrid(template) {
    this.grid = new Grid(template, this.wordlist);
  }

  fillAsync(randomize, callback) {
    this.grid.randomize(randomize);
    this.grid.fillAsync(callback);
  }

  fill() {
    this.grid.fill();
    return this.grid.toString();
  }

  getFills(x, y, direction) {
    return this.grid.getFills(x, y, direction);
  }

  getCellLetters(x, y) {
    return this.grid.getCellLetters(x, y);
  }

  estimatedFills() {
    return this.grid.numFills();
  }
}

module.exports = {
  filler: Filler,
  wordlist: Wordlist
};
