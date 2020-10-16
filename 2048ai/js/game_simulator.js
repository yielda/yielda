GameSimulator = (function() {
function makeMoveFunction(vector, swapIndex) {
  return function (simulator) {
    var matrix = simulator.matrix;
    var nEmpty = 0, score = 0, moved = 0;
    var i, j, k, x1, x2, y1, y2;
    for (i = 0; i < 4; ++i) {
      for (k = j = 0; j < 4; ++j) {
        [x1, y1] = swapIndex(i, vector[k]);
        [x2, y2] = swapIndex(i, vector[j]);
        if (j == k || matrix[x2][y2] == 0) {
            continue;
        }
        if (matrix[x1][y1] == matrix[x2][y2]) {
            matrix[x1][y1] <<= 1;
            simulator.maxNum = Math.max(matrix[x1][y1], simulator.maxNum);
            score += matrix[x1][y1];
            nEmpty += 1;
            ++k;
        } else {
            if (matrix[x1][y1]) {
                ++k;
                if (k == j) {
                    continue;
                }
            }
            [x1, y1] = swapIndex(i, vector[k]);
            matrix[x1][y1] = matrix[x2][y2];
        }
        matrix[x2][y2] = 0;
        moved = 1;
      }
    }
    if (score > 0) {
        simulator.nEmpty += nEmpty;
        simulator.score += score;
        return score;
    }
    return moved;
  };
}

var directions = {'up': 0, 'right': 1, 'down': 2, 'left': 3};
var moveFunctions = [
  /* up    */ makeMoveFunction([0, 1, 2, 3], (x, y) => [y, x]),
  /* right */ makeMoveFunction([3, 2, 1, 0], (x, y) => [x, y]),
  /* down  */ makeMoveFunction([3, 2, 1, 0], (x, y) => [y, x]),
  /* left  */ makeMoveFunction([0, 1, 2, 3], (x, y) => [x, y])
];


function MySimulator() {
  this.matrix = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
  this.nEmpty = 16;
  this.maxNum = 0;
  this.score = 0;
}

MySimulator.prototype.copyFromGame = function(game) {
  this.nEmpty = 0;
  this.maxNum = 0;
  this.score = game.score;
  var grid = game.grid;
  for (var col = 0; col < grid.cells.length; col++) {
    for (var row = 0; row < grid.cells.length; row++) {
      var cell = grid.cells[col][row];
      if (cell) {
        this.matrix[row][col] = cell.value;
        if (cell.value > this.maxNum) {
          this.maxNum = cell.value;
        }
      } else {
        this.matrix[row][col] = 0;
        this.nEmpty++;
      }
    }
  }
};

MySimulator.prototype.copyFromAnother = function(another) {
  this.matrix = [
    [...another.matrix[0]],
    [...another.matrix[1]],
    [...another.matrix[2]],
    [...another.matrix[3]]
  ];
  this.nEmpty = another.nEmpty;
  this.maxNum = another.maxNum;
  this.score = another.score;
};

MySimulator.prototype.isAlive = function() { return this.isMovable(); };
MySimulator.prototype.isMovable = function() {
  if (this.nEmpty > 0) {
      return true;
  }
  var i, j;
  for (i = 0; i < 4; ++i) {
    for (j = 1; j < 4; ++j) {
      if (this.matrix[i][j - 1] == this.matrix[i][j] ||
          this.matrix[j - 1][i] == this.matrix[j][i]) {
        return true;
      }
    }
  }
  return false;
};

MySimulator.prototype.addNewRandomNum = function() {
  var randIndex = Math.round(Math.random() * 0xfffffff) % this.nEmpty;
  var i, j, count = 0;
  for (i = 0; i < 4; ++i) {
    for (j = 0; j < 4; ++j) {
      if (this.matrix[i][j] == 0) {
        if (count == randIndex) {
          // Probability of numbers, 2: 90%, 4: 10%
          var randnum = Math.random() < 0.9 ? 2 : 4;
          this.matrix[i][j] = randnum;
          this.maxNum = Math.max(randnum, this.maxNum);
          this.nEmpty -= 1;
          return [i, j];
        }
        ++count;
      }
    }
  }
  return null;
};

MySimulator.prototype.move = function(direction) {
  var moveIndex = direction;
  if (typeof direction === 'string') {
    moveIndex = directions[direction];
  }
  if (moveFunctions[moveIndex](this)) {
    this.addNewRandomNum();
    return true;
  }
  return false;
};

return MySimulator;
}());
