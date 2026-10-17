import test from 'node:test'
import assert from 'node:assert/strict'
import { FrameBacklog } from '../src/frameBacklog.js'

function drain(queue) {
  const frames = []
  while (queue.next() !== null) {
    const next = queue.next()
    assert.equal(Math.abs(next - queue.current), 1)
    queue.advance(next)
    frames.push(next)
  }
  return frames
}

test('a scroll jump from 20 to 50 presents every intermediate frame', () => {
  const queue = new FrameBacklog(217)
  queue.request(20)
  drain(queue)
  queue.request(50)
  assert.equal(queue.remaining, 30)
  assert.deepEqual(drain(queue), Array.from({ length: 30 }, (_, i) => 21 + i))
})

test('direction changes retain turning points while a backlog is playing', () => {
  const queue = new FrameBacklog(217)
  queue.request(20)
  drain(queue)
  queue.request(50)
  queue.request(30)
  queue.request(40)
  assert.deepEqual(drain(queue), [
    ...Array.from({ length: 30 }, (_, i) => 21 + i),
    ...Array.from({ length: 20 }, (_, i) => 49 - i),
    ...Array.from({ length: 10 }, (_, i) => 31 + i),
  ])
})

test('same-direction updates combine without discarding frames', () => {
  const queue = new FrameBacklog(217)
  queue.request(20)
  queue.request(30)
  queue.request(50)
  assert.deepEqual(queue.targets, [50])
  assert.equal(drain(queue).length, 50)
})

test('buffering does not advance the queue and skipping is rejected', () => {
  const queue = new FrameBacklog(217)
  queue.request(50)
  assert.equal(queue.next(), 1)
  assert.equal(queue.next(), 1)
  assert.equal(queue.current, 0)
  assert.throws(() => queue.advance(50))
  queue.advance(1)
  assert.equal(queue.next(), 2)
})

test('targets are clamped and duplicate targets do not add work', () => {
  const queue = new FrameBacklog(217)
  queue.request(999)
  queue.request(999)
  assert.equal(drain(queue).at(-1), 216)
  queue.request(-10)
  assert.equal(drain(queue).at(-1), 0)
  assert.equal(queue.remaining, 0)
})
