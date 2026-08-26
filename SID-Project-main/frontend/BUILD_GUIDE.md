# 📱 React Native App - Build & Deploy Guide

## 🎯 Подготовка к сборке

### 1. Обновление API конфигурации

Откройте `src/config/api.config.js` и обновите production URL:

```javascript
production: {
  API_URL: 'https://api.вашдомен.ru/api/v1',
  WS_URL: 'wss://api.вашдомен.ru',
  TIMEOUT: 15000,
}
```

### 2. Обновление app.json

```json
{
  "expo": {
    "name": "SID Project",
    "slug": "sid-project",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0A"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.sidproject"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A0A0A"
      },
      "package": "com.yourcompany.sidproject"
    }
  }
}
```

## 🍎 iOS Build

### Вариант 1: Expo EAS Build (Рекомендуется)

#### 1. Установка EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Авторизация
```bash
eas login
```

#### 3. Настройка проекта
```bash
eas build:configure
```

#### 4. Создание production build
```bash
# iOS
eas build --platform ios --profile production

# После завершения, скачайте .ipa файл
```

#### 5. Загрузка в App Store
```bash
eas submit --platform ios
```

### Вариант 2: Local Build с Xcode

#### 1. Prebuild
```bash
expo prebuild --platform ios
```

#### 2. Открыть в Xcode
```bash
open ios/SIDProject.xcworkspace
```

#### 3. В Xcode:
- Выберите Team для signing
- Выберите устройство: Generic iOS Device
- Product → Archive
- После архивирования → Distribute App → App Store Connect

## 🤖 Android Build

### Вариант 1: Expo EAS Build (Рекомендуется)

```bash
# Android AAB для Play Store
eas build --platform android --profile production

# Android APK для тестирования
eas build --platform android --profile production --non-interactive
```

### Вариант 2: Local Build

#### 1. Prebuild
```bash
expo prebuild --platform android
```

#### 2. Создание keystore
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore sid-project.keystore -alias sid-key -keyalg RSA -keysize 2048 -validity 10000
```

#### 3. Настройка gradle
Создайте `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=sid-project.keystore
MYAPP_UPLOAD_KEY_ALIAS=sid-key
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

#### 4. Build
```bash
cd android
./gradlew bundleRelease  # AAB для Play Store
# или
./gradlew assembleRelease  # APK для тестирования
```

Файлы будут в:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

## 🚀 Публикация

### iOS App Store

1. **App Store Connect**:
   - Создайте новое приложение
   - Заполните метаданные
   - Добавьте скриншоты
   - Установите цену (бесплатно)

2. **TestFlight** (опционально):
   - Загрузите build через Xcode или EAS
   - Добавьте тестировщиков
   - Соберите feedback

3. **Submission**:
   - Submit for Review
   - Обычно проверка 1-3 дня

### Google Play Store

1. **Play Console**:
   - Создайте новое приложение
   - Заполните описание
   - Добавьте графику
   - Настройте ценообразование

2. **Internal Testing** (опционально):
   - Загрузите AAB в Internal testing
   - Пригласите тестировщиков

3. **Production**:
   - Загрузите production AAB
   - Submit for Review
   - Обычно проверка несколько часов

## 📦 Over-The-Air (OTA) Updates

Если используете Expo:

```bash
# Установка expo-updates
npm install expo-updates

# Публикация обновления
eas update --branch production --message "Bug fixes"
```

Пользователи получат обновление при следующем открытии приложения.

## 🔧 Environment Variables в React Native

Для разных окружений создайте:

```bash
# .env.development
API_URL=http://localhost:3000/api/v1

# .env.production
API_URL=https://api.вашдомен.ru/api/v1

# .env.staging
API_URL=https://staging-api.вашдомен.ru/api/v1
```

Установите `react-native-dotenv`:
```bash
npm install react-native-dotenv
```

Используйте в коде:
```javascript
import { API_URL } from '@env';
```

## 📊 Аналитика и Crash Reporting

### Sentry для crash reporting
```bash
npm install @sentry/react-native

# Инициализация в App.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: __DEV__ ? 'development' : 'production',
});
```

### Firebase Analytics
```bash
expo install expo-firebase-analytics

# Настройка в app.json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

## 🧪 Тестирование перед релизом

### Checklist:
- [ ] API endpoints работают с production URL
- [ ] Все экраны тестированы
- [ ] Авторизация работает корректно
- [ ] Push notifications настроены (если есть)
- [ ] Deep links работают (если есть)
- [ ] Обработка offline режима
- [ ] Loading states везде
- [ ] Error handling везде
- [ ] Тестирование на реальных устройствах
- [ ] Проверка разных версий OS
- [ ] Проверка разных размеров экранов
- [ ] Performance profiling

## 🔄 Continuous Deployment

### GitHub Actions пример

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Stores

on:
  push:
    tags:
      - 'v*'

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: npm install -g eas-cli
      - run: npm ci
      - run: eas build --platform ios --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: npm install -g eas-cli
      - run: npm ci
      - run: eas build --platform android --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 📱 Version Bumping

Автоматизируйте версионирование:

```bash
# package.json
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Обновите также app.json
```

## 🛠️ Полезные команды

```bash
# Очистка кэша
expo start -c

# Reset Metro bundler
npx react-native start --reset-cache

# Build локально для тестирования
expo build:ios -t simulator
expo build:android -t apk

# Проверка размера bundle
npx react-native-bundle-visualizer

# Анализ производительности
npx react-native-performance-profiler
```

## 🎯 Post-Launch

После публикации:
1. Мониторьте crash reports (Sentry)
2. Отслеживайте analytics
3. Читайте reviews
4. Планируйте updates
5. Отвечайте на feedback

## 🔗 Полезные ссылки

- [Expo Documentation](https://docs.expo.dev)
- [React Native Guide](https://reactnative.dev/docs/getting-started)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Guidelines](https://play.google.com/about/developer-content-policy/)

---

**🎉 Готово к релизу!**
