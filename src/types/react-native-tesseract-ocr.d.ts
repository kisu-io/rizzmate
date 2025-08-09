declare module 'react-native-tesseract-ocr' {
  export const LANG_ENGLISH: string;
  const TesseractOcr: {
    recognize: (
      uri: string,
      lang: string,
      options?: { whitelist?: string; blacklist?: string }
    ) => Promise<string>;
  };
  export default TesseractOcr;
}



