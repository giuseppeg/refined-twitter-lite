const assert = require('assert')

function dnd(dnd, nowTimestamp) {
  const [start, end] = dnd.map(time => {
    const [h, m] = time.split(':').map(Number)
    const t = new Date(nowTimestamp)
    t.setHours(h)
    t.setMinutes(m)
    return t
  })
  const now = new Date(nowTimestamp)
  return (now >= start || (start >= end && now <= start && now <= end)) && (now <= end || end <= start)
}

function getTime(time) {
  const d = new Date()
  const [h, m] = time.split(':').map(Number)
  d.setHours(h)
  d.setMinutes(m)
  return d
}

assert.ok(!dnd(['2:00', '3:00'], getTime('1:00').getTime()), 'off: same day before')
assert.ok(!dnd(['2:00', '3:00'], getTime('4:00').getTime()), 'off: same day after')
assert.ok(!dnd(['21:00', '9:30'], getTime('9:40').getTime()), 'off: same day from yesterday')
assert.ok(!dnd(['21:00', '9:30'], getTime('20:00').getTime()), 'off: same day with tomorrow')
assert.ok(dnd(['2:00', '4:15'], getTime('4:00').getTime()), 'on: same day')
assert.ok(dnd(['22:00', '4:15'], getTime('22:00').getTime()), 'on: same day to tomorrow')
assert.ok(dnd(['22:00', '4:15'], getTime('2:00').getTime()), 'on: same day from yesterday')
