let shape = null;
let colors = ['#FF0000', '#ffffff'];

const defaultShapes = {
  square: {
    name: 'square',
    points: [
      { x: 350, y: 350 },
      { x: 650, y: 350 },
      { x: 650, y: 650 },
      { x: 350, y: 650 }
    ]
  },
  rect: {
    name: 'rect',
    points: [
      { x: 200, y: 350 },
      { x: 800, y: 350 },
      { x: 800, y: 650 },
      { x: 200, y: 650 }
    ]
  },
  triangle: {
    name: 'triangle',
    points: [
      { x: 350, y: 650 },
      { x: 650, y: 650 },
      { x: 500, y: 350 }
    ]
  },
  circle: { x: 500, y: 500, radius: 200},
}

const drawDefaultShapes = {
  square: () => draw(defaultShapes.square),
  rect: () => draw(defaultShapes.rect),
  triangle: () => draw(defaultShapes.triangle),
  circle: () => drawCircle(defaultShapes.circle),
}

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const mappedKeysActions = {
  move: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  clear: ['Delete', 'Backspace', 'Escape'],
  scale: ['+', '-'],
  rotate: ['r', 'R'],
}

const mappedKeys = Object.values(mappedKeysActions).flat();

function actionKey(key) {
  if (mappedKeysActions.move.includes(key)) {
    const direction = key.replace('Arrow', '').toLowerCase();
    move(direction, 10);
  } else if (mappedKeysActions.clear.includes(key)) {
    clearAll();
  } else if (mappedKeysActions.scale.includes(key)) {
    const scale = 1 + parseFloat(`${key}0.1`)
    scaleShape(scale);
  } else if (mappedKeysActions.rotate.includes(key)) {
    rotateShape(10);
  }
}

document.addEventListener("keydown", function(event) {
  if (mappedKeys.includes(event.key)) {
    actionKey(event.key);
  }
});

document.getElementById('shapes-select').addEventListener('keydown', function(event) {
  event.preventDefault();
});

function clearAll() {
  const shapes = document.getElementById('shapes-select');
  shapes.value = '';
  const actions = document.getElementById('actions-select');
  actions.style.display = 'none';
  clearCanvas();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shape = null;
}

function draw(props) {
  const { points, name } = props;

  clearCanvas();

  // Calculando os extremos para o gradiente
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  // Cria um gradiente que cobre a forma horizontalmente do ponto mais à esquerda/baixo ao mais à direita/cima
  let gradient = ctx.createLinearGradient(minX, maxY, maxX, minY);
  colors.forEach((color, index) => gradient.addColorStop(index, color));

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(vertex => {
      ctx.lineTo(vertex.x, vertex.y);
  });

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'black';
  ctx.closePath();
  ctx.stroke(); 

  shape = { name, points};
}

function drawCircle(props) {
  const { x, y, radius } = props;

  clearCanvas();
  
  let gradient = ctx.createRadialGradient(x, y, radius, x, y, 0);
  colors.forEach((color, index) => gradient.addColorStop(index, color));
  
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'black';
  ctx.stroke();	

  shape = { name: 'circle', x, y, radius };
}

function selectShape() {
  const shape = document.getElementById('shapes-select').value;
  const actions = document.getElementById('actions-select');
  
  if (shape) {
    actions.style.display = 'block';
    drawDefaultShapes[shape]();
  } else {
    actions.style.display = 'none';
    clearCanvas();
  }
}

function move(direction, displacement) {
  if (!shape) {
    return;
  }

  let newPoints = null;
  let dx = 0;
  let dy = 0;

  switch (direction) {
    case 'up':
      dy = -displacement;
      break;
    case 'down':
      dy = displacement;
      break;
    case 'left':
      dx = -displacement;
      break;
    case 'right':
      dx = displacement;
      break;
  }

  switch (shape.name) {
    case 'square':
    case 'rect':
    case 'triangle':
        newPoints = shape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        draw({ points: newPoints, name: shape.name});
      break;
    case 'circle':
        newPoints = {
          x: shape.x + dx,
          y: shape.y + dy,
          radius: shape.radius,
        };
        drawCircle(newPoints);
      break;
  }
}

function scalePoint(px, py, centerX, centerY, scale) {
    let dx = px - centerX;
    let dy = py - centerY;
    return {
        x: centerX + dx * scale,
        y: centerY + dy * scale
    };
}

function scaleShape(scale) {
  if (!shape) {
    return;
  }
  
  let newPoints = null;
  let { points, name } = shape;

  switch (name) {
    case 'square':
    case 'rect':
    case 'triangle':
      let center = findCenter();
      newPoints = points.map(point => scalePoint(point.x, point.y, center.x, center.y, scale));
      draw({ points: newPoints, name});
      break;
    case 'circle':
      newPoints = {
        x: shape.x,
        y: shape.y,
        radius: shape.radius * scale,
      };
      drawCircle(newPoints);
      break;
  }
}

function rotatePoint(px, py, centerX, centerY, degrees) {
    let radians = degrees * Math.PI / 180;
    
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);

    let nx = (cos * (px - centerX)) - (sin * (py - centerY)) + centerX;
    let ny = (sin * (px - centerX)) + (cos * (py - centerY)) + centerY;

    return {x: nx, y: ny};
}

function rotateShape(degrees) {
  if (!shape || shape.name === 'circle') {
    return;
  }

  let center = findCenter();
  let { points, name } = shape;

  const vertices = points.map(p => rotatePoint(p.x, p.y, center.x, center.y, degrees));
  draw({ points: vertices, name });
}

function findCenter() {
  const length = shape.points.length;
  const xv = shape.points.reduce((acc, p) => acc + p.x, 0) / length;
  const yv = shape.points.reduce((acc, p) => acc + p.y, 0) / length;

  return { x: xv, y: yv };
}