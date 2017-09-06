var wordlist = [
  [], [], [], [], [],
  [], [], [], [], [],
  [], [], [], [], [], []
];

addToWordlist(["cat", "dog", "urn", "hot", "box", "goo", "air", "eve", "ear", "owe", "you"]);
addToWordlist(["area", "barn", "door", "fool", "cord", "wood", "look", "joke", "lark", "auld", "lang"]);

//____________________
// F U N C T I O N S

function addToWordlist(words) {
  for (i = 0; i < words.length; i++) {
    wordlist[words[i].length].push(words[i].toUpperCase());
  }
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

// class Rectangle {
//   constructor(height, width) {
//     this.height = height;
//     this.width = width;
//   }
// }
