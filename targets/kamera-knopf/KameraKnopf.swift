import AppIntents
import SwiftUI
import WidgetKit

// Knopf im Kontrollzentrum, auf dem Sperrbildschirm oder auf der Aktionstaste:
// ein Tipp öffnet Findimal mit der Kamera (über den Link findimal://kamera).
struct KameraKnopf: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "com.chriskuz.findimal.kamera") {
      ControlWidgetButton(action: FindimalKameraOeffnen()) {
        Label("Tier fotografieren", systemImage: "camera.viewfinder")
      }
    }
    .displayName("Findimal Kamera")
    .description("Öffnet Findimal direkt mit der Kamera.")
  }
}

struct FindimalKameraOeffnen: AppIntent {
  static let title: LocalizedStringResource = "Findimal Kamera öffnen"

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(URL(string: "findimal://kamera")!))
  }
}

@main
struct FindimalWidgets: WidgetBundle {
  var body: some Widget {
    KameraKnopf()
  }
}
