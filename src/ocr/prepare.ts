import * as ImageManipulator from 'expo-image-manipulator';

export async function downscale(uri: string): Promise<string> {
  try {
    if (!uri) return uri;
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri ?? uri;
  } catch {
    return uri;
  }
}



