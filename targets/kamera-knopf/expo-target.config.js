// Knopf fürs Kontrollzentrum (iOS 18+): öffnet Findimal direkt mit der Kamera.
// Wird mit dem Baustein @bacons/apple-targets als eigenes Ziel ("Widget-Erweiterung") gebaut.
/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'FindimalKamera',
  displayName: 'Findimal Kamera',
  deploymentTarget: '18.0',
  frameworks: ['SwiftUI', 'WidgetKit', 'AppIntents'],
};
