let wordlist = [
  [], [], [], [], [],
  [], [], [], [], [],
  [], [], [], [], [], []
];

// importWordlist("https://raw.githubusercontent.com/keiranking/kCrossword/master/wordlist.txt");
importWordlist("https://raw.githubusercontent.com/keiranking/kCrossword/master/WL-MirriamWebster9thCollegiate.txt");
sortWordlist();

//____________________
// F U N C T I O N S

function addToWordlist(newWords) {
  for (i = 0; i < newWords.length; i++) {
    const word = newWords[i].trim().toUpperCase();
    if (word.length < wordlist.length) { // Make sure we don't access outside the wordlist array
      wordlist[word.length].push(word);
    }
  }
}

function sortWordlist() {
  for (i = 3; i < wordlist.length; i++) {
    wordlist[i].sort();
  }
}

function importWordlist(url) {
  let textFile = new XMLHttpRequest();
  textFile.open("GET", url, true);
  textFile.onreadystatechange = function() {
    if (textFile.readyState === 4 && textFile.status === 200) {  // Makes sure the document is ready to parse, and it's found the file.
      const words = textFile.responseText.split(/\s/g);
      addToWordlist(words);
    }
  }
  textFile.send(null);
}

function matchFromWordlist(word) {
  const l = word.length;
  const actualLettersInWord = word.replace(/-/g, "").length;
  if (actualLettersInWord >= 1 && actualLettersInWord < l) { // Only search if word isn't completely blank or filled
    word = word.split(DASH).join("\\w");
    const pattern = new RegExp(word);
    let matches = [];
    for (let i = 0; i < wordlist[l].length; i++) {
      if (wordlist[l][i].search(pattern) > -1) {
        matches.push(wordlist[l][i]);
      }
    }
    return matches;
  } else {
    return [];
  }
}

function updateMatchesUI() {
  let acrossMatchList = document.getElementById("across-matches");
  let downMatchList = document.getElementById("down-matches");
  acrossMatchList.innerHTML = "";
  downMatchList.innerHTML = "";
  const acrossMatches = matchFromWordlist(current.acrossWord);
  const downMatches = matchFromWordlist(current.downWord);
  for (i = 0; i < acrossMatches.length; i++) {
    let li = document.createElement("LI");
    li.innerHTML = acrossMatches[i].toLowerCase();
    li.className = "";
    // li.addEventListener('click', printScore);
    li.addEventListener('dblclick', fillGridWithMatch);
    acrossMatchList.appendChild(li);
  }
  for (i = 0; i < downMatches.length; i++) {
    let li = document.createElement("LI");
    li.innerHTML = downMatches[i].toLowerCase();
    li.className = "";
    li.addEventListener('dblclick', fillGridWithMatch);
    downMatchList.appendChild(li);
  }
}

function fillGridWithMatch() {
  const li = event.currentTarget;
  const fill = li.innerHTML.toUpperCase();
  const dir = (li.parentNode.id == "across-matches") ? ACROSS : DOWN;

  if (dir == ACROSS) {
    for (let i = current.acrossStartIndex; i < current.acrossEndIndex; i++) {
      const square = grid.querySelector('[data-row="' + current.row + '"]').querySelector('[data-col="' + i + '"]');
      square.lastChild.innerHTML = fill[i - current.acrossStartIndex];
    }
  } else {
    for (let j = current.downStartIndex; j < current.downEndIndex; j++) {
      const square = grid.querySelector('[data-row="' + j + '"]').querySelector('[data-col="' + current.col + '"]');
      square.lastChild.innerHTML = fill[j - current.downStartIndex];
    }
  }
  console.log("Filled '" + li.innerHTML + "' going " + dir);
  updateActiveWords();
  updateMatchesUI();
}

// function printScore() {
//   console.log(scoreWord(event.currentTarget.innerHTML));
// }

// function scoreWord(word) {
//   let f = new XMLHttpRequest();
//   f.open("GET", "http://crosswordtracker.com/answer/" + word + "/", true);
//   f.onreadystatechange = function() {
//     if (f.readyState === 4 && f.status === 200) {
//       const raw = f.responseText;
//       return raw;
//     }
//   }
// }

// class Rectangle {
//   constructor(height, width) {
//     this.height = height;
//     this.width = width;
//   }
// }
