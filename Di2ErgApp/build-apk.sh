#!/bin/bash

# Di2 ERG App - Build Release APK Script

set -e

echo "🔨 Building Di2 ERG Training App APK..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Di2ErgApp directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean

# Build release APK
echo "🏗️ Building release APK..."
./gradlew assembleRelease

# Check if APK was created
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo "✅ APK built successfully!"
    echo "📍 Location: android/$APK_PATH"
    echo ""
    echo "📱 To install on your Android device:"
    echo "   1. Enable 'Install unknown apps' in Android settings"
    echo "   2. Transfer the APK file to your device"
    echo "   3. Tap the APK file to install"
    echo ""
    echo "🚴 Your Di2 ERG Training App is ready!"
else
    echo "❌ Error: APK build failed"
    exit 1
fi