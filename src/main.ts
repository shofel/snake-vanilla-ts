import './style.css'

type Point = {row: number, col: number}
// TODO emoji for cell status
// tail is the whole body except for head
type Cell = 'empty' | 'tail' | 'head' | 'egg'
type Field = Cell[][]
type Direction = 'up' | 'down' | 'left' | 'right'

let Point = (row: number, col: number) => ({row, col})
let Points = (...xs: Array<[number, number]>) => xs.map(x => Point(...x))

interface Size {
  rows: number,
  cols: number,
}

type Snake = {
  rows: number,
  cols: number,
  direction: Direction,
  tail: Point[],
  head: Point,
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
    tail: '.',
    head: 'o',
    egg: '&',
  })[cell];
  return `<div class='${cell}'>${text}</div>`
}

// TODO dedent function
function renderGame (snake: Snake) {
  let field = empty(snake);

  for (let {row, col} of snake.tail) {
    field[row][col] = 'tail'
  }

  {
    let {row, col} = snake.head
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
  head: Point(0, 2),
  tail: Points([0, 0], [0, 1]),
  eggs: Points([2, 2]),
  direction: 'up',
}

// 3. evolve state

function step (state: Snake): Snake {
  // find head
  // find tail
  // advance head
  //   replace with body
  //   add head in direction
  // remove tail
}

// 4. change direction

// Main

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  ${renderGame(window.snake)}
`
