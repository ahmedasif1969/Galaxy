// Keep turning points, but combine scroll updates traveling in the same direction.
export class FrameBacklog {
  constructor(frameCount) {
    this.lastFrame = frameCount - 1
    this.current = 0
    this.requested = 0
    this.targets = []
  }

  request(frame) {
    const target = Math.max(0, Math.min(this.lastFrame, Math.round(frame)))
    if (target === this.requested) return
    this.requested = target
    const last = this.targets.at(-1)
    if (last === undefined) {
      if (target !== this.current) this.targets.push(target)
      return
    }
    const previous = this.targets.length > 1 ? this.targets.at(-2) : this.current
    if (Math.sign(target - last) === Math.sign(last - previous)) {
      this.targets[this.targets.length - 1] = target
    } else {
      this.targets.push(target)
    }
  }

  next() {
    while (this.targets[0] === this.current) this.targets.shift()
    return this.targets.length ? this.current + Math.sign(this.targets[0] - this.current) : null
  }

  advance(frame) {
    if (frame !== this.next()) throw new Error('Playback must advance by one queued frame')
    this.current = frame
    while (this.targets[0] === this.current) this.targets.shift()
  }

  get remaining() {
    let previous = this.current
    return this.targets.reduce((distance, target) => {
      const result = distance + Math.abs(target - previous)
      previous = target
      return result
    }, 0)
  }
}
