var wordlist = [
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
    const word = newWords[i].trim();
    if (word.length < wordlist.length) { // Make sure we don't access outside the wordlist array
      wordlist[word.length].push(word.toUpperCase());
    }
  }
}

function sortWordlist() {
  for (i = 3; i < wordlist.length; i++) {
    wordlist[i].sort();
  }
}

function importWordlist(url) {
  var textFile = new XMLHttpRequest();
  textFile.open("GET", url, true);
  textFile.onreadystatechange = function() {
    if (textFile.readyState === 4 && textFile.status === 200) {  // Makes sure the document is ready to parse, and it's found the file.
      const words = textFile.responseText.split("\n"); // Will separate each line into an array
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
    var matches = [];
    for (var i = 0; i < wordlist[l].length; i++) {
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
  var acrossMatchList = document.getElementById("across-matches");
  var downMatchList = document.getElementById("down-matches");
  acrossMatchList.innerHTML = "";
  downMatchList.innerHTML = "";
  const acrossMatches = matchFromWordlist(current.acrossWord);
  const downMatches = matchFromWordlist(current.downWord);
  for (i = 0; i < acrossMatches.length; i++) {
    var li = document.createElement("LI");
    li.innerHTML = acrossMatches[i].toLowerCase();
    acrossMatchList.appendChild(li);
  }
  for (i = 0; i < downMatches.length; i++) {
    var li = document.createElement("LI");
    li.innerHTML = downMatches[i].toLowerCase();
    downMatchList.appendChild(li);
  }
}
// class Rectangle {
//   constructor(height, width) {
//     this.height = height;
//     this.width = width;
//   }
// }
