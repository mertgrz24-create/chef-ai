import * as ImageManipulator from 'expo-image-manipulator'
import { File, Paths } from 'expo-file-system'
import type { ImagePickerAsset } from 'expo-image-picker'
export function removeTemporaryPhoto(uri: string | null) {
  if (!uri) return
  try {
    const file = new File(uri)
    if (file.exists) file.delete()
  } catch {
    /* cleanup must not mask the original outcome */
  }
}
export async function preparePhoto(asset: ImagePickerAsset) {
  if (!asset.width || !asset.height) throw new Error('invalid_photo')
  const resize =
    asset.width >= asset.height
      ? { width: Math.min(1600, asset.width) }
      : { height: Math.min(1600, asset.height) }
  let last: string | null = null
  try {
    for (const compress of [0.8, 0.6, 0.4]) {
      const image = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize }],
        { compress, format: ImageManipulator.SaveFormat.JPEG },
      )
      removeTemporaryPhoto(last)
      last = image.uri
      const size = new File(image.uri).size
      if (size > 0 && size <= 4 * 1024 * 1024)
        return {
          ...asset,
          ...image,
          mimeType: 'image/jpeg',
          fileName: 'ingredients.jpg',
          fileSize: size,
          exif: undefined,
        }
    }
    throw new Error('photo_too_large')
  } catch (error) {
    removeTemporaryPhoto(last)
    throw error
  }
}

// ImagePicker may return a cache copy even for library selections. Only remove the
// exact returned cache URI; never touch a Photos/content URI or a source outside our sandbox.
export function removePickedTemporaryPhoto(uri: string | null) {
  if (!uri) return
  try {
    const base = Paths.cache.uri.replace(/\/?$/, '/')
    if (!uri.startsWith(base)) return
    const relative = decodeURIComponent(uri.slice(base.length))
    if (
      !relative ||
      relative.includes('\\') ||
      relative.split('/').some((p) => p === '..' || p === '.')
    )
      return
    removeTemporaryPhoto(uri)
  } catch {
    /* Unsupported web URIs and cleanup failures never mask the user action. */
  }
}
