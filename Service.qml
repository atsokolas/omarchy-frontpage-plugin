import QtQuick
import Quickshell
import Quickshell.Io
import "Model.js" as Model

// The paper round. Delivers the page once a day, at the first unlock — or at
// login, when there was no lock to come back from — and remembers the date
// it did so a shell restart mid-afternoon does not deliver it twice.
Item {
  id: root

  property var shell: null
  property var settings: ({})

  readonly property string home: Quickshell.env("HOME") || ""
  readonly property var lock: shell && typeof shell.serviceFor === "function" ? shell.serviceFor("omarchy.lock") : null

  property string deliveredKey: ""
  readonly property string todayKey: Model.dateKeyFromDate(new Date())

  function open() {
    if (shell && typeof shell.summon === "function") shell.summon("atsokolas.frontpage", "{}")
  }

  function deliver() {
    var today = Model.dateKeyFromDate(new Date())
    if (deliveredKey === today) return
    deliveredKey = today
    stateFile.setText(today + "\n")
    open()
  }

  // Let the bar settle and the pictures land before the page comes up.
  Timer {
    id: round
    interval: 1200
    onTriggered: if (!root.lock || !root.lock.locked) root.deliver()
  }

  Connections {
    target: root.lock
    ignoreUnknownSignals: true
    function onLockedChanged() { if (!root.lock.locked) round.restart() }
  }

  FileView {
    id: stateFile
    path: Model.statePath(root.home)
    atomicWrites: true
    printErrors: false
    onLoaded: { root.deliveredKey = String(text()).replace(/\s+/g, ""); round.restart() }
    onLoadFailed: round.restart()
  }

  IpcHandler {
    target: "atsokolas.frontpage"
    function open(): void { root.open() }
    function show(): void { root.open() }
    // Deliver again today, whatever the state file says.
    function redeliver(): string { root.deliveredKey = ""; root.deliver(); return "ok" }
    function status(): string {
      return JSON.stringify({ delivered: root.deliveredKey, today: root.todayKey, locked: root.lock ? root.lock.locked : null })
    }
  }
}
