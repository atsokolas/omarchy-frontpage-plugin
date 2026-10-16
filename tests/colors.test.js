const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const Model = require("../Model.js")

const root = path.join(__dirname, "..")

test("colours come from the theme file, never the shell's Color singleton", () => {
  // Color isn't visible to third-party plugins: reading it assigns undefined
  // and paints black or nothing.
  for (const file of fs.readdirSync(root).filter(f => f.endsWith(".qml")))
    assert.doesNotMatch(fs.readFileSync(path.join(root, file), "utf8"), /\bColor\./, file)
})

test("the palette is read from colors.toml", () => {
  const c = Model.parseColors('mode = "dark"\naccent = "#7AA2F7"\nmuted = "#414868"\nbackground = "#1a1b26"\nforeground = "#a9b1d6"\nred = "#f7768e"\n')
  assert.equal(c.accent, "#7aa2f7")
  assert.equal(c.background, "#1a1b26")
  assert.equal(c.foreground, "#a9b1d6")
  assert.equal(c.red, "#f7768e")
  assert.equal(c.mode, "dark")
  assert.equal(Model.parseColors('background = "#000000"\nforeground = "#ffffff"').accent, "#ffffff")
  assert.equal(Model.parseColors(""), null)
})
