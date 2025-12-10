# Технологический стек Kii Health Mobile

## Обзор

Kii Health Mobile — это современное мобильное приложение для здравоохранения, построенное на передовых технологиях с использованием архитектуры микросервисов и облачных вычислений.

---

## 1. Backend — Project Fusion Microservices

### Технологии

**Java 17** — Современная версия Java с улучшениями производительности и безопасности

**Quarkus Framework** — Облачно-ориентированный (cloud-native) фреймворк для создания микросервисов:

- ⚡ Супер быстрый запуск (milliseconds)
- 💾 Минимальное использование памяти
- 🐳 Оптимизирован для контейнеризации (Docker, Kubernetes)
- 🔧 Идеален для serverless и edge computing

**Maven** — Инструмент управления сборкой и зависимостями Java проектов

### Основные компоненты

```
Project Fusion Backend
├── Keycloak Authentication Server
│   ├─ OAuth 2.0/OpenID Connect
│   ├─ Role-Based Access Control (RBAC)
│   └─ Multi-realm support (dev/staging/prod)
│
├── REST API Endpoints
│   ├─ Healthcare data processing
│   ├─ Messaging services
│   ├─ User management
│   └─ Profile management
│
├── Microservices Architecture
│   ├─ Messaging Service
│   ├─ Profile Service
│   ├─ Integration Service
│   ├─ Dashboard Service
│   └─ Other domain services
│
└── Supporting Infrastructure
    ├─ Database Layer (PostgreSQL)
    ├─ Message Queue (RabbitMQ/Kafka)
    ├─ Caching Layer (Redis)
    └─ Monitoring & Logging
```

### Преимущества выбора Java/Quarkus

✅ **Производительность** — JVM оптимизирован для долгоживущих приложений  
✅ **Масштабируемость** — Микросервисная архитектура для независимого масштабирования  
✅ **Надежность** — Зрелая экосистема и множество production-ready библиотек  
✅ **Безопасность** — Встроенные механизмы безопасности и шифрования  
✅ **Cloud-Native** — Оптимизирован для Kubernetes и облачных платформ

---

## 2. Frontend — React Native с Expo

### Основные технологии

**React Native 0.79.5** — JavaScript фреймворк для кроссплатформенной мобильной разработки:

- 📱 Один код для iOS и Android
- ⚡ Горячая перезагрузка (Hot Reload) для быстрой разработки
- 🎯 Native performance благодаря компиляции в Native код

#### ⚡ Горячая перезагрузка (Hot Reload) для быстрой разработки

**Что это:** Механизм мгновенного обновления приложения без полной перезагрузки при изменении кода.

**Как работает:**
- Изменения в коде автоматически применяются к запущенному приложению
- Состояние приложения сохраняется между обновлениями
- Время обновления: менее 1 секунды (vs. 30-60 секунд полной перезагрузки)

**Преимущества:**
- ✅ **Мгновенная обратная связь** — видите изменения сразу после сохранения файла
- ✅ **Сохранение состояния** — не теряете данные формы, позицию скролла, состояние компонентов
- ✅ **Ускорение разработки** — до 10x быстрее итераций по сравнению с нативной разработкой
- ✅ **Отладка в реальном времени** — тестируете UI изменения без перезапуска

**Пример использования:**
```typescript
// Изменяете стиль кнопки
<Button style={{ backgroundColor: 'blue' }} /> // Сохраняете файл
// → Приложение обновляется мгновенно, состояние сохраняется
```

#### 🎯 Native Performance благодаря компиляции в Native код

**Что это:** React Native компилирует JavaScript код в нативные компоненты, используя нативные API платформы.

**Архитектура производительности:**

1. **New Architecture (React Native 0.79.5):**
   - **Fabric Renderer** — новый рендерер, работающий напрямую с нативными компонентами
   - **TurboModules** — синхронный доступ к нативным модулям без bridge
   - **JSI (JavaScript Interface)** — прямая связь между JS и нативным кодом

2. **Компиляция в Native:**
   ```
   JavaScript/TypeScript код
         ↓
   Metro Bundler (транспиляция)
         ↓
   Hermes Engine (оптимизация)
         ↓
   Native Components (iOS/Android)
   ```

**Преимущества производительности:**

- ✅ **Нативная скорость** — приложения работают с производительностью близкой к нативным
- ✅ **Плавная анимация** — 60 FPS благодаря прямому доступу к нативным API
- ✅ **Быстрый запуск** — Hermes engine обеспечивает быстрый старт приложения
- ✅ **Оптимизация памяти** — эффективное управление памятью через нативные компоненты
- ✅ **Прямой доступ к API** — использование всех возможностей платформы (камера, GPS, сенсоры)

**Сравнение производительности:**

| Метрика | React Native 0.79.5 | Нативные приложения |
|---------|---------------------|---------------------|
| Время запуска | ~1-2 сек | ~1-2 сек |
| FPS анимации | 60 FPS | 60 FPS |
| Использование памяти | Оптимизировано | Оптимизировано |
| Размер приложения | Компактный | Компактный |

**Технические детали:**

- **Hermes Engine** — оптимизированный JavaScript движок для React Native
- **Code Splitting** — автоматическое разделение кода для уменьшения размера bundle
- **Lazy Loading** — загрузка компонентов по требованию
- **Native Modules** — возможность использования нативных библиотек напрямую

**Expo SDK 53** — Фреймворк, упрощающий разработку с React Native:

- 📦 Pre-built компоненты и API
- 🚀 EAS (Expo Application Services) для управления сборками
- 🔄 Over-the-air обновления без переоборки приложения

**TypeScript** — Типизированный надмножество JavaScript:

- 🛡️ Ранее обнаружение ошибок на этапе разработки
- 📖 Лучшая документация кода через типы
- 🧠 Улучшенная IDE поддержка и автодополнение

**NativeWind (TailwindCSS)** — Утилитарный CSS фреймворк для мобильных приложений:

- 🎨 Быстрое прототипирование с utility классами
- 📐 Консистентный дизайн через систему constraints
- 🎯 Меньше кода, больше функциональности

**Expo Router** — File-based маршрутизация для React Native:

- 🗂️ Структурированная файловая система для маршрутов
- 🔗 Глубокие ссылки (deep linking) из коробки
- ⚙️ Группы маршрутов для организации кода

### Архитектура состояния

**React Query** — Server state management:

- 🌐 Синхронизация данных с backend'ом
- 🔄 Автоматический повтор при ошибках
- 💾 Кеширование и background синхронизация
- 🔄 Обновление токенов в фоне

**Zustand** — Global client state management:

- 🏪 Управление локальным состоянием приложения
- 💾 Персистентное хранилище
- ⚡ Легкий вес и быстрый
- 🔐 Безопасное хранение чувствительных данных (MMKV, SecureStore)

### Компонентная архитектура

```
Kii Mobile App Structure
│
├── UI Components Layer
│   ├─ Custom TabBar (нижняя навигация)
│   ├─ Header Components (верхние кнопки)
│   ├─ MailTabBarIcon (иконки с бейджами)
│   ├─ Form Components
│   └─ Reusable UI Elements
│
├── Page/Screen Layer
│   ├─ (pillars) — Дома/Услуги
│   ├─ (messages) — Сообщения
│   ├─ (chat) — Live Chat
│   └─ (patient) — Профиль пользователя
│
├── Business Logic Layer
│   ├─ Hooks (usePatientProfile, useHasAccess, etc.)
│   ├─ Services (MessageService, ProfileService)
│   ├─ API Clients (Axios + interceptors)
│   └─ Error Handling
│
├── State Management Layer
│   ├─ Auth Store (токены, пользователь)
│   ├─ User Store (профиль пользователя)
│   ├─ Network Store (статус сети)
│   └─ Other domain stores
│
└── Infrastructure Layer
    ├─ SQLite Database (локальное хранилище)
    ├─ SecureStore (безопасное хранилище)
    ├─ MMKV (быстрое key-value хранилище)
    ├─ File System (загрузки и кеш)
    └─ WebView (специализированный контент)
```

---

## 3. Database — Гибридный подход

### Local Storage (на устройстве)

**SQLite с Expo SQLite**:

- 📱 Встроенная БД на каждом устройстве
- 📴 Работает полностью offline
- 💾 Хранит сообщения и вложения локально
- 🔄 Синхронизируется с backend при наличии сети

### Secure Storage

**Expo Secure Store** — Защищенное хранилище для чувствительных данных:

- 🔐 JWT токены (access/refresh)
- 🗝️ Биометрические данные
- 🔑 Учетные данные

**MMKV** — Быстрое key-value хранилище:

- ⚡ 10x быстрее чем AsyncStorage
- 📊 Для часто обновляемых данных
- 🔢 Статус синхронизации, флаги функций

### External Backend Databases

**REST API доступ** к backend базам:

- 👤 User profiles и демографические данные
- 📋 Healthcare records
- 💬 Messages (синхронизируются через API)
- 📊 Analytics и медицинские данные

---

## 4. Authentication & Authorization — Keycloak

### Protokol OAuth 2.0 с PKCE

```
┌─────────────────────────────────────────────────────┐
│           OAuth 2.0 Authorization Code Flow         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. App generates code_challenge (from code_verifier)
│  2. Opens browser to Keycloak authorization endpoint
│  3. User enters credentials
│  4. Keycloak redirects with authorization code
│  5. App exchanges code for tokens (using code_verifier)
│  6. Keycloak validates code_verifier and issues tokens
│  7. App stores tokens securely
│                                                     │
└─────────────────────────────────────────────────────┘
```

### PKCE (Proof Key for Public Clients)

🔒 **Защита от authorization code interception**:

- `code_verifier` — Random 128-character string
- `code_challenge` — SHA256 hash of code_verifier
- Только оригинальное приложение может обменять код

### Multi-Environment Realms

```
Keycloak Server
├── fusion-test (Development)
│   ├─ Test users
│   ├─ Development settings
│   └─ Loose policies
│
├── fusion-staging (Pre-production)
│   ├─ Staging users
│   ├─ Production-like config
│   └─ Testing policies
│
└── fusion-prod (Production)
    ├─ Real users
    ├─ Strict security
    └─ Production policies
```

### Role-Based Access Control

```typescript
// JWT Token содержит роли пользователя
{
  "sub": "user-id",
  "email": "user@example.com",
  "roles": ["patient", "messages-access", "live-chat-access"],
  "realm_access": {
    "roles": ["user", "manage-account"]
  }
}

// UI рендерится условно на основе ролей
if (userRoles.includes("live-chat-access")) {
  // Показать вкладку Live Chat
}
```

---

## 5. Infrastructure & Deployment

### Expo Application Services (EAS)

**EAS Build** — Облачная сборка приложения:

- 🏗️ Сборка iOS на Mac в облаке
- 🏗️ Сборка Android на Linux в облаке
- 📦 Создание APK и IPA пакетов
- 🔐 Управление сертификатами и provisioning profiles

**EAS Submit** — Автоматическая отправка в магазины:

- 🍎 TestFlight для iOS (внутреннее тестирование)
- 🍎 App Store Connect для публикации
- 🤖 Google Play для Android
- 📊 Управление версиями и релизами

### Backend Infrastructure (CloudMD)

**Kubernetes** — Оркестрация контейнеров:

- 🐳 Развертывание микросервисов в контейнерах
- 📈 Auto-scaling на основе нагрузки
- 🔄 Rolling updates без downtime
- 🌐 Load balancing и service discovery

**CloudMD Platform**:

- 🏥 Управляемая медицинская инфраструктура
- 🔐 HIPAA-compliant (соответствие стандартам)
- 🌍 Geo-distributed для reliability
- 📊 Monitoring и alerting

### CI/CD Pipeline (GitHub Actions)

```
GitHub Push
    ↓
1. Code Lint & Format Check
    ↓
2. TypeScript Compilation Check
    ↓
3. Unit Tests Execution
    ↓
4. Build iOS/Android (EAS)
    ↓
5. Integration Tests
    ↓
6. Upload to TestFlight/Google Play
    ↓
7. Deploy to App Store (manual approval)
```

### Distribution Channels

**iOS**:

- 🧪 TestFlight — Internal & beta testing
- 📱 App Store — Production distribution
- 🔐 Signed with Apple developer certificates

**Android**:

- 🧪 Google Play Internal Testing — QA team
- 📱 Google Play — Production distribution
- 🔑 Signed with app signing key

---

## 6. Security Architecture

### Token Management

```
┌─────────────────────────────────────────┐
│         Token Lifecycle                 │
├─────────────────────────────────────────┤
│                                         │
│ 1. User Login                           │
│    └─ Get access_token (15 min)         │
│    └─ Get refresh_token (7 days)        │
│                                         │
│ 2. Store Securely                       │
│    └─ access_token → SecureStore        │
│    └─ refresh_token → SecureStore       │
│                                         │
│ 3. Background Refresh                   │
│    └─ Before expiration (14 min)        │
│    └─ On app resume                     │
│    └─ On API 401 response               │
│                                         │
│ 4. Logout                               │
│    └─ Clear tokens from SecureStore     │
│    └─ Revoke at Keycloak                │
│                                         │
└─────────────────────────────────────────┘
```

### Inactivity Timeout

⏱️ **Auto-logout** при неактивности пользователя:

- Отслеживание последней активности
- Проверка AppState (foreground/background)
- Автоматический выход при timeout

### Biometric Authentication

🔐 **Face ID / Touch ID**:

- Быстрая аутентификация
- Безопасное сравнение биометрии
- Fallback на пароль

---

## 7. Архитектурные паттерны

### Service Layer Pattern

```
UI Components
    ↓
Hooks (Business Logic)
    ↓
Services (API Communication)
    ├─ MessageService
    ├─ ProfileService
    ├─ ChatService
    └─ etc.
    ↓
Axios Client (HTTP Layer)
    ├─ Request interceptors (add auth header)
    ├─ Response interceptors (handle errors)
    └─ Auto token refresh
    ↓
Backend REST APIs
```

### Store Pattern (Zustand)

```typescript
// Zustand store structure
export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      // State
      tokens: null,
      user: null,

      // Actions
      setTokens: (tokens) => set({ tokens }),
      logout: () => set({ tokens: null, user: null })
    }),
    {
      name: "auth-storage",
      storage: secureStorage // Encrypted storage
    }
  )
);
```

### File-based Routing (Expo Router)

```
app/
├── _layout.tsx         (Root layout)
├── index.tsx           (Home)
│
├── (auth)/             (Route group - no URL segment)
│   ├── login.tsx
│   ├── register.tsx
│   └── _layout.tsx     (Auth stack)
│
└── (main)/             (Authenticated routes)
    ├── (tabs)/         (Bottom tab navigation)
    │   ├── (pillars)/  (Home tab)
    │   ├── (messages)/ (Messages tab)
    │   ├── (chat)/     (Live chat tab)
    │   └── patient/    (Profile tab)
    │
    ├── send-message    (Modal)
    └── _layout.tsx     (Main stack)
```

---

## 8. Интеграции и External Services

### OpenAPI Code Generation

```bash
# Автоматическое генерирование TypeScript клиента из OpenAPI spec
CONTROLLER=controller npm run generate:axios-client
```

✅ **Преимущества**:

- 🔄 Типизированные API клиенты
- 📝 Автоматическая документация
- 🔀 Синхронизация с backend API
- ⚡ Быстрое обновление при изменении API

### WebView Integration

🌐 **Специализированный контент**:

- Live Chat (через WebSocket)
- Rich Media Content
- Third-party интеграции
- Analytics tracking

### Push Notifications

📲 **Expo Notifications**:

- ✉️ Локальные уведомления
- ☁️ Remote notifications от backend
- ⏰ Scheduled notifications
- 🔊 Управление звуком и вибрацией

---

## 9. Development Tools & Environment

### Development Environment Variants

```bash
# Development build
npm run prebuild:dev && npm run ios:dev

# Staging build
npm run prebuild:stg && npm run ios:stg

# Production-like build
npm run ios:prod
```

### Environment Configuration

```typescript
// configs/env-config.ts
export const envConfig = {
  dev: {
    apiBaseURL: "http://localhost:8000",
    keycloakURL: "http://localhost:8080",
    realm: "fusion-test"
  },
  staging: {
    apiBaseURL: "https://api-staging.example.com",
    keycloakURL: "https://auth-staging.example.com",
    realm: "fusion-staging"
  },
  production: {
    apiBaseURL: "https://api.example.com",
    keycloakURL: "https://auth.example.com",
    realm: "fusion-prod"
  }
};
```

### Testing Tools

🧪 **Quality Assurance**:

- Jest (Unit tests)
- React Testing Library (Component tests)
- Cypress (E2E tests)
- EAS Device Farm (Real device testing)

---

## 10. Summary — Технологический стек

| Слой                | Технология                       | Назначение                  |
| ------------------- | -------------------------------- | --------------------------- |
| **Mobile Frontend** | React Native 0.79.5, Expo SDK 53 | iOS/Android приложение      |
| **Navigation**      | Expo Router                      | File-based маршрутизация    |
| **Styling**         | NativeWind (TailwindCSS)         | Утилитарные стили           |
| **Client State**    | Zustand                          | Global состояние приложения |
| **Server State**    | React Query                      | Синхронизация с backend     |
| **Language**        | TypeScript                       | Типизация и IDE поддержка   |
| **HTTP Client**     | Axios                            | REST API communication      |
| **Authentication**  | Keycloak OAuth 2.0               | OAuth & authorization       |
| **Local Storage**   | SQLite                           | Offline data                |
| **Secure Storage**  | Expo SecureStore                 | Токены и пароли             |
| **Fast Storage**    | MMKV                             | Key-value кеш               |
| **Backend**         | Java 17 + Quarkus                | Микросервисы                |
| **Build & Deploy**  | EAS, GitHub Actions              | CI/CD pipeline              |
| **Distribution**    | TestFlight, Google Play          | App distribution            |

---

## Архитектурные принципы

### 1. **Offline-First**

- 📴 Приложение работает без интернета
- 🔄 Синхронизация при наличии соединения
- 💾 SQLite + Redux для состояния

### 2. **Security by Design**

- 🔐 PKCE для OAuth
- 🛡️ Защищенное хранилище токенов
- 🔄 Автоматическое обновление токенов
- ⏱️ Auto-logout при неактивности

### 3. **Scalability**

- 🐳 Микросервисная архитектура backend'а
- 📈 Auto-scaling через Kubernetes
- 💾 Кеширование на всех уровнях
- 🔄 Background синхронизация

### 4. **Developer Experience**

- 🔄 Hot Reload для быстрой разработки
- 📖 TypeScript для безопасности типов
- 🧪 Comprehensive testing setup
- 📚 OpenAPI-генерируемые клиенты

---

## Ключевые преимущества архитектуры

✅ **Cross-platform** — Один code для iOS и Android  
✅ **Type-safe** — TypeScript во всем стеке  
✅ **Cloud-native** — Микросервисы, Kubernetes, контейнеры  
✅ **Security-first** — OAuth 2.0, PKCE, secure storage  
✅ **Offline-capable** — SQLite и background sync  
✅ **Scalable** — Автоматическое масштабирование  
✅ **Maintainable** — Чистая архитектура и паттерны  
✅ **Well-tested** — Comprehensive testing на всех уровнях
