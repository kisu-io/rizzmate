type RecognizeOptions = {
  whitelist?: string;
  blacklist?: string;
};

export async function runOCR(uri: string): Promise<string> {
  try {
    if (!uri) return '';
    // Lazy-require to avoid hard failure in Expo Go (Dev Client required for native module)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-tesseract-ocr');
    const TesseractOcr = mod?.default ?? mod;
    const LANG_ENGLISH = mod?.LANG_ENGLISH ?? 'ENG';
    if (!TesseractOcr?.recognize) {
      return '';
    }
    const options: RecognizeOptions = {
      whitelist:
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.!?@()[]{}:;+-=_/\\'\" ",
      blacklist: '',
    };
    const text = await TesseractOcr.recognize(uri, LANG_ENGLISH, options as any);
    return (text ?? '').trim();
  } catch {
    return '';
  }
}



