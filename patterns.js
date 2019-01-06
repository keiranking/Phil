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

function createRandomPattern(numRows, numColumns) {
  pattern = []
  for (let i = 0; i < numRows; i++){
    for (let j = 0; j < numColumns/2 ; j++){
      let canFillSquare = canSquareBeFilled(pattern, i, j);
      let shouldFillSquare = Math.random() < 0.75;
      if (shouldFillSquare && canFillSquare) {
        pattern.push([i, j]);
      }
    }
  }
  console.log("Generated pattern.");
  return pattern;
}

function isFilled(pattern, row, column){
  return pattern.some(function(square) {
    return (square[0] === row && square[1] === column)
      || (square[0] === 14 - row && square[1] === 14 - column);
  });
}

function canSquareBeFilled(pattern, i, j){
  let leftClear = sideIsClear(pattern, i, j, 0, j, 0, -1)
  let rightClear = sideIsClear(pattern, i, j, 7, j, 0 , 1)
  let upClear = sideIsClear(pattern, i, j, 0, i, -1, 0)
  let downClear = sideIsClear(pattern, i, j, 14, i, 1, 0)
  if (leftClear && rightClear && upClear && downClear) {
    return true;
  }
  return false;
}

function sideIsClear(pattern, i, j, bound, pivot, imultiplier, jmultiplier){
  if (pivot === 0) {
    return true
  } else if (pivot + ((imultiplier + jmultiplier) * 1) === bound || pivot + ((imultiplier + jmultiplier) * 2) === bound) {
    if (isFilled(pattern, i + (imultiplier * 1), j + (jmultiplier * 1))){
      return true;
    }
    return false;
  } else if (pivot + (imultiplier + jmultiplier) * 3 === bound) {
    if ((!isFilled(pattern, i + (imultiplier * 1), j + (jmultiplier * 1)) &&
      !isFilled(pattern, i + (imultiplier * 2), j + (jmultiplier * 2)) &&
      !isFilled(pattern, i + (imultiplier * 3), j + (jmultiplier * 3)) )
    ) {
      return true;
    }
    return false;
  } else {
    if (
      isFilled(pattern, i + (imultiplier * 2), j + (jmultiplier * 2)) ||
      isFilled(pattern, i + (imultiplier * 3), j + (jmultiplier * 3))
      ){
      return false;
    }
    return true;
  }
}
