# Система загрузки вложений сообщений - Руководство по презентации

**Полный справочник по реализации для демо-приложения**

---

## Содержание

1. [Краткое описание](#краткое-описание)
2. [Бизнес-ценность и постановка проблемы](#бизнес-ценность-и-постановка-проблемы)
3. [Обзор архитектуры](#обзор-архитектуры)
4. [Ключевые компоненты и поток данных](#ключевые-компоненты-и-поток-данных)
5. [Руководство по реализации](#руководство-по-реализации)
6. [Справочник по коду и примеры](#справочник-по-коду-и-примеры)
7. [Шаги интеграции](#шаги-интеграции)
8. [Чек-лист реализации демо-приложения](#чек-лист-реализации-демо-приложения)

---

## Краткое описание

**Система загрузки вложений сообщений** - это сложное решение для управления файлами для платформы обмена сообщениями в здравоохранении KiiMobile, которое обеспечивает:

- **Автоматические фоновые загрузки**: Файлы из последних сообщений загружаются автоматически при наличии сети
- **Интеллектуальная очередь**: Очередь на основе приоритетов с возможностями приостановки/возобновления
- **Кэширование файлов**: Умное локальное кэширование для предотвращения избыточных загрузок
- **Устойчивость к сети**: Автоматический перезапуск при восстановлении сети
- **Безопасный доступ**: Аутентификация на основе токенов для всех загрузок
- **Неблокирующий UI**: Все операции выполняются асинхронно без зависания приложения

**Ключевая статистика**:

- Поддерживает загрузку вложений из **последних 50 сообщений**
- **Последовательная обработка** с умной приостановкой/возобновлением для приоритетных файлов
- **Управление состоянием на основе Proxy** для реактивного контроля очереди
- **Кодирование Base64** для безопасного хранения файлов в директории кэша

---

## Бизнес-ценность и постановка проблемы

### Решаемые проблемы

| Проблема                                      | Решение                                       |
| --------------------------------------------- | --------------------------------------------- |
| Пользователи не могут получить доступ к файлам в сообщениях | Автоматическая загрузка в локальный кэш       |
| Повторные загрузки тратят трафик              | Умное кэширование - проверка перед загрузкой  |
| Большие загрузки блокируют отзывчивость приложения | Асинхронная обработка очереди                |
| Прерывания сети теряют прогресс загрузки      | Очередь сохраняется; возобновление при подключении |
| Пользователям нужно вручную управлять файлами | Интегрированный просмотрщик с загруженными файлами |
| Проблемы безопасности при передаче файлов     | Аутентифицированные API-вызовы с bearer-токенами |

### Бизнес-влияние

- **Улучшенная координация помощи**: Медицинские работники могут мгновенно получить доступ к медицинским записям и документам, отправленным через сообщения
- **Улучшенный пользовательский опыт**: Бесшовный офлайн-доступ к ранее просмотренным документам
- **Операционная эффективность**: Сокращение обращений в поддержку по вопросам доступа к файлам
- **Безопасность данных**: Защищённые, аутентифицированные загрузки с правильным управлением хранилищем

---

## Обзор архитектуры

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────────┐
│                    Слой приложения                               │
│  (Экран сообщений, Экран чата, Просмотрщик документов)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐      ┌──────────────┐      ┌──────────────┐
    │  Хуки   │      │  Контексты   │      │  Утилиты     │
    │         │      │              │      │              │
    │ - use   │      │ - Download   │      │ - Файловые   │
    │   Down  │      │   Message    │      │   операции   │
    │   load  │      │   Attach...  │      │ - Расширения │
    │   Msgs  │      │              │      │ - Управление │
    │         │      │              │      │   директориями│
    └────┬────┘      └──────┬───────┘      └──────┬───────┘
         │                  │                      │
         └──────────────────┼──────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
        ┌────────────┐            ┌──────────────────┐
        │   React    │            │  Файловая система│
        │   Query    │            │  и сетевой слой  │
        │            │            │                  │
        │ - Сообщения│            │ - RNFetchBlob    │
        │ - API      │            │ - FileSystem API │
        │ - Кэширование│          │ - NetInfo        │
        └────────────┘            └──────────────────┘
```

### Диаграмма потока данных

```
Запуск приложения
    ↓
Инициализация хука useDownloadMessageAttachments
    ↓
[Триггер эффекта] Состояние приложения + Статус сети + Вложения доступны
    ↓
addFilesToProcessingQueue()
    ├─ Проверить последние 50 сообщений на вложения
    ├─ Убедиться, что файл ещё не кэширован
    └─ Добавить в queueRef (приоритет: новейшие первыми через unshift)
    ↓
startProcessing()
    ↓
processQueue()
    ├─ Пока в queueRef есть элементы:
    │  ├─ Получить токен авторизации
    │  ├─ Выполнить POST-запрос к API
    │  ├─ Конвертировать ответ в Base64
    │  ├─ Записать в директорию кэша
    │  ├─ Удалить из очереди
    │  └─ Проверить сигнал паузы
    │
    └─ Установить isProcessing = false
    ↓
[Действие пользователя] Нажатие на вложение в сообщении
    ↓
downloadFileFromMessage(attachment)
    ├─ pauseProcessing() ← Приостановить фоновую очередь
    ├─ downloadFile() ← Загрузить запрошенный пользователем файл
    └─ resumeProcessing() ← Возобновить фоновую очередь
    ↓
[Событие] Приложение уходит в фон
    ↓
(Очередь автоматически приостанавливается - может быть возобновлена)
```

---

## Ключевые компоненты и поток данных

### 1. **DownloadMessageAttachmentsContext** ([contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx))

**Назначение**: Центральное управление состоянием и оркестрация загрузки файлов

**Ключевые экспорты**:

```typescript
type DownloadMessageAttachmentsContextType = {
  isProcessing: boolean; // Индикатор UI: обработка активна?
  addCommand: (command: DownloadCommand) => void; // Добавить в очередь
  resumeProcessing: () => Promise<void>; // Продолжить
  resetQueue: () => void; // Очистить очередь
  pauseProcessing: () => Promise<void>; // Приостановить очередь
  processQueue: () => Promise<void>; // Обработать элементы
  downloadFile: (command: DownloadCommand) => Promise<boolean>;
  startProcessing: () => Promise<void>; // Начать
  downloadFileFromMessage: (attachment: Attachment) => Promise<boolean>;
};

interface DownloadCommand {
  filename: string; // "invoice.pdf"
  url: string; // URL для загрузки через API
  id: string; // Уникальный ID вложения
}
```

**Настройка провайдера**:

```typescript
export const DownloadMessageAttachmentsProvider = ({ children }) => {
  // Все значения контекста создаются здесь
  // Обернуть всё приложение в _layout.tsx
  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};

// Хук для доступа к контексту
export const useDownloadMessageAttachmentsContext = () => {
  // Выбрасывает ошибку при использовании вне провайдера
  return useContext(DownloadMessageAttachmentsContext);
};
```

**Критический внутренний компонент: хук useManageProcessingQueue**

```typescript
const useManageProcessingQueue = () => {
  // Очередь хранится в ref для сохранения между рендерами
  let queueRef = useRef<DownloadCommand[]>([]);

  // Сигнал остановки на основе Proxy для безопасной приостановки
  let { current: shouldStopProxy } = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => Reflect.get(target, prop),
        set: (target, prop, value) => Reflect.set(target, prop, value)
      }
    )
  );

  const addCommand = (command: DownloadCommand) => {
    queueRef.current.unshift(command);  // Добавить в начало (приоритет)
  };

  const resetQueue = () => {
    queueRef.current = [];
    shouldStopProxy.shouldStop = false;
  };

  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true;
    setIsProcessing(false);
    await Promise.resolve();
  };

  return { queueRef, shouldStopProxy, addCommand, pauseProcessing, ... };
};
```

### 2. **Хук useDownloadMessageAttachments** ([hooks/useDownloadMessageAttachments.tsx](hooks/useDownloadMessageAttachments.tsx))

**Назначение**: Автоматическая инициализация очереди при восстановлении сети

**Условия триггера**:

```typescript
// Начинает обработку ТОЛЬКО когда ВСЕ условия истинны:
if (isAppStateActive(appState) && isConnected) {
  startDownloads();
}

// Реагирует на:
// 1. attachments.length - новые сообщения с файлами
// 2. appState - пользователь выводит приложение на передний план
// 3. isConnected - сеть становится доступной
```

**Основная логика**:

```typescript
const addFilesToProcessingQueue = useCallback(
  async (attachments) => {
    resetQueue(); // Очистить предыдущую очередь

    for (const attachment of attachments) {
      // Построить путь к файлу с расширением
      const filename = `${attachment?.id}.${getExtension(attachment?.name)}`;
      const path = `${ATTACHMENTS_DIR}${filename}`;

      // Проверить, уже ли загружен
      const fileInfo = await FileSystem.getInfoAsync(path);

      // Пропустить если нет URL или файл существует
      if (!attachment?.url || fileInfo.exists) continue;

      // Добавить в очередь
      addCommand({
        url: attachment.url,
        filename: attachment.name,
        id: attachment.id
      });
    }
  },
  [addCommand, resetQueue]
);

// Срабатывает при изменении сети/состояния приложения
useEffect(() => {
  if (!attachments.length) return;

  if (isAppStateActive(appState) && isConnected) {
    startDownloads();
  }
}, [attachments.length, appState, isConnected]);
```

### 3. **Функция загрузки файла**

**Расположение**: [contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx)

**Детальный процесс**:

```typescript
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  // ШАГ 1: Получить токен аутентификации
  const accessToken = await getAuthToken();

  // ШАГ 2: Убедиться, что директория кэша существует
  await makeDirectory(ATTACHMENTS_DIR);

  // ШАГ 3: Построить путь к файлу с расширением
  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

  // ШАГ 4: Проверить, уже ли кэширован
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    console.log(`[File Processing] ${filename}, файл уже существует`);
    return true; // ✓ Пропустить загрузку
  }

  // ШАГ 5: Выполнить аутентифицированный API-запрос
  const response = await RNFetchBlob.fetch(
    "POST",
    `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
    {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json, text/plain, */*",
      "Content-Type": "text/plain"
    },
    url // Отправить URL в теле запроса
  );

  // ШАГ 6: Проверить на ошибки
  if (response.respInfo.status >= 400) {
    const message = JSON.parse(response.data).data;
    throw new Error(
      `Ошибка загрузки файла: ${response.respInfo.status}, ${message}`
    );
  }

  // ШАГ 7: Конвертировать и сохранить
  const base64 = await response.base64();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return response.respInfo.status < 400;
};
```

### 4. **Обработка очереди**

```typescript
const processQueue = async () => {
  setIsProcessing(true);

  while (queueRef.current.length) {
    console.log(
      "[File Processing] Обработка очереди, осталось",
      queueRef.current.length
    );

    // Загрузить первый файл
    const result = await downloadFile(queueRef.current[0]);

    // Выход при ошибке
    if (!result) break;

    // Удалить из очереди
    queueRef.current.shift();

    // Проверить флаг паузы
    if (shouldStopProxy.shouldStop) {
      console.log("[File Processing] Остановка обработки");
      shouldStopProxy.shouldStop = false;
      break;
    }
  }

  console.log("[File Processing] Обработка очереди завершена");
  setIsProcessing(false);
};
```

### 5. **Приоритетная загрузка (инициированная пользователем)**

```typescript
const downloadFileFromMessage = async (attachment: Attachment) => {
  // ПАУЗА: Остановить фоновую очередь
  await pauseProcessing();
  console.log("[File Processing] Обработка приостановлена");

  // ЗАГРУЗКА: Запрошенный пользователем файл
  const result = await downloadFile({
    filename: attachment.name,
    url: attachment.url,
    id: attachment.id
  });
  console.log("[File Processing] Загрузка файла из вложения завершена");

  // ВОЗОБНОВЛЕНИЕ: Продолжить фоновую очередь
  console.log("[File Processing] Обработка возобновлена");
  resumeProcessing();

  return result;
};
```

---

## Руководство по реализации

### Фаза 1: Настройка проекта

#### 1.1 Установка зависимостей

```bash
npm install expo-file-system react-native-blob-util
```

**Почему эти?**:

- `expo-file-system`: Файловые операции (чтение, запись, проверка существования)
- `react-native-blob-util`: Обрабатывает загрузку файлов с правильными заголовками

#### 1.2 Создание констант

**Файл**: [constants/File.ts](constants/File.ts)

```typescript
import * as FileSystem from "expo-file-system";

export const FILE_DIR = `${FileSystem.cacheDirectory}kii_mobile/`;
export const ATTACHMENTS_DIR = `${FileSystem.cacheDirectory}attachments/`;

export const EXTENSIONS = {
  PDF: "pdf"
};

export const FILE_TYPES = {
  PDF: "application/pdf"
};
```

**Обновить**: [constants/index.ts](constants/index.ts)

```typescript
export { ATTACHMENTS_DIR, FILE_DIR } from "./File";
```

#### 1.3 Создание файловых утилит

**Файл**: [utils/files.ts](utils/files.ts)

```typescript
import * as FileSystem from "expo-file-system";

import { ATTACHMENTS_DIR } from "@/constants";
import type Attachment from "@/models/Attachment";

// Извлечь расширение файла из имени
export const getExtension = (filename: string) => {
  return filename.split(".")[1];
};

// Получить локальный путь к файлу для вложения
export const getAttachmentFilePath = (attachment: Attachment) =>
  `${ATTACHMENTS_DIR}${attachment.id}.${getExtension(attachment.name)}`;

// Проверить существование директории
export const checkIfDirectoryExists = async (directory: string) => {
  const { isDirectory } = await FileSystem.getInfoAsync(directory).catch(
    () => ({ isDirectory: false })
  );
  return isDirectory;
};

// Создать директорию если не существует
export const makeDirectory = async (directoryUri: string) => {
  const directoryExists = await checkIfDirectoryExists(directoryUri);
  if (!directoryExists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
};

// Преобразовать URL в имя файла
export const convertUrlToFileName = (url: string) => {
  const fileName = url.split("/").at(-1);
  return fileName?.split(".").at(0) ?? "";
};
```

### Фаза 2: Создание контекста

**Файл**: [contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx)

См. раздел [Справочник по коду и примеры](#справочник-по-коду-и-примеры) для полной реализации.

**Ключевые шаги**:

1. Определить тип контекста и интерфейс
2. Создать контекст по умолчанию с пустыми реализациями
3. Реализовать внутренний хук `useManageProcessingQueue`
4. Реализовать компонент провайдера с:
   - `getAuthToken()` - Получить JWT из защищённого хранилища
   - `downloadFile()` - Логика загрузки одного файла
   - `processQueue()` - Последовательная обработка очереди
   - `pauseProcessing()` / `resumeProcessing()` - Управление очередью
   - `downloadFileFromMessage()` - Приоритетная загрузка по запросу пользователя

### Фаза 3: Создание хука

**Файл**: [hooks/useDownloadMessageAttachments.tsx](hooks/useDownloadMessageAttachments.tsx)

См. раздел [Справочник по коду и примеры](#справочник-по-коду-и-примеры) для полной реализации.

**Ключевые шаги**:

1. Получить сообщения с вложениями
2. Отслеживать статус сети
3. Отслеживать состояние приложения
4. Построить функцию `addFilesToProcessingQueue`
5. Настроить эффект для срабатывания по условиям

### Фаза 4: Интеграция

**Файл**: [app/\_layout.tsx](app/_layout.tsx)

```typescript
import { DownloadMessageAttachmentsProvider } from "@/contexts/downloadMessageAttachments";

export default function RootLayout() {
  return (
    <DownloadMessageAttachmentsProvider>
      <Stack>
        {/* Все экраны имеют доступ к контексту */}
      </Stack>
    </DownloadMessageAttachmentsProvider>
  );
}
```

### Фаза 5: Использование в компонентах

```typescript
import { useDownloadMessageAttachments } from "@/hooks/useDownloadMessageAttachments";
import { useDownloadMessageAttachmentsContext } from "@/contexts/downloadMessageAttachments";

function MessageScreen() {
  // Инициализировать автоматические загрузки
  useDownloadMessageAttachments();

  // Получить метод ручной загрузки
  const { downloadFileFromMessage, isProcessing } =
    useDownloadMessageAttachmentsContext();

  return (
    <View>
      <Text>
        {isProcessing ? "Загрузка..." : "Загрузки завершены"}
      </Text>

      <Button
        onPress={() => downloadFileFromMessage(attachment)}
        title="Загрузить сейчас"
      />
    </View>
  );
}
```

---

## Справочник по коду и примеры

### Полная реализация контекста

```typescript
// contexts/downloadMessageAttachments.tsx
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";

import * as FileSystem from "expo-file-system";
import RNFetchBlob from "react-native-blob-util";

import { axiosConfig } from "@/api/axios-client";
import { getDashboardSrvPaths } from "@/api/dashboard";
import { ATTACHMENTS_DIR } from "@/constants";
import type Attachment from "@/models/Attachment";
import { AUTH_STORE_KEY, authStorage } from "@/storage/authStorage";
import type { AuthStorageTokens } from "@/store/authStore";
import { getExtension, makeDirectory } from "@/utils/files";

type DownloadMessageAttachmentsContextType = {
  isProcessing: boolean;
  addCommand: (command: DownloadCommand) => void;
  resumeProcessing: () => Promise<void>;
  resetQueue: () => void;
  pauseProcessing: () => Promise<void>;
  processQueue: () => Promise<void>;
  downloadFile: (command: DownloadCommand) => Promise<boolean>;
  startProcessing: () => Promise<void>;
  downloadFileFromMessage: (attachment: Attachment) => Promise<boolean>;
};

export interface DownloadCommand {
  filename: string;
  url: string;
  id: string;
}

export const DownloadMessageAttachmentsContext =
  createContext<DownloadMessageAttachmentsContextType>({
    isProcessing: false,
    addCommand: () => {},
    resumeProcessing: () => Promise.resolve(),
    resetQueue: () => {},
    pauseProcessing: () => Promise.resolve(),
    processQueue: () => Promise.resolve(),
    downloadFile: () => Promise.resolve(true),
    startProcessing: () => Promise.resolve(),
    downloadFileFromMessage: () => Promise.resolve(true)
  });

export const useDownloadMessageAttachmentsContext = () => {
  const context = useContext(DownloadMessageAttachmentsContext);
  if (!context) {
    throw new Error(
      "useDownloadMessageAttachmentsContext должен использоваться внутри DownloadMessageAttachmentsProvider"
    );
  }
  return context;
};

const useManageProcessingQueue = () => {
  let queueRef = useRef<DownloadCommand[]>([]);
  let { current: shouldStopProxy } = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => {
          return Reflect.get(target, prop);
        },
        set: (target, prop, value) => {
          return Reflect.set(target, prop, value);
        }
      }
    )
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const addCommand = (command: DownloadCommand) => {
    queueRef.current.unshift(command);
  };

  const pauseProcessing = async () => {
    shouldStopProxy.shouldStop = true;
    setIsProcessing(false);
    await Promise.resolve();
  };

  const resetQueue = () => {
    queueRef.current = [];
    shouldStopProxy.shouldStop = false;
  };

  return {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
    setIsProcessing
  };
};

export const DownloadMessageAttachmentsProvider = ({
  children
}: PropsWithChildren) => {
  const {
    queueRef,
    shouldStopProxy,
    addCommand,
    pauseProcessing,
    isProcessing,
    resetQueue,
    setIsProcessing
  } = useManageProcessingQueue();

  const getAuthToken = async (): Promise<string | undefined> => {
    const store = await authStorage.getItem(AUTH_STORE_KEY);
    if (!store) return undefined;

    const { state } = JSON.parse(store) as { state: AuthStorageTokens };
    return state.accessToken;
  };

  const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
    const accessToken = await getAuthToken();

    await makeDirectory(ATTACHMENTS_DIR);

    const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

    const fileInfo = await FileSystem.getInfoAsync(path);

    if (fileInfo.exists) {
      console.log(`[File Processing] ${filename}, файл уже существует`);
      return true;
    }

    const response = await RNFetchBlob.fetch(
      "POST",
      `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
      {
        ...axiosConfig.headers,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json, text/plain, */*",
        "Content-Type": "text/plain"
      },
      url
    );

    if (response.respInfo.status >= 400) {
      const message = JSON.parse(response.data).data;
      throw new Error(
        `Ошибка загрузки файла: ${response.respInfo.status}, ${message}`
      );
    }

    const base64 = await response.base64();

    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64
    });

    return response.respInfo.status < 400;
  };

  const processQueue = async () => {
    setIsProcessing(true);

    while (queueRef.current.length) {
      console.log(
        "[File Processing] Обработка очереди, осталось",
        queueRef.current.length
      );
      const result = await downloadFile(queueRef.current[0]);

      if (!result) {
        break;
      }

      queueRef.current.shift();

      if (shouldStopProxy.shouldStop) {
        console.log("[File Processing] Остановка обработки");
        shouldStopProxy.shouldStop = false;
        break;
      }
    }

    console.log("[File Processing] Обработка очереди завершена");

    setIsProcessing(false);
  };

  const resumeProcessing = async () => {
    setIsProcessing(true);
    console.log("[File Processing] Запущена новая очередь обработки");
    await processQueue();
  };

  const downloadFileFromMessage = async (attachment: Attachment) => {
    await pauseProcessing();
    console.log("[File Processing] Обработка приостановлена");

    const result = await downloadFile({
      filename: attachment.name,
      url: attachment.url,
      id: attachment.id
    });
    console.log("[File Processing] Загрузка файла из вложения завершена");

    console.log("[File Processing] Обработка возобновлена");
    resumeProcessing();

    return result;
  };

  const startProcessing = async () => {
    if (!queueRef.current.length) {
      console.log(
        "[File Processing] Нет элементов в очереди, обработка не начата"
      );
      return;
    }

    await processQueue();
  };

  const value = useMemo(
    () => ({
      isProcessing,
      addCommand,
      resumeProcessing,
      resetQueue,
      pauseProcessing,
      processQueue,
      downloadFile,
      startProcessing,
      downloadFileFromMessage
    }),
    [isProcessing]
  );

  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
```

### Полная реализация хука

```typescript
// hooks/useDownloadMessageAttachments.tsx
import { useCallback, useEffect } from "react";

import * as FileSystem from "expo-file-system";

import { useAllMessages } from "@/api/dashboard/messages/useMessages";
import { ATTACHMENTS_DIR, isAppStateActive } from "@/constants";
import { useDownloadMessageAttachmentsContext } from "@/contexts/downloadMessageAttachments";
import { useCheckNetworkStatus } from "@/hooks/useCheckNetworkStatus";
import type Attachment from "@/models/Attachment";
import { useAppStateStore } from "@/store/appStateStore";
import { getExtension } from "@/utils";

export const useDownloadMessageAttachments = () => {
  const { addCommand, startProcessing, resetQueue } =
    useDownloadMessageAttachmentsContext();
  const { attachments } = useAllMessages({ limit: "50" });
  const { appState } = useAppStateStore();
  const { isConnected } = useCheckNetworkStatus();

  const addFilesToProcessingQueue = useCallback(
    async (attachments: (Attachment | undefined)[]) => {
      resetQueue();
      try {
        for (const attachment of attachments) {
          const filename = `${attachment?.id}.${getExtension(attachment?.name ?? "txt")}`;

          const path = `${ATTACHMENTS_DIR}${filename}`;

          const fileInfo = await FileSystem.getInfoAsync(path);

          if (!attachment?.url || fileInfo.exists) continue;

          try {
            console.log(
              "[File Processing] Добавление файла в очередь",
              attachment.name
            );

            addCommand({
              url: attachment.url,
              filename: attachment.name,
              id: attachment.id
            });
          } catch (error) {
            console.error(
              `[File Processing] Ошибка добавления в очередь ${attachment.url}:`,
              error
            );
          }
        }
        console.log("[File Processing] Добавление файлов в очередь завершено");
      } catch (error) {
        console.error("[File Processing] Процесс загрузки не удался:", error);
        return false;
      }
    },
    [addCommand, resetQueue]
  );

  const startDownloads = useCallback(async () => {
    if (!attachments.length) return;

    await addFilesToProcessingQueue(attachments);
    await startProcessing();
  }, [attachments, addFilesToProcessingQueue, startProcessing]);

  useEffect(() => {
    if (!attachments.length) {
      return;
    }

    console.log("[File Processing] Количество вложений", attachments.length);

    if (isAppStateActive(appState) && isConnected) {
      startDownloads();
    }
  }, [attachments.length, appState, isConnected]);
};
```

---

## Шаги интеграции

### Шаг 1: Проверка зависимостей

```bash
npm list expo-file-system react-native-blob-util
```

Ожидаемый вывод:

```
expo-file-system@16.x.x
react-native-blob-util@0.x.x
```

### Шаг 2: Создание файлов по порядку

1. **[constants/File.ts](constants/File.ts)** - Пути к файлам
2. **[utils/files.ts](utils/files.ts)** - Файловые утилиты
3. **[contexts/downloadMessageAttachments.tsx](contexts/downloadMessageAttachments.tsx)** - Провайдер контекста
4. **[hooks/useDownloadMessageAttachments.tsx](hooks/useDownloadMessageAttachments.tsx)** - Хук автозагрузки

### Шаг 3: Обновление точки входа

**[app/\_layout.tsx](app/_layout.tsx)**:

```typescript
import { DownloadMessageAttachmentsProvider } from "@/contexts/downloadMessageAttachments";

export default function RootLayout() {
  return (
    <DownloadMessageAttachmentsProvider>
      <Stack>
        {/* экраны */}
      </Stack>
    </DownloadMessageAttachmentsProvider>
  );
}
```

### Шаг 4: Добавление на экран сообщений

```typescript
function MessageScreen() {
  useDownloadMessageAttachments();
  const { downloadFileFromMessage, isProcessing } =
    useDownloadMessageAttachmentsContext();

  return (
    <View>
      {/* отображение вложений */}
    </View>
  );
}
```

### Шаг 5: Тестирование с логами консоли

Проверьте консоль DevTools на наличие:

```
[File Processing] Количество вложений 5
[File Processing] Добавление файла в очередь invoice.pdf
[File Processing] Обработка очереди, осталось 5
[File Processing] invoice.pdf, файл уже существует
[File Processing] Обработка очереди завершена
```

---

## Настройка бэкенда для демо-приложения

### Вариант 1: Мок-бэкенд (без бэкенда) ⭐ Рекомендуется для демо

Создайте мок-реализации прямо в демо-приложении. Никаких внешних зависимостей!

**Файл**: `api/dashboard/index.ts` (Мок)

```typescript
// Мок getDashboardSrvPaths - возвращает ту же структуру, что и реальный бэкенд
export const getDashboardSrvPaths = (params?: { messageId?: string }) => {
  const controller = "/dashboardsrv/v1";

  return {
    messages: {
      unread: `${controller}/message/count/unread`,
      getMessages: `${controller}/message/mha/patient/messages`,
      createMessage: `${controller}/mha/patient/message/create`,
      archiveMessage: `${controller}/mha/patient/message/markAsRead/${params?.messageId}/archive`,
      markAsReadMessage: `${controller}/mha/patient/message/markAsRead/${params?.messageId}`,
      members: `${controller}/message/members`,
      downloadFile: `${controller}/mha/patient/message/attachment/download`
    }
  };
};
```

**Файл**: `api/axios-client.tsx` (Мок)

```typescript
import axios from "axios";

// Мок baseURL указывает на мок-сервер
export const axiosConfig = {
  baseURL: "http://localhost:3000", // URL мок-бэкенда
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
};

export const axiosInstance = axios.create(axiosConfig);

// Мок-интерцептор - просто пропускает
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
```

**Файл**: `api/dashboard/messages/useMessages.tsx` (Мок)

```typescript
// Мок-хук возвращающий тестовые данные
export const useAllMessages = ({ limit = "50" }: { limit?: string }) => {
  // Симуляция получения сообщений с вложениями
  const mockAttachments = [
    {
      id: "att-1",
      name: "invoice.pdf",
      url: "/dashboardsrv/v1/mha/patient/message/attachment/download", // Будет перехвачен
      size: 150000
    },
    {
      id: "att-2",
      name: "report.pdf",
      url: "/dashboardsrv/v1/mha/patient/message/attachment/download",
      size: 250000
    },
    {
      id: "att-3",
      name: "chart.xlsx",
      url: "/dashboardsrv/v1/mha/patient/message/attachment/download",
      size: 320000
    }
  ];

  return {
    attachments: mockAttachments,
    isLoading: false,
    error: null
  };
};
```

### Вариант 2: Docker мок-сервер (Продвинутый)

Если вам нужен реальный мок-сервер, вот простая настройка Node.js Express:

**Файл**: `docker/mock-backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Файл**: `docker/mock-backend/package.json`

```json
{
  "name": "mock-dashboard-backend",
  "version": "1.0.0",
  "description": "Мок-бэкенд для демо KiiMobile",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Запуск Docker-сервера**:

```bash
# Из корня проекта
docker-compose up --build

# Или вручную
cd docker/mock-backend
npm install
npm start
```

---

## Чек-лист реализации демо-приложения

### Предварительная настройка

- [ ] Клонировать/создать репозиторий демо-приложения
- [ ] Установить зависимости React Native/Expo
- [ ] Настроить конфигурацию TypeScript
- [ ] **Выбрать вариант бэкенда**: Мок (рекомендуется) или Docker
- [ ] Настроить мок-данные вложений

### Фаза 1: Инфраструктура (Дни 1-2)

- [ ] Скопировать `constants/File.ts` с путями
- [ ] Скопировать `utils/files.ts` с утилитами
- [ ] Обновить экспорты `constants/index.ts`
- [ ] Создать мок-модель `Attachment`:
  ```typescript
  interface Attachment {
    id: string;
    name: string;
    url: string;
  }
  ```
- [ ] **Настроить бэкенд** (выбрать один):
  - [ ] **Вариант A - Мок-бэкенд** (Рекомендуется): Скопировать мок-реализации
  - [ ] **Вариант B - Docker-сервер**: Скопировать Docker-файлы и запустить `docker-compose up`

### Фаза 2: Реализация контекста (Дни 2-3)

- [ ] Скопировать `contexts/downloadMessageAttachments.tsx`
- [ ] Обновить получение токена авторизации (использовать мок для демо)
- [ ] Обновить пути API-эндпоинтов (использовать мок-эндпоинты)
- [ ] Протестировать `DownloadMessageAttachmentsProvider` в корне

### Фаза 3: Реализация хука (Дни 3-4)

- [ ] Скопировать `hooks/useDownloadMessageAttachments.tsx`
- [ ] Создать мок-хук `useAllMessages`
- [ ] Создать мок-хук `useCheckNetworkStatus`
- [ ] Создать мок `useAppStateStore`

### Фаза 4: Демо-экран (Дни 4-5)

- [ ] Создать экран `(demo)/attachments-demo.tsx`
- [ ] Отобразить список мок-вложений
- [ ] Добавить кнопку ручной загрузки
- [ ] Добавить индикатор статуса загрузки
- [ ] Показать статус очереди и прогресс

### Фаза 5: Тестирование и доработка (Дни 5-6)

- [ ] Протестировать автоматическую загрузку при запуске приложения
- [ ] Протестировать функциональность приостановки/возобновления
- [ ] Протестировать приоритетную загрузку (ручную)
- [ ] Протестировать поведение кэша (повторные загрузки)
- [ ] Создать слайды презентации
- [ ] Записать прохождение демо

---

## Ключевые паттерны проектирования

### 1. Управление состоянием на основе Proxy

Почему использовать Proxy вместо useState?

```typescript
// ❌ Проблема с useState:
const [shouldStop, setShouldStop] = useState(false);
// Внутри цикла processQueue - бесконечные ре-рендеры!

// ✅ Решение с Proxy:
let shouldStopProxy = useRef(new Proxy({ shouldStop: false }, { ... }));
// Proxy обновляется без триггера ре-рендеров
// Можно синхронно проверять флаг внутри асинхронного цикла
```

**Случай использования**: Нужно сигнализировать асинхронной функции остановиться без триггера ре-рендера компонента.

### 2. Очередь на основе Ref

Почему использовать useRef вместо useState?

```typescript
// ❌ Проблема с useState:
const [queue, setQueue] = useState([]);
// Каждое обновление состояния = цикл рендера = падение производительности

// ✅ Решение с useRef:
const queueRef = useRef([]);
// Мутации не триггерят рендеры
// Прямые операции с массивом (unshift, shift) мгновенны
```

**Случай использования**: Высокочастотные мутации массива, который не нужно отображать в UI.

### 3. Приоритетная очередь с unshift()

```typescript
// Когда пользователь нажимает "Загрузить сейчас":
addCommand(priorityFile); // unshift добавляет в НАЧАЛО
// Очередь теперь: [priorityFile, file1, file2, file3]
// priorityFile загружается первым!
```

### 4. Паттерн приостановки/возобновления

```typescript
// Сигнал паузы
shouldStopProxy.shouldStop = true;
// Цикл проверяет флаг:
if (shouldStopProxy.shouldStop) break;

// Возобновление: просто продолжить с того же состояния очереди
// Нет потери данных - элементы всё ещё в queueRef
```

---

## Соображения производительности

| Аспект               | Реализация                    | Преимущество                        |
| -------------------- | ----------------------------- | ----------------------------------- |
| **Скорость очереди** | Ref с unshift/shift           | O(1) операции                       |
| **Проверка кэша**    | FileSystem.getInfoAsync       | Предотвращает избыточные загрузки   |
| **Последовательная загрузка** | По одному файлу    | Предсказуемое использование трафика |
| **Обновления состояния** | Proxy (без ре-рендеров)  | Плавная приостановка/возобновление  |
| **Размер файла**     | Кодирование Base64            | Безопасное хранение в кэше          |
| **Память**           | Потоковая обработка           | Не загружает весь файл в память     |

---

## Руководство по устранению неполадок

### Проблема: Загрузки не начинаются

```
Проверьте логи [File Processing]:
1. "Нет элементов в очереди, обработка не начата"
   → Вложения не найдены
2. "Количество вложений 0"
   → Сетевой запрос сообщений не удался
3. Логи полностью отсутствуют
   → Хук useDownloadMessageAttachments не вызван
```

**Исправление**: Убедитесь, что хук вызывается в компоненте:

```typescript
function Screen() {
  useDownloadMessageAttachments();  // ← Должен быть вызван
  return <View />;
}
```

### Проблема: Файлы не появляются в кэше

```
Проверьте:
1. Путь ATTACHMENTS_DIR существует
   → FileSystem.cacheDirectory/attachments/
2. Разрешения на файлы
   → Android: использует директорию кэша приложения (авто)
   → iOS: использует директорию кэша приложения (авто)
3. Извлечение расширения файла
   → "document.pdf" → "pdf" ✓
   → "document" → undefined ✗
```

**Исправление**: Убедитесь, что имена файлов в мок-данных имеют расширения.

### Проблема: Ошибки аутентификации

```
Ошибка: "Ошибка загрузки файла: 401"
→ Проверьте, что getAuthToken() возвращает действительный JWT
→ Проверьте, что токен не истёк
→ Проверьте формат заголовка Authorization: "Bearer <token>"
```

### Проблема: Утечки памяти

```
Убедитесь:
1. Контекст правильно размонтируется при размонтировании компонента
2. Нет бесконечных циклов в processQueue
3. Ссылки на файлы не сохраняются после загрузки
```

---

## Тезисы для презентации

### 1. Вступление (Бизнес-ценность)

> "Система загрузки вложений сообщений решает критическую задачу здравоохранения: пользователям нужен мгновенный, безопасный доступ к медицинским документам, передаваемым через нашу платформу обмена сообщениями. Без этой функции пользователям приходится вручную управлять загрузкой файлов, расходуя трафик и создавая риски безопасности."

### 2. Демонстрация проблемы

Показать сценарий:

- Пользователь получает 5 вложений к сообщениям
- Без системы: Пользователь должен вручную нажать на каждое → ждать загрузки → просмотреть
- С системой: Все файлы загружаются автоматически в фоне → мгновенный просмотр

### 3. Обзор архитектуры

```
"Система использует три слоя:
1. Слой контекста - управляет состоянием и очередью
2. Слой хуков - запускает автоматические загрузки
3. Слой утилит - обрабатывает файловые операции

Представьте это как умную почтовую систему:
- Контекст = Почтовое отделение (управляет доставками)
- Хук = Почтальон (знает когда доставлять)
- Утилиты = Дороги (обеспечивают логистику доставки)"
```

### 4. Ключевые функции

- **✅ Автоматическая**: Запускается при появлении сети
- **✅ Умная**: Не перезагружает существующие файлы
- **✅ Приоритетная**: Загрузки пользователя прерывают фоновую очередь
- **✅ Устойчивая**: Возобновляется при восстановлении сети
- **✅ Безопасная**: Аутентифицированные API-вызовы

### 5. Поток демо

1. Показать запуск приложения (нет сети)
2. Включить сеть → автоматические загрузки начинаются
3. Проверить логи консоли показывающие прогресс
4. Пользователь нажимает "Загрузить сейчас" → фон приостанавливается, файл пользователя загружается первым
5. Файл пользователя загружен → фон возобновляется
6. Показать кэшированные файлы в хранилище устройства

### 6. Сложность реализации

Показать сравнение:

```
Без системы:
- Ручное управление файлами
- Трата трафика на повторные загрузки
- Плохой пользовательский опыт
- Проблемы безопасности

С системой:
- Автоматизированный рабочий процесс
- Умное кэширование
- Бесшовная фоновая обработка
- Безопасный аутентифицированный доступ
```

### 7. Заключение

> "Эта система демонстрирует, как интеллектуальное управление очередью и обработка с учётом сети могут создавать бесшовный пользовательский опыт в приложениях здравоохранения. Архитектура достаточно модульна для адаптации к другим функциям на основе очередей в платформе."

---

## Дополнительные ресурсы

### Связанная документация

- Аутентификация: `/docs/technical/ru/authentication.md`
- Интеграция API: `/docs/technical/ru/api-integration.md`
- Управление файлами: `/utils/files.ts`
- Управление состоянием: `/store/`

### Документация зависимостей

- [Expo File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [React Native Blob Util](https://github.com/RonRadtke/react-native-blob-util)
- React Context API

### Структура файлов кода

```
├── contexts/
│   └── downloadMessageAttachments.tsx     (Основной провайдер)
├── hooks/
│   └── useDownloadMessageAttachments.tsx  (Авто-триггер)
├── utils/
│   └── files.ts                          (Файловые операции)
├── constants/
│   └── File.ts                           (Пути и конфигурация)
├── models/
│   └── Attachment.ts                     (Модель данных)
└── app/
    └── _layout.tsx                       (Обёртка провайдера)
```

---

**Версия документа**: 1.0
**Последнее обновление**: 26 января 2026
**Для**: Презентация и реализация демо-приложения
