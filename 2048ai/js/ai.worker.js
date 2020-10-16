importScripts("game_simulator.js");

onmessage = function (e) {
  var score = 0, count = 0;
  var [another, direction, simulTime] = e.data;
  var endTime = new Date().getTime() + simulTime;
  var simulator = new GameSimulator();
  var baseScore = another.score;
  while (new Date().getTime() < endTime) {
    simulator.copyFromAnother(another);
    if (simulator.move(direction)) {
        while (simulator.isAlive()) {
          simulator.move(Math.floor(Math.random() * 4));
        }
        score += simulator.score - baseScore;
        count += 1;
    } else {
      break;
    }
  }
  postMessage(direction, score, count);
};
