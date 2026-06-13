import * as FileSystem from 'expo-file-system/legacy'

export async function uriToBlob(uri: string): Promise<Blob | ArrayBuffer> {
  try {
    const response = await fetch(uri)
    return await response.blob()
  } catch (fetchError) {
    console.log('uriToBlob fetch error:', fetchError, uri)

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const fileExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
    const mimeType = fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg'
    const blobResponse = await fetch(`data:${mimeType};base64,${base64}`)
    return await blobResponse.blob()
  }
}
