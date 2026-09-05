// The Front Page — pure helpers. QML imports this file; Node tests require
// the same exports at the bottom.

var APP_NAME = "The Front Page"
var STATE_DIR = "/.local/state/omarchy/frontpage"

// The other daily widgets, and the order they run across the bar.
var SECTIONS = [
  { id: "atsokolas.elevation", key: "e", name: "Elevation" },
  { id: "atsokolas.easel", key: "a", name: "Easel" },
  { id: "atsokolas.munger", key: "m", name: "Munger" },
  { id: "atsokolas.kickoff", key: "k", name: "Kickoff" }
]

var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"]

function pad2(value) {
  var n = Math.floor(Number(value)) || 0
  return (n < 10 ? "0" : "") + n
}

function dateKeyFromDate(date) {
  var d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ""
  return String(d.getFullYear()) + pad2(d.getMonth() + 1) + pad2(d.getDate())
}

// Civil day number, the same one the other widgets use, so the edition
// number matches the deck position Munger reports.
function dayNumber(date) {
  var d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 0
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

// "Saturday, 5 September 2026"
function masthead(date) {
  var d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ""
  return DAYS[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear()
}

// "No. 20,701" — one edition per day since the epoch.
function edition(date) {
  var n = dayNumber(date)
  return "No. " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function statePath(home) {
  return String(home || "") + STATE_DIR + "/delivered"
}

function sectionFor(key) {
  var k = String(key || "").toLowerCase()
  for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === k) return SECTIONS[i]
  return null
}

function kickoffLabel(utcTime) {
  var d = new Date(String(utcTime || ""))
  if (isNaN(d.getTime())) return ""
  return pad2(d.getHours()) + ":" + pad2(d.getMinutes())
}

// One line per fixture, from Kickoff's normalised match shape.
function fixtureLine(match) {
  if (!match || !match.home || !match.away) return ""
  var home = String(match.home.name || ""), away = String(match.away.name || "")
  if (match.state === "upcoming") {
    var at = kickoffLabel(match.utcTime)
    return home + " v " + away + (at ? "  ·  " + at : "")
  }
  var score = home + " " + (match.home.score === null ? "–" : match.home.score) + "–"
    + (match.away.score === null ? "–" : match.away.score) + " " + away
  if (match.state === "live") return score + "  ·  " + (match.liveTimeShort || "LIVE")
  if (match.state === "finished") return score + "  ·  FT"
  return home + " v " + away + "  ·  " + (match.statusReason || "off")
}

function fixtureLines(matches, limit) {
  var list = matches instanceof Array ? matches : []
  var max = Math.max(1, parseInt(limit, 10) || 4)
  var out = []
  for (var i = 0; i < list.length && out.length < max; i++) {
    var line = fixtureLine(list[i])
    if (line) out.push(line)
  }
  return out
}

if (typeof module !== "undefined") {
  module.exports = {
    APP_NAME: APP_NAME,
    SECTIONS: SECTIONS,
    dateKeyFromDate: dateKeyFromDate,
    dayNumber: dayNumber,
    masthead: masthead,
    edition: edition,
    statePath: statePath,
    sectionFor: sectionFor,
    kickoffLabel: kickoffLabel,
    fixtureLine: fixtureLine,
    fixtureLines: fixtureLines
  }
}
