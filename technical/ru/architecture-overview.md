# Kii Health Mobile: Обзор технической архитектуры

## Описание проекта

Kii Health Mobile — это приложение на React Native, построенное с использованием Expo Router для управления рабочими процессами в здравоохранении. Проект реализует сложную архитектуру, охватывающую аутентификацию, маршрутизацию, управление файлами и синхронизацию состояния.

---

## 1. Структура React Native проекта

### Организация каталогов

```
kiimobile/
├── app/                          # Маршрутизация на основе Expo Router
│   ├── _layout.tsx              # Корневой макет со всеми провайдерами
│   ├── index.tsx                # Приветственный/начальный экран
│   ├── (auth)/                  # Группа маршрутов аутентификации
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (main)/                  # Группа маршрутов основного приложения
│       ├── _layout.tsx
│       ├── (tabs)/              # Навигация на основе вкладок
│       │   ├── messages.tsx
│       │   ├── profile.tsx
│       │   └── settings.tsx
│       └── details/[id].tsx     # Динамические маршруты
│
├── api/                          # Слой API
│   ├── axios-client.tsx          # Настроенный HTTP клиент
│   ├── query-client.ts           # Настройка React Query
│   ├── errors.ts                 # Пользовательские классы ошибок
│   ├── services/                 # Сервисы по доменам
│   │   ├── MessageService.ts
│   │   ├── UserService.ts
│   │   └── FileService.ts
│   └── dto/                      # Объекты передачи данных
│
├── components/                   # Переиспользуемые UI компоненты
│   ├── ui/                       # Базовые UI компоненты
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── messages/                 # Компоненты сообщений
│   ├── forms/                    # Компоненты форм
│   └── live-chat/                # UI компоненты чата
│
├── store/                        # Управление глобальным состоянием
│   ├── authStore.tsx             # Состояние аутентификации (Zustand)
│   ├── userStore.tsx             # Состояние профиля пользователя
│   ├── tokensStateStore.tsx       # Управление токенами
│   └── networkInfoStore.tsx       # Статус сети
│
├── hooks/                        # Пользовательские React хуки
│   ├── useDownloadMessageAttachments.tsx
│   ├── useCheckNetworkStatus.tsx
│   ├── useAppStateManager.tsx
│   └── index.ts                  # Экспорт хуков
│
├── contexts/                     # React Context API
│   ├── auth.tsx                  # Контекст и провайдер аутентификации
│   └── downloadMessageAttachments.tsx
│
├── sqlite/                       # Локальная база данных
│   └── migrations/               # Миграции схемы
│
├── storage/                      # Абстракции хранилища
│   ├── authStorage.tsx           # Хранилище токенов аутентификации
│   └── secureStore.tsx           # Защищённое хранилище
│
├── models/                       # TypeScript модели данных
│   ├── Message.ts
│   ├── Attachment.ts
│   └── PatientProfile.ts
│
├── localization/                 # Настройка i18n
│   ├── i18.ts
│   ├── en-US/
│   └── fr-CA/
│
├── configs/                      # Конфигурация окружения
│   ├── env-config.ts             # Dev/Staging/Production
│   └── roles.ts                  # Контроль доступа на основе ролей
│
├── constants/                    # Константы приложения
├── helpers/                      # Вспомогательные функции
├── utils/                        # Общие утилиты
├── types/                        # Определения TypeScript типов
│
├── ios/                          # iOS-специфичный код
│   ├── Podfile                   # Зависимости CocoaPods
│   └── KiiHealthDev.xcodeproj/
│
├── android/                      # Android-специфичный код
│   ├── build.gradle
│   └── app/
│
├── app.config.ts                 # Конфигурация Expo приложения
├── babel.config.js               # Конфигурация Babel
├── tailwind.config.js            # Настройка NativeWind/Tailwind
└── package.json                  # Зависимости проекта
```

### Команды сборки

```bash
# Окружение разработки
npm run prebuild:dev              # Настройка нативной сборки
npm run ios:dev                   # Запуск на iOS симуляторе
npm run android:dev               # Запуск на Android эмуляторе

# Staging окружение
npm run prebuild:stg
npm run ios:stg

# Production окружение
npm run prebuild:prod
npm run ios:prod
```

### Ключевые зависимости

- **expo**: Кроссплатформенный фреймворк React Native
- **expo-router**: Маршрутизация на основе файлов (как Next.js)
- **react-native**: Основной фреймворк
- **zustand**: Лёгкое управление состоянием
- **@tanstack/react-query**: Управление состоянием сервера
- **nativewind**: Tailwind CSS для React Native
- **expo-sqlite**: SQLite локальная база данных
- **expo-file-system**: Операции с файлами
- **expo-auth-session**: OAuth/OIDC аутентификация

---

## 2. Стратегия аутентификации и подход к безопасности

### Поток аутентификации

```
┌──────────────────────────────────────────────────────────────────┐
│                     ПОТОК АУТЕНТИФИКАЦИИ                          │
└──────────────────────────────────────────────────────────────────┘

1. НАЧАЛЬНОЕ СОСТОЯНИЕ
   ├─ Пользователь открывает приложение
   ├─ Приложение проверяет наличие сохранённых токенов
   └─ Маршрутизирует на приветственный или основной экран

2. ПРОЦЕСС ВХОДА
   ├─ Пользователь вводит учётные данные (email/пароль)
   ├─ Инициируется Keycloak OIDC поток
   │  ├─ Вызов конечной точки авторизации
   │  └─ Генерируется PKCE код подтверждения
   ├─ Пользователь авторизуется в системном браузере
   ├─ Код авторизации возвращается через deep link
   └─ Обмен токенов: код → access/refresh токены

3. УПРАВЛЕНИЕ ТОКЕНАМИ
   ├─ Токен доступа (короткий срок, ~15 мин)
   │  └─ Используется в заголовке Authorization
   ├─ Токен обновления (длительный срок, дни/недели)
   │  └─ Используется для получения нового access токена
   └─ JWT декодируется для извлечения ролей/областей доступа

4. АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ТОКЕНОВ
   ├─ Перехватчик Axios проверяет истечение токена
   ├─ При истечении использует refresh токен
   ├─ Молча получает новый access токен
   └─ Повторяет исходный запрос

5. ПРОЦЕСС ВЫХОДА
   ├─ Пользователь нажимает выход
   ├─ Токены удаляются из защищённого хранилища
   ├─ Сессия Keycloak инвалидируется
   └─ Маршрутизатор перенаправляет на приветственный экран
```

### Детали реализации безопасности

#### Хранилище токенов

```typescript
// Защищённое хранилище токенов с использованием expo-secure-store
import * as SecureStore from "expo-secure-store";

const authStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  }
};
```

#### Конфигурация Keycloak OIDC

```typescript
// configs/env-config.ts
export const KC_CONFIG = {
  dev: {
    realm: "kiimobile-dev",
    client_id: "kiimobile-client-dev",
    redirect_uri: "com.kiihealth.kiihealthmobile.dev://oauth-callback",
    endpoint: "https://keycloak-dev.example.com"
  },
  staging: {
    realm: "kiimobile-staging",
    client_id: "kiimobile-client-stg",
    redirect_uri: "com.kiihealth.kiihealthmobile.stg://oauth-callback",
    endpoint: "https://keycloak-stg.example.com"
  },
  production: {
    realm: "kiimobile-prod",
    client_id: "kiimobile-client-prod",
    redirect_uri: "com.kiihealth.kiihealthmobile://oauth-callback",
    endpoint: "https://keycloak.example.com"
  }
};
```

#### Сохранение cookies (iOS)

```typescript
// iOS требует сохранение cookies для аутентификации
import { CookieManager } from "@react-native-cookies/cookies";

useEffect(() => {
  CookieManager.clearAll(true); // Очистить старые cookies
  // Cookies Keycloak теперь сохраняются правильно
}, []);
```

#### Декодирование JWT и извлечение ролей

```typescript
// authStore.tsx - хранилище Zustand
export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      roles: [],

      setTokens: (accessToken, refreshToken) => {
        const decoded = jwtDecode(accessToken);
        set({
          accessToken,
          refreshToken,
          roles: decoded.realm_access?.roles || []
        });
      }
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => authStorage)
    }
  )
);
```

#### Внедрение заголовка авторизации

```typescript
// api/axios-client.tsx
const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// Перехватчик: Внедрение Bearer токена
axiosInstance.interceptors.request.use(async (config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Перехватчик: Обработка 401 Unauthorized (токен истёк)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { refreshToken, setTokens } = useAuthStore.getState();
      const newTokens = await refreshAccessToken(refreshToken);
      setTokens(newTokens.access_token, newTokens.refresh_token);
      return axiosInstance.request(error.config); // Повтор
    }
    throw error;
  }
);
```

#### Контроль доступа на основе ролей (RBAC)

```typescript
// hooks/useHasAccess.tsx
export const useHasAccess = (requiredRole: string) => {
  const { roles } = useAuthStore();
  return roles.includes(requiredRole);
};

// Использование в компонентах
function AdminPanel() {
  const hasAccess = useHasAccess("admin");

  if (!hasAccess) {
    return <Text>Доступ запрещён</Text>;
  }

  return <AdminDashboard />;
}
```

---

## 3. Структура маршрутизации (Expo Router)

### Система маршрутизации на основе файлов

Expo Router автоматически определяет маршруты по путям файлов:

```
app/
├── _layout.tsx              → Корневая обёртка для всех маршрутов
├── index.tsx                → / (экран приветствия)
├── (auth)/                  → Группа маршрутов (общий макет)
│   ├── _layout.tsx          → Общий макет для экранов аутентификации
│   ├── login.tsx            → /login
│   ├── register.tsx         → /register
│   └── forgot-password.tsx  → /forgot-password
├── (main)/                  → Группа маршрутов основного приложения
│   ├── _layout.tsx          → Основной макет + нижние вкладки
│   ├── (tabs)/              → Вложенная группа вкладок
│   │   ├── _layout.tsx      → Настройка навигации вкладок
│   │   ├── messages.tsx     → /messages
│   │   ├── profile.tsx      → /profile
│   │   └── settings.tsx     → /settings
│   ├── message-detail/[id].tsx  → /message-detail/123
│   └── document-viewer.tsx  → /document-viewer
└── _error.tsx               → Граница ошибок
```

### Поток навигации маршрутов

```
ЭКРАН ПРИВЕТСТВИЯ
    ↓
Есть токен? ──НЕТ→ (auth) группа
    ↓ ДА
Токен валиден? ──НЕТ→ Обновить токен
    ↓ ДА
(main) группа ──→ (tabs) ──→ messages / profile / settings
    ↓
Динамические маршруты ──→ message-detail/[id]
                         document-viewer
```

### Реализация маршрутизации

#### Корневой макет (`app/_layout.tsx`)

```typescript
export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <DownloadMessageAttachmentsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: true
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" />
        ) : (
          <Stack.Screen name="(main)" />
        )}
      </Stack>
    </DownloadMessageAttachmentsProvider>
  );
}
```

#### Макет аутентификации (`app/(auth)/_layout.tsx`)

```typescript
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

#### Основной макет с вкладками (`app/(main)/_layout.tsx`)

```typescript
export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarLabelPosition: "below-icon"
      }}
    >
      <Tabs.Screen
        name="(tabs)"
        options={{
          title: "Сообщения",
          tabBarIcon: ({ color }) => <MessageIcon color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Параметры",
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />
        }}
      />
    </Tabs>
  );
}
```

#### Динамический маршрут (`app/(main)/message-detail/[id].tsx`)

```typescript
import { useLocalSearchParams } from "expo-router";

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Получить сообщение с id
  const { data: message } = useQuery({
    queryKey: ["message", id],
    queryFn: () => MessageService.getById(id)
  });

  return <MessageDetail message={message} />;
}
```

### Deep Linking

```typescript
// app/+not-found.tsx
import { Link } from "expo-router";

export default function NotFound() {
  return (
    <View>
      <Text>Этот экран не существует.</Text>
      <Link href="/">Перейти на главную</Link>
    </View>
  );
}

// Пользовательская обработка deep link
const linking = {
  prefixes: ["com.kiihealth.kiihealthmobile://", "kiihealth://"],
  config: {
    screens: {
      "(main)/message-detail/[id]": "message/:id",
      "(main)/document-viewer": "document/:id",
      "(auth)/login": "auth/login"
    }
  }
};
```

---

## 4. Обработка загрузок файлов из сообщений

### Полный конвейер загрузки

#### Шаг 1: Настройка провайдера контекста

```typescript
// contexts/downloadMessageAttachments.tsx
export const DownloadMessageAttachmentsProvider = ({
  children
}: PropsWithChildren) => {
  // Управление очередью
  const {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
    setIsProcessing
  } = useManageProcessingQueue();

  // Получение токена
  const getAuthToken = async () => {
    const { accessToken } = useAuthStore.getState();
    return accessToken;
  };

  // Загрузка одного файла с кешированием
  const downloadFile = async (command: DownloadCommand) => {
    // Проверка кеша, получение токена авторизации, загрузка через API
    // См. раздел 3.2 файла download-attachment-flow.md
  };

  // Цикл обработки очереди
  const processQueue = async () => {
    // Последовательная обработка всех файлов в очереди
    // См. раздел 3.3 файла download-attachment-flow.md
  };

  // Предоставление контекста всем дочерним элементам
  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
```

#### Шаг 2: Хук автоматической загрузки

```typescript
// hooks/useDownloadMessageAttachments.tsx
export const useDownloadMessageAttachments = () => {
  const { addCommand, startProcessing, resetQueue } =
    useDownloadMessageAttachmentsContext();

  // Получение всех вложений сообщений
  const { attachments } = useAllMessages({ limit: "50" });

  // Отслеживание состояния приложения и сети
  const { appState } = useAppStateStore();
  const { isConnected } = useCheckNetworkStatus();

  // Автоматический запуск загрузок при выполнении условий
  useEffect(() => {
    if (isAppStateActive(appState) && isConnected && attachments.length) {
      addFilesToProcessingQueue(attachments);
      startProcessing();
    }
  }, [attachments.length, appState, isConnected]);
};
```

#### Шаг 3: Интеграция в макет приложения

```typescript
// app/_layout.tsx
export default function RootLayout() {
  // Автоматическая загрузка вложений в фоне
  useDownloadMessageAttachments();

  return (
    <Stack>
      {/* Маршруты приложения */}
    </Stack>
  );
}
```

#### Шаг 4: Ручная загрузка из чата

```typescript
// components/messages/AttachmentButton.tsx
export function AttachmentButton({ attachment }: Props) {
  const { downloadFileFromMessage, isProcessing } =
    useDownloadMessageAttachmentsContext();

  const handleDownload = async () => {
    const success = await downloadFileFromMessage(attachment);
    if (success) {
      Toast.show("Файл загружен");
      // Открыть просмотрщик файлов или поделиться
    }
  };

  return (
    <Button
      loading={isProcessing}
      onPress={handleDownload}
      title="Загрузить"
    />
  );
}
```

### Диаграмма архитектуры загрузки

```
┌─────────────────────────────────────────────────────┐
│          СООБЩЕНИЕ ПОЛУЧЕНО С СЕРВЕРА              │
└──────────────────────┬────────────────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ useDownloadMessageAttachments │ (Hook)
        │ - Проверяет статус сети       │
        │ - Проверяет состояние приложения
        │ - Заполняет очередь           │
        └──────────────┬────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ DownloadMessageAttachments    │
        │ Context                       │
        │ - Управляет очередью (useRef) │
        │ - Обрабатывает последовательно│
        │ - Обрабатывает паузу/возобновление
        └──────────────┬────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ downloadFile()                │
        │ - Проверка кеша (FileSystem)  │
        │ - GET токена авторизации      │
        │ - POST к API                  │
        │ - Сохранение в /Documents/files/
        │ - Base64 кодирование          │
        └──────────────┬────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ ЛОКАЛЬНАЯ ФАЙЛОВАЯ СИСТЕМА    │
        │ /Documents/files/{id}.{ext}   │
        └──────────────────────────────┘
```

### Стратегия кеширования

```typescript
// Проверка локального кеша перед загрузкой
const path = `${ATTACHMENTS_DIR}${id}.pdf`;
const fileInfo = await FileSystem.getInfoAsync(path);

if (fileInfo.exists) {
  return true; // ✓ Пропустить загрузку
}

// Загрузить и закешировать
await FileSystem.writeAsStringAsync(path, base64Data, {
  encoding: FileSystem.EncodingType.Base64
});
```

### Обработка ошибок

```typescript
try {
  // Попытка загрузки
  const response = await RNFetchBlob.fetch("POST", url, headers, body);

  if (response.respInfo.status >= 400) {
    throw new Error(`HTTP ${response.respInfo.status}`);
  }
} catch (error) {
  console.error("[File Processing] Загрузка не удалась:", error);
  // Очередь остаётся нетронутой, можно повторить позже
  break; // Остановить обработку при ошибке
}
```

---

## 5. Итоговая сводка: Технические преимущества

| Аспект                    | Подход                           | Преимущество                                                         |
| ------------------------- | -------------------------------- | -------------------------------------------------------------------- |
| **Аутентификация**        | Keycloak OIDC + PKCE             | Безопасность корпоративного уровня, автоматизация обновления токенов |
| **Маршрутизация**         | Expo Router (на основе файлов)   | Предсказуемая навигация, типобезопасные deep links                   |
| **Управление состоянием** | Zustand + Context                | Лёгкий вес, сохраняемость, реактивность                              |
| **Загрузки файлов**       | На основе очереди с кешированием | Надёжность, возобновляемость, неблокирующий характер                 |
| **Слой API**              | Axios + React Query              | Централизованная обработка ошибок, автоматические повторы            |
| **UI фреймворк**          | NativeWind/Tailwind              | Консистентный стиль, переиспользование кода                          |
| **Офлайн поддержка**      | SQLite + MMKV                    | Сохранение локальных данных                                          |
| **Интернационализация**   | i18next                          | Многоязычная поддержка (EN/FR)                                       |

Эта архитектура обеспечивает масштабируемую, безопасную и поддерживаемую основу для приложений здравоохранения.
