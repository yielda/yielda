function AI(game) {
  this.actualGame = game;
  this.storage = game.storageManager;
  this.bestDirection = null;
  this.isReallyMove = true;
  this.simulator = new GameSimulator();
  this.simulTime = 200;
  this.freshTime = 200;
  this.isRunning = false;
  this.isPaused = false;
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
      alert("Worker not available.");
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
  if (!this.actualGame.isGameTerminated() && this.isRunning) {
    var elem = document.getElementById('simulTime');
    var simulTime = parseInt(elem.value);
    // If workersAvailable, 200(ms) animation fresh time.
    if (!isNaN(simulTime) && simulTime > 0) {
      this.simulTime = Math.max(simulTime, this.workersAvailable ? 200 : 20);
    }
    elem.value = this.simulTime;
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
  } else {
    this.isRunning = false;
    this.isReallyMove = true;
    this.showCachedHint();
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

AI.prototype.showHint = function() {
  if (this.isRunning) {
    // console.log("showHint: AI is running");
    return;
  }
  if (!this.showCachedHint()) {
    this.isRunning = true;
    this.isReallyMove = false;
    this.autoMove();
  }
}

AI.prototype.showCachedHint = function() {
  if (this.bestDirection != null) {
    var type = ['up', 'right', 'down', 'left'][this.bestDirection];
    var hint = ['⇑', '⇒', '⇓', '⇐'][this.bestDirection];
    // console.log("showCachedHint: " + hint);
    this.actualGame.actuator.showHint(type, hint);
    return true;
  }
  return false;
}

AI.prototype.run = function() {
  this.isRunning = true;
  this.isPaused = false;
  this.saveState(true);
  this.autoMove();
  document.querySelector('.run-ai-button').innerHTML = 'Stop AI';
  document.body.classList.add('stop-ai');
  document.body.classList.remove('run-ai');
}

AI.prototype.stop = function() {
  this.isRunning = false;
  this.isPaused = false;
  this.saveState(false);
  document.querySelector('.run-ai-button').innerHTML = 'Run AI';
  document.body.classList.add('run-ai');
  document.body.classList.remove('stop-ai');
}

AI.prototype.toggle = function() {
  if (this.isRunning) {
    this.stop();
  } else {
    this.run();
  }
}

AI.prototype.pause = function() {
  this.isPaused = true;
  this.isRunning = false;
  this.saveState(false);
  document.querySelector('.run-ai-button').innerHTML = 'Paused';
  document.body.classList.add('run-ai');
  document.body.classList.remove('stop-ai');
}

AI.prototype.checkContinue = function() {
  if (this.isPaused) {
    this.run();
  }
}

AI.prototype.checkPauseOrStop = function() {
  this.bestDirection = null;
  if (this.actualGame.isGameTerminated() && this.isRunning) {
    if (this.actualGame.won && !this.actualGame.over) {
      this.pause();
    } else {
      this.stop();
    }
  }
}

AI.prototype.saveState = function(state) {
  this.storage.set('ai-is-running', this.isRunning);
  this.storage.set('ai-simul-time', this.simulTime);
}

AI.prototype.loadState = function() {
  var value = this.storage.get('ai-simul-time', 200);
  document.getElementById('simulTime').value = value;
  if (this.storage.get('ai-is-running', false)) {
    this.run();
  }
}
