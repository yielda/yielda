onmessage = function (e) {
  var score = 0, count = 0;
  var [ai, direction] = e.data;
  var endTime = new Date().getTime() + ai.simulTime;
  var baseScore = ai.simulator.score;
  var simulator = new GameSimulator();
  while (new Date().getTime() < endTime) {
    simulator.copyFromAnother(ai.simulator);
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
  // ai.acceptWorkerStat(direction, score, count);
  postMessage(direction, score, count);
};
