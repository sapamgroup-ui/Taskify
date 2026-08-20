# Taskify APK Build Instructions
#
# 1. Install dependencies:
#    cd frontend
#    npm install
#    npm install @capacitor/core @capacitor/cli @capacitor/android
#
# 2. Build the web app:
#    npm run build
#
# 3. Initialize Capacitor (first time only):
#    npx cap init "Taskify" "com.alltasker.taskify" --web-dir dist
#
# 4. Add Android platform:
#    npx cap add android
#
# 5. Copy web assets to Android:
#    npx cap sync android
#
# 6. Open in Android Studio:
#    npx cap open android
#
# 7. Build APK from Android Studio:
#    Build > Build Bundle(s) / APK(s) > Build APK(s)
#
# OR build directly from command line (if Android SDK is installed):
#    cd android && ./gradlew assembleDebug
#
# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
