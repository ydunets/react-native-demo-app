# Technical Documentation: Download Message Attachments System

## 1. Implementation Goals

Implement a **download queue for message file attachments** with support for:

- Automatic queue management when connecting to the network
- Pause/resume processing without data loss
- Prioritization of urgent downloads (interrupting current queue)
- File caching in local file system
- Processing state tracking (active/inactive)

---

## 2. Component Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  useDownloadMessageAttachments (Hook)                        │
│  ├─ Initiates downloads on network restoration              │
│  ├─ Subscribes to appState and networkStatus changes        │
│  └─ Populates queue with new files                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  DownloadMessageAttachmentsContext (Context + Provider)      │
│  ├─ Manages command queue                                   │
│  ├─ Coordinates pause/resume functionality                  │
│  └─ Provides file download methods                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  useManageProcessingQueue (Internal Hook)                    │
│  ├─ Manages ref-based command queue                         │
│  ├─ Tracks shouldStop flag via Proxy                        │
│  └─ Controls isProcessing state                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Пошаговая логика ключевых функций

### 3.1 Инициализация очереди: `useManageProcessingQueue`

**Назначение**: Создать изолированное управление очередью с реактивным состоянием.

```typescript
// Использует Proxy для отслеживания флага остановки
let { current: shouldStopProxy } = useRef(
  new Proxy(
    { shouldStop: false },
    {
      get: (target, prop) => Reflect.get(target, prop),
      set: (target, prop, value) => Reflect.set(target, prop, value)
    }
  )
);

// Возвращает методы для управления
return {
  queueRef,           // useRef<DownloadCommand[]>
  shouldStopProxy,    // Для безопасной паузы
  addCommand,         // Добавить файл в начало очереди (приоритет)
  pauseProcessing,    // Остановить обработку
  setIsProcessing     // Обновить состояние UI
};
```

**Поток данных**:

```
addCommand → queueRef.current.unshift(command)
                     ↓
         queueRef = [file1, file2, file3...]
```

---

### 3.2 Скачивание одного файла: `downloadFile`

**Назначение**: Загрузить один файл через API с проверкой кеша и обработкой ошибок.

```typescript
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  // ШАГ 1: Получить токен авторизации из безопасного хранилища
  const accessToken = await getAuthToken();

  // ШАГ 2: Убедиться, что директория существует
  await makeDirectory(ATTACHMENTS_DIR);

  // ШАГ 3: Сформировать путь с расширением файла
  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

  // ШАГ 4: Проверить кеш (файл уже скачан?)
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    console.log(`[File Processing] ${filename}, file already exists`);
    return true; // ✓ Файл есть, пропустить
  }

  // ШАГ 5: POST запрос к API для скачивания
  const response = await RNFetchBlob.fetch(
    "POST",
    `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
    {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain"
    },
    url // Отправить URL файла в теле запроса
  );

  // ШАГ 6: Проверить статус ошибки
  if (response.respInfo.status >= 400) {
    const message = JSON.parse(response.data).data;
    throw new Error(`Download file error: ${response.respInfo.status}`);
  }

  // ШАГ 7: Сохранить в Base64 формате в локальную FS
  const base64 = await response.base64();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return response.respInfo.status < 400;
};
```

**Примеры использования**:

```typescript
// Успешное скачивание нового файла
await downloadFile({
  filename: "invoice.pdf",
  url: "https://api.example.com/file/123",
  id: "attachment-456"
});
// Результат: /Documents/files/attachment-456.pdf создан

// Повторное скачивание (кеш хит)
await downloadFile({ ... });
// Результат: вернет true без переподачи (файл существует)
```

---

### 3.3 Обработка очереди: `processQueue`

**Назначение**: Последовательно скачать все файлы из очереди с возможностью остановки.

```typescript
const processQueue = async () => {
  setIsProcessing(true); // UI: показать "обработка активна"

  // ШАГ 1: Цикл пока есть элементы в очереди
  while (queueRef.current.length) {
    console.log(
      "[File Processing] Processing queue remaining",
      queueRef.current.length
    );

    // ШАГ 2: Скачать первый файл из очереди
    const result = await downloadFile(queueRef.current[0]);

    // ШАГ 3: Если скачивание не удалось - выйти из цикла
    if (!result) {
      break; // ✗ Ошибка, остановить обработку
    }

    // ШАГ 4: Удалить скачанный файл из очереди
    queueRef.current.shift(); // Удалить с начала

    // ШАГ 5: Проверить флаг паузы (установлен ли shouldStop?)
    if (shouldStopProxy.shouldStop) {
      console.log("[File Processing] Stop processing");
      shouldStopProxy.shouldStop = false;
      break; // Обработка приостановлена снаружи
    }
  }

  setIsProcessing(false); // UI: скрыть "обработка активна"
};
```

**Временная диаграмма**:

```
Время  Событие                  queueRef           isProcessing
────────────────────────────────────────────────────────────────
t=0    processQueue начата      [A, B, C]          true
t=1    скачена A                [B, C]             true
t=2    скачена B                [C]                true
t=3    pauseProcessing()        [C]                false
t=4    resumeProcessing()       [C]                true
t=5    скачена C                []                 true
t=6    цикл завершен            []                 false
```

---

### 3.4 Паузировка: `pauseProcessing` и `resumeProcessing`

**Назначение**: Прерватель текущей обработки для приоритетных файлов.

```typescript
// ПАУЗА: Остановить очередь
const pauseProcessing = async () => {
  shouldStopProxy.shouldStop = true; // Флаг для цикла processQueue
  setIsProcessing(false); // UI: скрыть "обработка активна"
  await Promise.resolve(); // Дать React возможность обновиться
};

// ВОЗОБНОВЛЕНИЕ: Продолжить с того же места
const resumeProcessing = async () => {
  setIsProcessing(true);
  console.log("[File Processing] New processing queue started");
  await processQueue(); // Обработка оставшихся файлов
};
```

**Сценарий использования** (скачивание срочного вложения):

```typescript
// Фоновая очередь обрабатывает: [file1, file2, file3]
// Пользователь нажал "Скачать сейчас" на файле из чата

const downloadFileFromMessage = async (attachment: Attachment) => {
  await pauseProcessing(); // ⏸ Остановить фон
  // queueRef = [file1, file2, file3], isProcessing = false

  const result = await downloadFile({
    // ↓ Скачать срочный файл
    filename: attachment.name,
    url: attachment.url,
    id: attachment.id
  });

  resumeProcessing(); // ▶ Продолжить фон
  // Обработка [file1, file2, file3] возобновлена
};
```

---

### 3.5 Инициация скачиваний: `useDownloadMessageAttachments`

**Назначение**: Hook для автоматического запуска очереди при восстановлении сети.

```typescript
// ШАГ 1: Подготовить вложения к очереди
const addFilesToProcessingQueue = useCallback(
  async (attachments: (Attachment | undefined)[]) => {
    resetQueue(); // Очистить старую очередь

    for (const attachment of attachments) {
      const filename = `${attachment?.id}.${getExtension(attachment?.name)}`;
      const path = `${ATTACHMENTS_DIR}${filename}`;

      // Проверить кеш локально
      const fileInfo = await FileSystem.getInfoAsync(path);

      if (!attachment?.url || fileInfo.exists) continue; // ✓ Уже есть

      // ШАГ 2: Добавить в очередь для фоновой обработки
      addCommand({
        url: attachment.url,
        filename: attachment.name,
        id: attachment.id
      });
    }
  },
  [addCommand, resetQueue]
);

// ШАГ 3: Следить за восстановлением сети и состоянием приложения
useEffect(() => {
  if (!attachments.length) return;

  // Запустить загрузки ТОЛЬКО если:
  // 1. Приложение активно (foreground)
  // 2. Есть интернет (isConnected = true)
  if (isAppStateActive(appState) && isConnected) {
    addFilesToProcessingQueue(attachments);
    startProcessing(); // Начать обработку очереди
  }
}, [attachments.length, appState, isConnected]);
```

**Сценарий реального мира**:

```
1. Приложение запущено, нет интернета
   → useDownloadMessageAttachments: ничего не делает

2. Пользователь включает Wi-Fi
   → isConnected изменяется на true
   → isAppStateActive(appState) = true
   → Срабатывает useEffect
   → addFilesToProcessingQueue добавляет все вложения в queueRef
   → startProcessing() начинает скачивать файлы в фоне

3. Пользователь закрыл приложение
   → appState = 'background'
   → pauseProcessing() автоматически вызывается (если реализовано)
   → queueRef остается нетронута для возобновления позже
```

---

## 4. Интеграция в приложение

**Обёртка в Provider**:

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <DownloadMessageAttachmentsProvider>
      <Stack>
        {/* Все экраны получают доступ к контексту */}
      </Stack>
    </DownloadMessageAttachmentsProvider>
  );
}
```

**Использование в компоненте**:

```typescript
function MessageScreen() {
  useDownloadMessageAttachments(); // Hook запустит очередь автоматически
  const { downloadFileFromMessage } = useDownloadMessageAttachmentsContext();

  return (
    <Button
      onPress={() => downloadFileFromMessage(attachment)}
      title="Скачать сейчас"
    />
  );
}
```

---

## 5. Ключевые характеристики

| Характеристика           | Реализация                                                   |
| ------------------------ | ------------------------------------------------------------ |
| **Кеширование**          | Проверка через `FileSystem.getInfoAsync()` перед скачиванием |
| **Приоритизация**        | `unshift()` добавляет новые файлы в начало очереди           |
| **Безопасность**         | Токен из защищённого хранилища `authStorage`                 |
| **Обработка ошибок**     | Проверка `status >= 400`, throw Error                        |
| **Реактивность**         | Zustand `setIsProcessing` обновляет UI состояние             |
| **Сетевая устойчивость** | Hook отслеживает `isConnected` через `useCheckNetworkStatus` |
