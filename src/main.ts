import './style.css'

type Point = {row: number, col: number}
type Cell = 'empty' | 'body' | 'head' | 'egg'
type Field = Cell[][]
type Direction = 'up' | 'down' | 'left' | 'right'

let point = (row: number, col: number) => ({row, col})
let points = (...xs: Array<[number, number]>) => xs.map(x => point(...x))

let head = (snake: Point[]): Point => snake[0]
let size = ({rows, cols}: Size) => ({rows, cols})

interface Size {
  rows: number,
  cols: number,
}

/* State of the Snake game. */
type Snake = {
  rows: number,
  cols: number,
  direction: Direction,
  /* Snake is an array of points, ordered from the head to the tail. */
  snake: Point[],
  eggs: Point[],
}

declare global {
  interface Window { snake: () => Snake; }
}

// 1. render state

function renderCell (cell: Cell) {
  let text = ({
    empty: '0',
    body: '🐄', // ⏺
    head: '🐮', // 󰮯 pacman is awesome, but doesn't render in web
    egg: '🍀', // 🥚
  })[cell];
  return `<div class='${cell}'>${text}</div>`
}

function empty ({cols: width, rows: height}: Size): Field {
  let row = () => Array(width).fill('empty')
  let rows = Array(height).fill(null).map(row)
  return rows
}

function renderGame (state: Snake): string {
  let field = empty(size(state));

  for (let {row, col} of state.snake) {
    field[row][col] = 'body'
  }

  {
    let {row, col} = head(state.snake)
    field[row][col] = 'head'
  }

  for (let {row, col} of state.eggs) {
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

// TODO
//    󱇩 go around
//    󱇩 advance on timer
//    󱇩 no reverse
//    󱇩 detect collision with a wall
//     parse state to make tests
//    💅snake body -- | depending on orientation
//    💅dedent function
//    💅fix "downloadable font: rejected by sanitizer"
//    💅render state with morphdom

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

function randomPoint ({rows, cols}: Size) {
  let rnd = (length: number) => Math.floor(Math.random() * length)
  return point(rnd(rows), rnd(cols))
}

function eggs (size: Size, eggs_: Snake['eggs'], head: Point)
: [eaten: boolean, Snake['eggs']] {
  let newEggs = eggs_.slice()

  let eatenIdx =
    eggs_.findIndex(egg => egg.col == head.col &&
                           egg.row == head.row)
  let eaten = eatenIdx != -1

  if (eaten) {
    newEggs[eatenIdx] = randomPoint(size)
  }

  return [eaten, newEggs]
}

function step (state: Snake): Snake {
  let newHead = move(head(state.snake), state.direction)
  let [eaten, newEggs] = eggs(size(state), state.eggs, newHead)
  let newSnake = [
    newHead,
    ...(eaten ? state.snake : state.snake.slice(0, -1))
  ]

  return {
    ...state,
    snake: newSnake,
    eggs: newEggs,
  }
}

// 4. Read signals from keyboard and pass them to the state
//    keyboard -> direction -> step

function listenArrows (el: HTMLElement, f: (direction: Direction) => void) {
  el.addEventListener('keydown', ({key}) => {
    switch (key) {
      case 'ArrowUp'   :f('up')   ;break;
      case 'ArrowDown' :f('down') ;break;
      case 'ArrowLeft' :f('left') ;break;
      case 'ArrowRight':f('right');break;
    }
  })
}

function updateDom (el:HTMLElement, state: Snake) {
  let innerHTML = renderGame(state)
  el.innerHTML = innerHTML
}

// Main

window.snake = () => context.snake

let context = {
  body: document.body,
  el: document.querySelector<HTMLDivElement>('#app')!,
  updateDom: () => updateDom(context.el, context.snake),
  snake: {
    cols: 15,
    rows: 15,
    snake: points([0, 0], [0, 1], [0, 2]),
    eggs: points([2, 2], [5, 2]),
    direction: 'down',
  } as Snake,
}

listenArrows(context.body, (direction: Direction) => {
  context.snake.direction = direction
  context.snake = step(context.snake)
  context.updateDom()
})

context.updateDom()
