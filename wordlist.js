var wordlist = [
  [], [], [], [], [],
  [], [], [], [], [],
  [], [], [], [], [], []
];

importWordlist("https://raw.githubusercontent.com/keiranking/kCrossword/master/wordlist.txt");
addToWordlist(["cat", "dog", "urn", "hot", "box", "goo", "air", "eve", "ear", "owe", "you"]);
addToWordlist(["area", "barn", "door", "fool", "cord", "wood", "look", "joke", "lark", "auld", "lang"]);
addToWordlist(["mark", "meal", "more", "most", "milk", "mess", "mush", "musk", "muss", "muse", "myth"]);

sortWordlist();

//____________________
// F U N C T I O N S

function addToWordlist(words) {
  for (i = 0; i < words.length; i++) {
    const word = words[i].trim();
    wordlist[word.length].push(word.toUpperCase());
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

function match(word) {
  const l = word.length;
  word = word.split("-").join("\\w");
  const pattern = new RegExp(word);
  var matches = [];
  for (var i = 0; i < wordlist[l].length; i++) {
    if (wordlist[l][i].search(pattern) > -1) {
      matches.push(wordlist[l][i]);
    }
  }
  return matches;
}

function updateMatchesUI() {
  var acrossMatchList = document.getElementById("across-matches");
  var downMatchList = document.getElementById("down-matches");
  acrossMatchList.innerHTML = "";
  downMatchList.innerHTML = "";
  const acrossMatches = match(current.acrossWord);
  const downMatches = match(current.downWord);
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
