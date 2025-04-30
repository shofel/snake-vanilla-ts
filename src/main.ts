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
interface Snake {
  size: Size,
  direction: Direction,
  /* Snake is an array of points, ordered from the head to the tail. */
  snake: Point[],
  eggs: Point[],
}

/* Render state as html */

function renderCell (cell: Cell): HTMLElement['innerHTML'] {
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
        ${row.map(renderCell).join('\n')}
      </div>
  `).join('\n')

  return `
    <div class='field'>
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
  let newHead = move(head(state.snake), state.direction)
  let [eaten, newEggs] = eggs(state.size, state.eggs, newHead)
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

function updateDom (el:HTMLElement, state: Snake) {
  let innerHTML = renderGame(state)
  el.innerHTML = innerHTML
}

/* Initial state */

let randomPoints = (size: Size, count: number): Point[] =>
  Array(count).fill(null).map(() => randomPoint(size))

let createContext = (
  el: HTMLElement, size: Size, snakeSize: number, eggsCount: number
) => ({
  updateDom: () => updateDom(el, context.snake),
  snake: {
    size,
    snake: randomPoints(size, snakeSize),
    eggs: randomPoints(size, eggsCount),
    direction: 'down',
  } as Snake,
})

/* Run */

const env = {
  body: document.body,
  el: document.querySelector<HTMLDivElement>('#app')!,
}

let context = createContext(env.el, {cols: 20, rows: 20}, 3, 3)
context.updateDom()

listenArrows(env.body, (direction: Direction) => {
  context.snake.direction = direction
  context.snake = step(context.snake)
  context.updateDom()
})

/* Expose */

declare global {
  interface Window { snake: () => Snake; }
}
window.snake = () => context.snake
