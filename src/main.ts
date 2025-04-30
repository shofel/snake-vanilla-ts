/**
 * A snake game, naive and with a few funny bugs.
 *
 * # What else to Improve
 * ## Nice
 *    💅set favicon
 *     parse state to make tests, and make tests. Maybe generative
 *    💅snake body -- | depending on orientation => render intersections
 *    󱇩 option: advance on timer
 *     pluggable render function
 *    💅render state with morphdom
 *    💅render state with canvas
 * ## Boring
 *    󱇩 integrity of a spawned snake
 *    󱇩 go around the world
 *    󱇩 restrictions: no reverse
 *    󱇩 detect collisions: with a wall and with snake itself
 *    💅add a license
 *    💅the `dedent` function for beautier raw html
 *    💅fix console error "downloadable font: rejected by sanitizer"
 *    💅support skins. Chars or sprites for cells
 * ## From Zlata
 *    󱇩 play on a tablet
 *     + deploy
 *    󱇩 show game over
 *    󱇩 restart game
 *    󱇩 option: if to respawn eaten eggs
 * ## Maybe for Zlata
 *    󱇩 presets
 *    󱇩 config in url params
 *    󱇩 option: fill window with cells (autosize)
*/

import './style.css'

let l = console

/* The model */

type Point = {row: number, col: number}
type Cell = 'empty' | 'body' | 'head' | 'egg'
type Field = Cell[][]
type Direction = 'up' | 'down' | 'left' | 'right'

let point = (row: number, col: number) => ({row, col})
let head = (snake: Point[]): Point => snake[0]

interface Size {
  rows: number,
  cols: number,
}

/** State of a Snake game. */
type Snake = {
  size: Size,
  direction: Direction,
  /* Snake is an array of points, ordered from the head to the tail. */
  snake: Point[],
  eggs: Point[],
  status: 'playing' | 'gameover',
}

/* Render state as html */

function renderCell (cell: Cell): HTMLElement['innerHTML'] {
  let text = ({
    empty: 'o',
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

function renderGame (state: Snake): HTMLElement['innerHTML'] {
  let field = empty(state.size);

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
        <div class="margin"></div>
        ${row.map(renderCell).join('\n')}
        <div class="margin"></div>
      </div>
  `).join('\n')

  return `
    <div class='field ${state.status}'>
      ${rows}
    </div>
  `
}

/* Evolve state */

function move(point: Point, direction: Direction): Point {
  let [row, col] = ({
    up: [-1, 0],
    down: [1, 0],
    left: [0, -1],
    right: [0, 1],
  })[direction]

  return { row: point.row + row, col: point.col + col, }
}

function randomPoint ({rows, cols}: Size): Point {
  let rnd = (length: number) => Math.floor(Math.random() * length)
  return point(rnd(rows), rnd(cols))
}

/** Eggs at the end of turn */
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
  if (state.status === 'gameover') return state

  let newHead = move(head(state.snake), state.direction)
  let [eaten, newEggs] = eggs(state.size, state.eggs, newHead)
  let newSnake = [
    newHead,
    ...(eaten ? state.snake : state.snake.slice(0, -1))
  ]

  /* Passing lateral borders is fun. Gameover is a hit of top or bottom. */
  let status: Snake['status'] =
    (newHead.row >= 0 && newHead.row < state.size.rows)
    ? 'playing'
    : 'gameover'

  l.debug('newHead', newHead)
  l.debug('status', status)

  return {
    ...state,
    snake: (status != 'gameover' ? newSnake : state.snake),
    eggs: newEggs,
    status,
  }
}

/** Read signals from keyboard to pass them to the game state
    keyboard -> direction -> state */
function listenArrows (el: HTMLElement, fx: (direction: Direction) => void) {
  el.addEventListener('keydown', ({key}) => {
    switch (key) {
      case 'ArrowUp'   :fx('up')   ;break;
      case 'ArrowDown' :fx('down') ;break;
      case 'ArrowLeft' :fx('left') ;break;
      case 'ArrowRight':fx('right');break;
    }
  })
}

function directions (head: HTMLElement, x: number, y: number): Direction[] {
  if (!head) return ['right']

  let {
    offsetHeight: height,
    offsetLeft: left,
    offsetWidth: width,
    offsetTop: top,
  } = head

  let ret: Direction[] = []

  if (x < left) ret.push('left');
  if (left + width < x) ret.push('right');
  if (y < top) ret.push('up');
  if (y > top + height) ret.push('down');

  return ret
}

/* Control the snake with clicks or taps. */
function listenClicks (el: HTMLElement, fx: (direction: Direction) => void) {
  el.addEventListener('mousedown', ({x, y}: MouseEvent) => {
    let head = el.querySelector('.head') as HTMLElement
    for (let d of directions(head, x, y)) fx(d)
  })
}

/* Initial state */

let randomPoints = (size: Size, count: number): Point[] =>
  Array(count).fill(null).map(() => randomPoint(size))

let createContext = (
  size: Size, snakeSize: number, eggsCount: number
) => ({
  snake: {
    size,
    snake: randomPoints(size, snakeSize),
    eggs: randomPoints(size, eggsCount),
    direction: 'down',
    status: 'playing',
  } as Snake,
})

/* Run */

const env = {
  body: document.body,
  el: document.querySelector<HTMLDivElement>('#app')!,
}

function onDirection (direction: Direction) {
  if (context.snake.status === 'gameover') start()

  context.snake.direction = direction
  context.snake = step(context.snake)
  env.el.innerHTML = renderGame(context.snake)
}

listenArrows(env.body, onDirection)
listenClicks(env.body, onDirection)

let options = [{ cols: 5, rows: 5 }, 3, 3] as const
let context = createContext(...options)

function start() {
  context = createContext(...options)
  env.el.innerHTML = renderGame(context.snake)
}

start()

/* View: cursor shape */
document.body.addEventListener('mousemove', function ({x, y}) {
  let head = document.querySelector('.head') as HTMLElement
  let d = directions(head, x, y)

  let cursor = (() => {
    let lateral = ''
    let vertical = ''

    if (d.includes('left')) lateral = 'w'
    if (d.includes('right')) lateral = 'e'
    if (d.includes('up')) vertical = 'n'
    if (d.includes('down')) vertical = 's'

    let vl = vertical + lateral

    if (vl === '') return 'crosshair'

    return vl + '-resize'
  })()

  document.body.style.cursor = cursor
})
