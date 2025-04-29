import './style.css'

type Point = {row: number, col: number}
type Cell = 'empty' | 'body' | 'head' | 'egg'
type Field = Cell[][]
type Direction = 'up' | 'down' | 'left' | 'right'

let Point = (row: number, col: number) => ({row, col})
let Points = (...xs: Array<[number, number]>) => xs.map(x => Point(...x))

let head = (snake: Point[]): Point => snake[0]

interface Size {
  rows: number,
  cols: number,
}

type Snake = {
  rows: number,
  cols: number,
  direction: Direction,
  /* Snake is an array of points, ordered from the head to the tail. */
  snake: Point[],
  eggs: Point[],
}

declare global {
  interface Window { snake: Snake; }
}

// 1. render state

function renderCell (cell: Cell) {
  let text = ({
    empty: '0',
    body: '🐄', // ⏺
    head: '🐮', // 󰮯 pacman is awesome, but doesn't render in web
    egg: '🥚', // 🥚
  })[cell];
  return `<div class='${cell}'>${text}</div>`
}

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

// TODO
//    󱇩 advance on arrow press
//    󱇩 advance on timer
//    󱇩 no reverse
//    󱇩 detect collision with a wall
//    󱇩 eat an egg
//     parse state to make tests
//    💅snake body -- | depending on orientation
//    💅dedent function

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

function step (state: Snake): Snake {
  let snake = [
    move(head(state.snake), state.direction), // new head
    ...state.snake.slice(0, -1), // old without head
  ]
  return {
    ...state,
    snake,
  }
}

window.step = step

// 4. change direction

// Main

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  ${renderGame(step(window.snake))}
`
