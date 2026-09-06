import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import QtQuick
import QtQuick.Layouts
import qs.Commons
import qs.Ui
import "Model.js" as Model

// One page, read once, dismissed: the day's building, painting, quote, and
// fixtures — whatever daily widgets are installed. Nothing is fetched here;
// every section is a live view of the plugin's own service.
Item {
  id: root

  property var shell: null
  property var manifest: null
  property bool opened: false

  function serviceFor(id) {
    return shell && typeof shell.serviceFor === "function" ? shell.serviceFor(id) : null
  }
  readonly property var elevation: serviceFor("atsokolas.elevation")
  readonly property var easel: serviceFor("atsokolas.easel")
  readonly property var munger: serviceFor("atsokolas.munger")
  readonly property var kickoff: serviceFor("atsokolas.kickoff")

  readonly property date today: new Date()

  property color background: Color.menu.background
  property color foreground: Color.menu.text
  property color dim: Qt.darker(foreground, 1.55)
  property color border: Color.menu.border
  property var borderSpec: Border.surfaceSpec("menu", "border", border, Math.max(1, Style.space(2)))
  property color scrim: Color.menu.scrim
  property string fontFamily: Style.font.menuFamily
  property int contentMargin: Style.spacing.panelPadding
  property int cardWidth: Math.min(Style.space(820), panel.width - Style.gapsOut * 2)
  property int cardHeight: Math.min(Style.space(560), panel.height - Style.gapsOut * 2)

  // The page settles in, then each section lands a beat after the last —
  // the same left-to-right order as the bar.
  property real reveal: 0

  function open(payloadJson) {
    root.opened = true
    revealAnimation.restart()
    Qt.callLater(function() { keyCatcher.forceActiveFocus() })
  }

  function close() { root.opened = false }

  function dismiss() {
    root.opened = false
    if (root.shell && typeof root.shell.hide === "function")
      root.shell.hide((root.manifest && root.manifest.id) || "atsokolas.frontpage")
  }

  function toggle() {
    if (root.opened) root.dismiss()
    else root.open("{}")
  }

  // Put the page down and open the widget itself.
  function visit(section) {
    if (!section) return
    root.dismiss()
    if (root.shell && typeof root.shell.summon === "function") root.shell.summon(section.id, "{}")
  }

  NumberAnimation {
    id: revealAnimation
    target: root
    property: "reveal"
    from: 0
    to: 1
    duration: 900
    easing.type: Easing.OutCubic
  }

  // 0..1 for the n-th section, staggered along the page's reveal.
  function landed(index) {
    return Math.max(0, Math.min(1, (root.reveal - index * 0.14) / 0.5))
  }

  PanelWindow {
    id: panel
    visible: root.opened
    anchors { top: true; bottom: true; left: true; right: true }
    color: "transparent"
    WlrLayershell.namespace: "omarchy-frontpage"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.Exclusive
    exclusionMode: ExclusionMode.Ignore

    Rectangle {
      anchors.fill: parent
      color: root.scrim
      opacity: root.reveal
    }

    MouseArea {
      anchors.fill: parent
      onClicked: root.dismiss()
    }

    BorderSurface {
      id: card
      width: root.cardWidth
      height: root.cardHeight
      radius: Style.cornerRadius
      anchors.centerIn: parent
      color: root.background
      borderSpec: root.borderSpec
      padding: root.contentMargin
      opacity: Math.min(1, root.reveal * 2)
      transform: Translate { y: (1 - Math.min(1, root.reveal * 2)) * Style.space(14) }

      MouseArea { anchors.fill: parent; onClicked: {} }

      Item {
        id: keyCatcher
        anchors.fill: parent
        focus: true

        Keys.priority: Keys.BeforeItem
        Keys.onPressed: function(event) {
          if (event.key === Qt.Key_Escape || event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) {
            root.dismiss()
            event.accepted = true
            return
          }
          var section = Model.sectionFor(event.text)
          if (section) {
            root.visit(section)
            event.accepted = true
          }
        }

        ColumnLayout {
          anchors.fill: parent
          anchors.topMargin: card.contentTopInset
          anchors.rightMargin: card.contentRightInset
          anchors.bottomMargin: card.contentBottomInset
          anchors.leftMargin: card.contentLeftInset
          spacing: Style.space(12)

          // ---- Masthead ---------------------------------------------------
          Item {
            Layout.fillWidth: true
            implicitHeight: mastheadColumn.implicitHeight

            Column {
              id: mastheadColumn
              anchors.left: parent.left
              anchors.right: edition.left
              spacing: Style.space(2)

              Text {
                text: Model.APP_NAME.toUpperCase()
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.heading
                font.bold: true
                font.letterSpacing: 2.4
              }

              Text {
                text: Model.masthead(root.today)
                color: root.dim
                font.family: root.fontFamily
                font.pixelSize: Style.font.bodySmall
              }
            }

            Text {
              id: edition
              anchors.right: parent.right
              anchors.bottom: parent.bottom
              text: Model.edition(root.today)
              color: root.dim
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              font.letterSpacing: 1
            }
          }

          Rectangle { Layout.fillWidth: true; height: 1; color: root.foreground; opacity: 0.35 }

          // ---- The four columns -------------------------------------------
          GridLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            columns: 2
            columnSpacing: Style.space(20)
            rowSpacing: Style.space(16)

            // Elevation: the photograph, the name, the credit, the story.
            Section {
              index: 0
              present: root.elevation !== null
              heading: "Elevation"
              key: "e"
              imagePath: root.elevation ? root.elevation.imagePath : ""
              title: root.elevation && root.elevation.entry ? root.elevation.entry.n : ""
              meta: root.elevation && root.elevation.entry ? [root.elevation.entry.a, root.elevation.entry.y].join(" · ") : ""
              body: root.elevation ? root.elevation.body : ""
            }

            // Easel: the picture itself, and its wall label.
            Section {
              index: 1
              present: root.easel !== null
              heading: "Easel"
              key: "a"
              imagePath: root.easel ? root.easel.imagePath : ""
              fit: true
              title: root.easel && root.easel.art ? root.easel.art.title : (root.easel ? root.easel.error : "")
              meta: root.easel ? root.easel.subtitle : ""
              body: root.easel && root.easel.art ? [root.easel.art.medium, root.easel.art.origin].filter(function(s) { return s }).join(" · ") : ""
            }

            // Munger: the quote, set large.
            Section {
              index: 2
              present: root.munger !== null
              heading: "Munger"
              key: "m"
              quote: root.munger && root.munger.todayQuote ? root.munger.todayQuote.text : ""
              meta: root.munger && root.munger.todayQuote ? "— Charlie Munger · " + root.munger.todayQuote.tag : ""
            }

            // Kickoff: the day's fixtures for followed clubs, or what is live.
            Section {
              index: 3
              present: root.kickoff !== null
              heading: "Kickoff"
              key: "k"
              title: root.kickoff ? root.kickoff.barText : ""
              lines: root.kickoff
                ? Model.fixtureLines(root.kickoff.followedMatches.length ? root.kickoff.followedMatches : root.kickoff.live, 4)
                : []
              body: root.kickoff && !root.kickoff.followedMatches.length && !root.kickoff.live.length ? "No football today." : ""
            }
          }

          // ---- Footer -----------------------------------------------------
          Text {
            Layout.fillWidth: true
            text: "e  elevation   ·   a  easel   ·   m  munger   ·   k  kickoff   ·   esc  put it down"
            color: Qt.darker(root.foreground, 2.1)
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            elide: Text.ElideRight
          }
        }
      }
    }
  }

  // One section of the page. Present only when its plugin is; otherwise it
  // takes no room, so a two-widget bar gets a two-column page.
  component Section: Item {
    id: section
    required property int index
    property bool present: true
    property string heading: ""
    property string key: ""
    property string imagePath: ""
    property bool fit: false
    property string title: ""
    property string meta: ""
    property string body: ""
    property string quote: ""
    property var lines: []

    Layout.fillWidth: true
    // A column is as tall as what it sets. Filling the row instead would give
    // every section half the page and let the long ones print over the row
    // below, so the height comes from the type and the page keeps the slack.
    Layout.preferredHeight: stack.implicitHeight
    Layout.alignment: Qt.AlignTop
    implicitHeight: stack.implicitHeight
    visible: present
    opacity: root.landed(index)
    transform: Translate { y: (1 - root.landed(index)) * Style.space(10) }

    Column {
      id: stack
      anchors.left: parent.left
      anchors.right: parent.right
      anchors.top: parent.top
      spacing: Style.space(6)

      Row {
        width: parent.width
        spacing: Style.space(6)

        Text {
          text: section.heading.toUpperCase()
          color: Color.accent
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
          font.bold: true
          font.letterSpacing: 1.6
        }

        Text {
          text: section.key
          color: Qt.darker(root.foreground, 2.1)
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
        }
      }

      Rectangle {
        width: parent.width
        height: section.imagePath !== "" ? Math.round(width * 0.42) : 0
        visible: section.imagePath !== ""
        radius: Style.cornerRadius
        clip: true
        color: Qt.rgba(root.foreground.r, root.foreground.g, root.foreground.b, 0.05)

        Image {
          anchors.fill: parent
          anchors.margins: section.fit ? Style.space(6) : 0
          source: section.imagePath !== "" ? "file://" + section.imagePath : ""
          fillMode: section.fit ? Image.PreserveAspectFit : Image.PreserveAspectCrop
          asynchronous: true
          cache: false
          opacity: status === Image.Ready ? 1 : 0
          Behavior on opacity { NumberAnimation { duration: 320 } }
        }
      }

      Text {
        width: parent.width
        visible: section.quote !== ""
        text: section.quote
        color: root.foreground
        font.family: root.fontFamily
        font.pixelSize: section.quote.length > 120 ? Style.font.body : Style.font.subtitle
        wrapMode: Text.WordWrap
        lineHeight: 1.3
      }

      Text {
        width: parent.width
        visible: section.title !== ""
        text: section.title
        color: root.foreground
        font.family: root.fontFamily
        font.pixelSize: Style.font.subtitle
        font.bold: true
        wrapMode: Text.WordWrap
        maximumLineCount: 2
        elide: Text.ElideRight
      }

      Text {
        width: parent.width
        visible: section.meta !== ""
        text: section.meta
        color: root.dim
        font.family: root.fontFamily
        font.pixelSize: Style.font.bodySmall
        elide: Text.ElideRight
      }

      Repeater {
        model: section.lines
        Text {
          required property string modelData
          width: parent.width
          text: modelData
          color: root.foreground
          font.family: root.fontFamily
          font.pixelSize: Style.font.body
          elide: Text.ElideRight
        }
      }

      Text {
        width: parent.width
        visible: section.body !== ""
        text: section.body
        color: root.dim
        font.family: root.fontFamily
        font.pixelSize: Style.font.bodySmall
        wrapMode: Text.WordWrap
        maximumLineCount: section.imagePath !== "" ? 3 : 6
        elide: Text.ElideRight
      }
    }

    MouseArea {
      anchors.fill: parent
      cursorShape: Qt.PointingHandCursor
      onClicked: root.visit(Model.sectionFor(section.key))
    }
  }
}
