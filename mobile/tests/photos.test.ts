import { describe, it, expect, jest, beforeEach } from '@jest/globals'
const mockManipulate = jest.fn<() => Promise<unknown>>()
const mockDelete = jest.fn(),
  mockSizes: number[] = []
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulate(...(args as [])),
  SaveFormat: { JPEG: 'jpeg' },
}))
jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///app-cache/' } },
  File: class {
    exists = true
    size: number
    uri: string
    constructor(mockUri: string) {
      this.uri = mockUri
      this.size = mockSizes.shift() ?? 1024
    }
    delete() {
      mockDelete(this.uri)
    }
  },
}))
import { preparePhoto, removePickedTemporaryPhoto } from '@/lib/release/photos'
const source = {
  uri: 'file://original',
  width: 4000,
  height: 3000,
  exif: { GPSLatitude: 40 },
  fileName: 'image.heic',
  mimeType: 'image/heic',
}
beforeEach(() => {
  mockManipulate.mockReset()
  mockDelete.mockReset()
  mockSizes.length = 0
})
describe('photo normalization', () => {
  it('resizes and strips source metadata without deleting the original', async () => {
    mockManipulate.mockResolvedValue({
      uri: 'file://normalized',
      width: 1600,
      height: 1200,
    })
    const result = await preparePhoto(source)
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.exif).toBeUndefined()
    expect(mockManipulate.mock.calls[0]).toEqual([
      'file://original',
      [{ resize: { width: 1600 } }],
      { compress: 0.8, format: 'jpeg' },
    ])
    expect(mockDelete).not.toHaveBeenCalledWith('file://original')
  })
  it('rejects files still above 4MB and cleans all temporary outputs', async () => {
    mockSizes.push(5e6, 0, 5e6, 0, 5e6, 0)
    let i = 0
    mockManipulate.mockImplementation(async () => ({
      uri: `file://normalized-${i++}`,
    }))
    await expect(preparePhoto(source)).rejects.toThrow('photo_too_large')
    expect(mockDelete).toHaveBeenCalledTimes(3)
    expect(mockDelete).not.toHaveBeenCalledWith('file://original')
  })
  it('rejects unknown image dimensions', async () => {
    await expect(preparePhoto({ ...source, width: 0 })).rejects.toThrow(
      'invalid_photo',
    )
    expect(mockManipulate).not.toHaveBeenCalled()
  })
})

it('only cleans picker cache copies and preserves actual library files', () => {
  for (const uri of [
    'ph://library',
    'content://media/1',
    'file:///photos/original.jpg',
    'file:///app-cache/../photos/original.jpg',
    'file:///app-cache/%2e%2e/photos/original.jpg',
  ])
    removePickedTemporaryPhoto(uri)
  expect(mockDelete).not.toHaveBeenCalled()
  removePickedTemporaryPhoto('file:///app-cache/ImagePicker/temporary.jpg')
  expect(mockDelete).toHaveBeenCalledWith(
    'file:///app-cache/ImagePicker/temporary.jpg',
  )
})
