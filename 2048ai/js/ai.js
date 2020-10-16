function AI(game) {
  this.actualGame = game;
  this.bestDirection = null;
  this.isReallyMove = true;
  this.simulator = new GameSimulator()
  this.simulTime = 200;
  this.freshTime = 200;
  this.workersAvailable = false;
  if (window.Worker) {
    function onmessage(e) {
      var [direction, score, count] = e.data;
      this.acceptWorkerStat(direction, score, count);
    }
    try {
      this.workers = [];
      for (var i = 0; i < 4; i++) {
        worker = new Worker('js/ai.worker.js');
        worker.onmessage = onmessage.bind(this);
        this.workers.push(worker);
      }
      this.workersAvailable = true;
      this.freshTime = 5; /*0*/
    } catch (e) {
      alert("Worker not available.")
    }
  }
}

AI.prototype.runSimulations = function() {
  var endTime = new Date().getTime() + this.simulTime;
  var direction, directions = [0, 1, 2, 3];
  var simulator = new GameSimulator();
  var baseScore = this.simulator.score;
  while (true) {
    for (var i = 0; i < directions.length && new Date().getTime() < endTime; ++i) {
      direction = directions[i];
      simulator.copyFromAnother(this.simulator);
      if (simulator.move(direction)) {
          while (simulator.isAlive()) {
            simulator.move(Math.floor(Math.random() * 4));
          }
          this.simulScores[direction] += simulator.score - baseScore;
          this.simulCounts[direction] += 1;
      } else {
        delete directions[i];
      }
    }
    if (new Date().getTime() > endTime) {
      break;
    }
    directions = directions.filter(function(x){ return x != undefined; });
  }
}

AI.prototype.autoMove = function() {
  if (!this.actualGame.isGameTerminated() && this.actualGame.aiIsRunning) {
    var simulTime = parseInt(document.getElementById('simulTime').value);
    // If workersAvailable, 200(ms) animation fresh time.
    if (!isNaN(simulTime) && simulTime > 0) {
      this.simulTime = Math.max(simulTime, this.workersAvailable ? 200 : 20);
    }
    this.simulator.copyFromGame(this.actualGame);
    this.initSimulStat();
    if (this.workersAvailable) {
      for (var i = 0; i < 4; ++i) {
        this.workers[i].postMessage([{...this.simulator}, i, this.simulTime]);
      }
    } else {
      this.runSimulations();
      this.selectDirectionAndDoActualMove();
    }
  }
}

AI.prototype.initSimulStat = function() {
  this.simulScores = [0, 0, 0, 0];
  this.simulCounts = [0, 0, 0, 0];
  this.numFinished = 0;
}

AI.prototype.acceptWorkerStat = function(direction, score, count) {
  this.simulScores[direction] = score;
  this.simulCounts[direction] = count;
  this.numFinished += 1;
  if (this.numFinished == 4) {
    this.selectDirectionAndDoActualMove();
  }
}

AI.prototype.selectDirectionAndDoActualMove = function() {
  this.selectDirection();
  if (this.isReallyMove) {
    var bestDirection = this.bestDirection;
    this.actualGame.move(bestDirection);
    var direction = ['up', 'right', 'down', 'left'][bestDirection];
    // var arrow = ['↑', '→', '↓', '←'][bestDirection];
    // var arrow = ['⇑', '⇒', '⇓', '⇐'][bestDirection];
    // console.log(arrow);
    // console.log(direction);
    // this.actualGame.actuator.addToConsole(direction, this.simulScores, this.simulCounts);
    setTimeout(this.autoMove.bind(this), this.freshTime);
  }
}

AI.prototype.selectDirection = function() {
  var maxScores = -1;
  for (var i = 0; i < 4; ++i) {
    if (this.simulCounts[i] != 0 && this.simulScores[i] > maxScores) {
      this.bestDirection = i;
      maxScores = this.simulScores[i];
    }
  }
}
