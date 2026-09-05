const test = require("node:test")
const assert = require("node:assert/strict")
const Model = require("../Model.js")

test("the masthead names the day and numbers the edition", () => {
  const day = new Date(2026, 8, 5)
  assert.equal(Model.masthead(day), "Saturday, 5 September 2026")
  assert.equal(Model.edition(day), "No. 20,701")
  assert.equal(Model.edition(new Date(1970, 0, 1)), "No. 0")
  assert.equal(Model.masthead("nonsense"), "")
  assert.equal(Model.dateKeyFromDate(day), "20260905")
})

test("the edition number is the same civil day the other widgets count", () => {
  assert.equal(Model.dayNumber(new Date(1970, 0, 2)), 1)
  assert.equal(Model.dayNumber(new Date(2026, 8, 5)) - Model.dayNumber(new Date(2026, 8, 4)), 1)
})

test("sections answer to their keys", () => {
  assert.equal(Model.sectionFor("E").id, "atsokolas.elevation")
  assert.equal(Model.sectionFor("k").name, "Kickoff")
  assert.equal(Model.sectionFor("z"), null)
  assert.equal(Model.statePath("/home/me"), "/home/me/.local/state/omarchy/frontpage/delivered")
})

test("fixtures read as one line each, in the match's state", () => {
  const home = { name: "Barcelona", score: 2 }, away = { name: "Getafe", score: 1 }
  assert.equal(Model.fixtureLine({ home, away, state: "finished" }), "Barcelona 2–1 Getafe  ·  FT")
  assert.equal(Model.fixtureLine({ home, away, state: "live", liveTimeShort: "67’" }), "Barcelona 2–1 Getafe  ·  67’")
  assert.equal(Model.fixtureLine({ home, away, state: "live" }), "Barcelona 2–1 Getafe  ·  LIVE")
  const soon = Model.fixtureLine({ home: { name: "Coventry City", score: null }, away: { name: "Leeds", score: null }, state: "upcoming", utcTime: "2026-09-05T19:00:00.000Z" })
  assert.match(soon, /^Coventry City v Leeds  ·  \d\d:\d\d$/)
  assert.equal(Model.fixtureLine({ home, away, state: "cancelled", statusReason: "PP" }), "Barcelona v Getafe  ·  PP")
  assert.equal(Model.fixtureLine(null), "")
  assert.deepEqual(Model.fixtureLines([{ home, away, state: "finished" }, null, { home, away, state: "finished" }], 1).length, 1)
})
