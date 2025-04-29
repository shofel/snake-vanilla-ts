import './style.css'

type Point = {row: number, col: number}
type Cell = 'empty' | 'body' | 'head' | 'egg'
type Field = Cell[][]
type Direction = 'up' | 'down' | 'left' | 'right'

let Point = (row: number, col: number) => ({row, col})
let Points = (...xs: Array<[number, number]>) => xs.map(x => Point(...x))

let head = (snake: Point[]): Point => snake[snake.length - 1]

interface Size {
  rows: number,
  cols: number,
}

// TODO invert snake
type Snake = {
  rows: number,
  cols: number,
  direction: Direction,
  snake: Point[],
  eggs: Point[],
}

declare global {
  interface Window { snake: Snake; }
}

// 1. render state

// TODO parse state to make tests
// TODO snake body -- | depending on orientation
function renderCell (cell: Cell) {
  let text = ({
    empty: '0',
    body: '.',
    head: 'o',
    egg: '&',
  })[cell];
  return `<div class='${cell}'>${text}</div>`
}

// TODO dedent function
function renderGame (snake: Snake) {
  let field = empty(snake);

  for (let {row, col} of snake.snake) {
    field[row][col] = 'body'
  }

  {
    let {row, col} = head(snake.snake)
    field[row][col] = 'head'
  }

  for (let {row, col} of snake.eggs) {
    field[row][col] = 'egg'
  }

  let rows = field.map(
    row => `
      <div class='row'>
        ${row.map(renderCell).join('\n')}
      </div>
  `).join('\n')

  return `
    <div class='field'>
      ${rows}
    </div>
  `
}

// 2. state

function empty ({cols: width, rows: height}: Size): Field {
  let row = () => Array(width).fill('empty')
  let rows = Array(height).fill(null).map(row)
  return rows
}

window.snake = {
  cols: 5,
  rows: 5,
  snake: Points([0, 0], [0, 1], [0, 2]),
  eggs: Points([2, 2]),
  direction: 'down',
}

// TODO no reverse
//      detect collision with a wall
//      eat an egg
//      advance on arrow press
//      advance on timer

// 3. evolve state

let move = (point: Point, direction: Direction) => {
  let [row, col] = ({
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  })[direction]

  return {row: point.row + row, col: point.col + col,}
}

function step (prev: Snake): Snake {
  let snake = prev.snake.slice(1) // copy and remove tail
  snake[snake.length] = move(head(snake), prev.direction) // advance head
  return {
    ...prev,
    snake,
  }
}

window.step = step

// 4. change direction

// Main

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  ${renderGame(step(window.snake))}
`
