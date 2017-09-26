let wordlist = [
  [], [], [], [], [],
  [], [], [], [], [],
  [], [], [], [], [], []
];

openDefaultWordlist("https://raw.githubusercontent.com/keiranking/kCrossword/master/WL-MirriamWebster9thCollegiate.txt");

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
  for (let i = 3; i < wordlist.length; i++) {
    wordlist[i].sort();
  }
}

function openWordlist() {
  document.getElementById("open-wordlist-input").click();
}

function openWordlistFile(e) {
  wordlist = [
    [], [], [], [], [],
    [], [], [], [], [],
    [], [], [], [], [], []
  ];

  const file = e.target.files[0];
  if (!file) {
    return;
  }
  let reader = new FileReader();
  reader.onload = function(e) {
    const words = e.target.result.split(/\s/g);
    addToWordlist(words);
    sortWordlist();
    removeWordlistDuplicates();
  };
  reader.readAsText(file);
}

function openDefaultWordlist(url) {
  let textFile = new XMLHttpRequest();
  textFile.open("GET", url, true);
  textFile.onreadystatechange = function() {
    if (textFile.readyState === 4 && textFile.status === 200) {  // Makes sure the document is ready to parse, and it's found the file.
      const words = textFile.responseText.split(/\s/g);
      addToWordlist(words);
      sortWordlist();
    }
  }
  textFile.send(null);
}

function removeWordlistDuplicates() {
  for (let i = 3; i < wordlist.length; i++) {
    if (wordlist[i].length >= 2) {
      for (let j = wordlist[i].length - 1; j >0; j--) {
        if (wordlist[i][j] == wordlist[i][j - 1]) {
          wordlist[i].splice(j, 1);
        }
      }
    }
  }
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
