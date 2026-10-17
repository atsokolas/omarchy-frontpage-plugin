const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const Model = require("../Model.js")

const QML = fs.readFileSync(path.join(__dirname, "..", "FrontPage.qml"), "utf8")

// What a hostile or broken upstream feed could hand the other widgets.
const MARKUP = [
  '<font color="red" size="7">Lakeside Hall</font>',
  '<img src="file:///etc/hostname" width=400 height=400>',
  '<a href="https://evil.example">Harbor at Dusk</a>',
  "<b>Invert</b>, always <i>invert</i>.<br>"
]

test("markup from a feed stays literal text", () => {
  for (const s of MARKUP) assert.equal(Model.plain(s), s)
  const line = Model.fixtureLine({ home: { name: MARKUP[0], score: 2 }, away: { name: MARKUP[1], score: 1 }, state: "finished" })
  assert.equal(Model.plain(line), MARKUP[0] + " 2–1 " + MARKUP[1] + "  ·  FT")
  assert.equal(Model.plain(Model.paperLine({ headline: MARKUP[1], minutes: 3 })), MARKUP[1] + "  ·  3 min read")
})

test("plain text loses control characters and stops at a column's worth", () => {
  assert.equal(Model.plain("Ada\u0000\u0007 United\tFC\r"), "Ada United FC")
  assert.equal(Model.plain("one\ntwo"), "one\ntwo")
  assert.equal(Model.plain(null), "")
  assert.equal(Model.plain(undefined), "")
  assert.equal(Model.plain(42), "42")
  const long = Model.plain("x".repeat(100000))
  assert.equal(long.length, Model.TEXT_LIMIT)
  assert.ok(long.endsWith("…"))
  assert.equal(Model.plain("abcdef", 4), "abc…")
})

test("pictures come only from the widget's own cache folder", () => {
  const home = "/home/ada"
  assert.equal(Model.imageSource(home, "elevation", "/home/ada/.cache/omarchy/elevation/Lakeside_Hall.jpg"),
    "file:///home/ada/.cache/omarchy/elevation/Lakeside_Hall.jpg")
  assert.equal(Model.imageSource(home, "easel", "/home/ada/.cache/omarchy/easel/0a1b2c3d-1111-2222-3333-444455556666-843-7aa2f7a9b1d6.jpg"),
    "file:///home/ada/.cache/omarchy/easel/0a1b2c3d-1111-2222-3333-444455556666-843-7aa2f7a9b1d6.jpg")
  assert.match(Model.imageSource(home, "elevation", "/home/ada/.cache/omarchy/elevation/Hall.PNG"), /Hall\.PNG$/)
  assert.match(Model.imageSource(home, "elevation", "/home/ada/.cache/omarchy/elevation/Hall.webp"), /Hall\.webp$/)

  const refused = [
    ["elevation", ""],
    ["elevation", "/home/ada/.cache/omarchy/elevation/../../../.ssh/id_ed25519.jpg"],
    ["elevation", "/home/ada/.cache/omarchy/elevation/sub/Hall.jpg"],
    ["elevation", "/home/ada/.cache/omarchy/elevation/..jpg"],
    ["elevation", "/home/ada/.cache/omarchy/elevation/.hidden.jpg"],
    ["elevation", "/home/ada/.cache/omarchy/easel/Hall.jpg"],
    ["elevation", "/home/ada/.cache/omarchy/elevation/Hall.svg"],
    ["elevation", "/home/ada/.cache/omarchy/elevation/Hall.jpg\u0000.png"],
    ["elevation", "/home/ada/.cache/omarchy/elevation/Hall jpg.jpg"],
    ["elevation", "https://upload.example/Hall.jpg"],
    ["elevation", "file:///home/ada/.cache/omarchy/elevation/Hall.jpg"],
    ["elevation", "/tmp/Hall.jpg"],
    ["kickoff", "/home/ada/.cache/omarchy/kickoff/crest.png"],
    ["", "/home/ada/.cache/omarchy/elevation/Hall.jpg"]
  ]
  for (const [cache, p] of refused) assert.equal(Model.imageSource(home, cache, p), "", p)
  assert.equal(Model.imageSource("", "elevation", "/.cache/omarchy/elevation/Hall.jpg"), "")
  assert.equal(Model.imageSource("relative", "elevation", "relative/.cache/omarchy/elevation/Hall.jpg"), "")
})

// The page itself: every Text prints plain text, every piece of service data
// passes through Model.plain, and pictures are decoded at their shown size.
function blocks(source, type) {
  const out = []
  const re = new RegExp("^(\\s*)" + type + " \\{$", "gm")
  let m
  while ((m = re.exec(source))) {
    let depth = 0, i = m.index + m[0].length - 1
    for (; i < source.length; i++) {
      if (source[i] === "{") depth++
      else if (source[i] === "}" && --depth === 0) break
    }
    out.push(source.slice(m.index, i + 1))
  }
  return out
}

test("every Text on the page is plain text", () => {
  const texts = blocks(QML, "Text")
  assert.ok(texts.length >= 10)
  for (const t of texts) assert.match(t, /textFormat: Text\.PlainText/, t)
  assert.doesNotMatch(QML, /Text\.(RichText|StyledText|AutoText|MarkdownText)/)
  assert.doesNotMatch(QML, /ToolTip|\.tooltip/i)
})

test("service data reaches the page only through Model.plain", () => {
  for (const t of blocks(QML, "Text")) {
    const m = t.match(/^\s*text: (.*)$/m)
    assert.ok(m, t)
    const expr = m[1]
    const literal = /^"[^"]*"$/.test(expr) || /^Model\.(APP_NAME\.toUpperCase\(\)$|masthead\(|edition\()/.test(expr) ||
      /^section\.(heading\.toUpperCase\(\)|key)$/.test(expr) || /^\(root\.paper \? "[^"]*" : ""\) \+ "[^"]*"$/.test(expr)
    assert.ok(literal || /^Model\.plain\(/.test(expr), "unfiltered sink: " + expr)
  }
})

test("pictures load from the checked path at the size they're shown", () => {
  const images = blocks(QML, "Image")
  assert.equal(images.length, 1)
  assert.match(images[0], /source: width > 0 && height > 0 \? section\.imageSource : ""/)
  assert.match(images[0], /sourceSize\.width: Math\.ceil\(width\)/)
  assert.match(images[0], /sourceSize\.height: Math\.ceil\(height\)/)
  assert.match(QML, /imageSource: Model\.imageSource\(root\.home, cache, imagePath\)/)
  assert.doesNotMatch(QML, /"file:\/\/" \+/)
})
