const carCanvas = document.getElementById("carCanvas");
carCanvas.width = window.innerWidth - 330;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;
const miniMapCanvas = document.getElementById("miniMapCanvas");
miniMapCanvas.width = 300;
miniMapCanvas.height = 300;

// this way carCanvas each times gets refreshed when function is called
carCanvas.height = window.innerHeight;
networkCanvas.height = window.innerHeight - 300;

// it contains all the tools for drawing on the context
const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

console.log(world);
// const worldString = localStorage.getItem("world");
// const worldInfo = worldString ? JSON.parse(worldString) : null;
// const world = worldInfo ? World.load(worldInfo) : new World(new Graph());

const viewport = new ViewPort(carCanvas, world.zoom, world.offset);
const miniMap = new MiniMap(miniMapCanvas, world.graph, 300);

const N = 100;
const cars = generateCars(N);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.1);
    }
  }
}

// We are not dealing with traffic yet, so we will just go with a car
// const traffic = [
//   new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2, getRandomColor()),
//   new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2, getRandomColor()),
//   new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2, getRandomColor()),
//   new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2, getRandomColor()),
//   new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2, getRandomColor()),
//   new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 2, getRandomColor()),
//   new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2, getRandomColor()),
// ];
const traffic = [];
// const roadBorders = world.buildings
//   .map((b) => b.base.segments)
//   .flat()
//   .map((s) => [s.p1, s.p2]);

const roadBorders = world.roadBorders.map((s) => [s.p1, s.p2]);

animate();

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
  localStorage.removeItem("bestBrain");
}

function generateCars(N) {
  const startPoints = world.markings.filter((m) => m instanceof Start);
  const startPoint =
    startPoints.length > 0 ? startPoints[0].center : new Point(100, 100);
  const dir =
    startPoints.length > 0 ? startPoints[0].directionVector : new Point(0, -1);
  const startAngle = -angle(dir) + Math.PI / 2;

  const cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(startPoint.x, startPoint.y, 30, 50, "AI", startAngle));
  }
  return cars;
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(roadBorders, []);
  }

  for (let i = 0; i < cars.length; i++) {
    cars[i].update(roadBorders, traffic);
  }

  bestCar = cars.find(
    (c) => c.fitness == Math.max(...cars.map((c) => c.fitness))
  );

  world.cars = cars;
  world.bestCar = bestCar;

  viewport.offset.x = -bestCar.x;
  viewport.offset.y = -bestCar.y;

  viewport.reset();
  const viewPoint = scale(viewport.getOffset(), -1);
  world.draw(carCtx, viewPoint, false);
  miniMap.update(viewPoint);

  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx);
  }

  networkCtx.lineDashOffset = -time / 50;
  networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  // it calls the given function again and again many times
  // which gives the illusion of movement
  requestAnimationFrame(animate);
}
