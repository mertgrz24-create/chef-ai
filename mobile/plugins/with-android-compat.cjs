const path = require('node:path')
const { withFinalizedMod, withAndroidManifest, XML } = require('expo/config-plugins')

// Expo's splash plugin currently emits an API 33 item into the API 24 theme.
// Keep its complete theme on both versions; use the platform item only on 33+.
function splitSplashStyles(styles) {
  const base = JSON.parse(JSON.stringify(styles))
  const splash = base.resources.style?.find(style => style.$.name === 'Theme.App.SplashScreen')
  if (!splash) throw new Error('Expected Expo splash theme')
  const versioned = JSON.parse(JSON.stringify(splash))
  if (!versioned.item?.some(item => item.$.name === 'android:windowSplashScreenBehavior'))
    throw new Error('Expo splash theme changed; review API resource handling')
  splash.item = splash.item.filter(item => item.$.name !== 'android:windowSplashScreenBehavior')
  return { base, api33: { resources: { style: [versioned] } } }
}

function optionalCameraFeatures(manifest) {
  const features = manifest['uses-feature'] ?? []
  for (const name of ['android.hardware.camera', 'android.hardware.camera.autofocus', 'android.hardware.camera.any']) {
    const existing = features.find(feature => feature.$['android:name'] === name)
    if (existing) existing.$['android:required'] = 'false'
    else features.push({ $: { 'android:name': name, 'android:required': 'false' } })
  }
  manifest['uses-feature'] = features
  return manifest
}

module.exports = config => {
  config = withAndroidManifest(config, result => {
    result.modResults.manifest = optionalCameraFeatures(result.modResults.manifest)
    return result
  })
  return withFinalizedMod(config, ['android', async result => {
  const resources = path.join(result.modRequest.platformProjectRoot, 'app/src/main/res')
  const stylesPath = path.join(resources, 'values/styles.xml')
  const styles = await XML.readXMLAsync({ path: stylesPath })
  const { base, api33 } = splitSplashStyles(styles)
  await XML.writeXMLAsync({ path: stylesPath, xml: base })
  await XML.writeXMLAsync({ path: path.join(resources, 'values-v33/styles.xml'), xml: api33 })
  return result
  }])
}
module.exports.splitSplashStyles = splitSplashStyles
module.exports.optionalCameraFeatures = optionalCameraFeatures
