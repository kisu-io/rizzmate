import 'dotenv/config';

export default {
  expo: {
    name: "rizzmate",
    slug: "rizzmate",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Allow RizzMate to use the camera for chat screenshots.",
        NSPhotoLibraryUsageDescription: "Allow RizzMate to access your photos to pick chat screenshots."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    entryPoint: "./index.js",
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  },
};
