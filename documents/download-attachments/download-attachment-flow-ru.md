# Техническая документация: Система загрузки вложений сообщений

## 1. Цель реализации

Реализовать **очередь загрузки вложений сообщений** с поддержкой:

- Автоматического управления очередью при восстановлении сетевого подключения
- Приостановки/возобновления обработки без потери данных
- Приоритизации срочных загрузок (прерывание текущей очереди)
- Кэширования файлов в локальной файловой системе
- Отслеживания состояния обработки (активно/неактивно)

---

## 2. Обзор компонентов

```
┌─────────────────────────────────────────────────────────────┐
│  useDownloadMessageAttachments (Хук)                         │
│  ├─ Инициирует загрузки при восстановлении сети             │
│  ├─ Подписывается на изменения appState и networkStatus     │
│  └─ Заполняет очередь новыми файлами                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  DownloadMessageAttachmentsContext (Контекст + Провайдер)    │
│  ├─ Управляет очередью команд                               │
│  ├─ Координирует операции приостановки/возобновления        │
│  └─ Предоставляет методы загрузки файлов                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  useManageProcessingQueue (Внутренний хук)                   │
│  ├─ Управляет очередью команд на основе ref                 │
│  ├─ Отслеживает флаг shouldStop через Proxy                 │
│  └─ Управляет состоянием isProcessing                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Пошаговая логика ключевых функций

### 3.1 Инициализация очереди: `useManageProcessingQueue`

**Назначение**: Создание изолированного управления очередью с реактивным состоянием.

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

// Возвращает методы управления
return {
  queueRef,           // useRef<DownloadCommand[]>
  shouldStopProxy,    // Для безопасной приостановки
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

### 3.2 Загрузка одного файла: `downloadFile`

**Назначение**: Загрузка одного файла через API с проверкой кэша и обработкой ошибок.

```typescript
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  // ШАГ 1: Получить токен авторизации из защищённого хранилища
  const accessToken = await getAuthToken();

  // ШАГ 2: Убедиться, что директория существует
  await makeDirectory(ATTACHMENTS_DIR);

  // ШАГ 3: Построить путь с расширением файла
  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;

  // ШАГ 4: Проверить кэш (файл уже загружен?)
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    console.log(`[File Processing] ${filename}, файл уже существует`);
    return true; // ✓ Файл существует, пропускаем
  }

  // ШАГ 5: POST-запрос к API для загрузки
  const response = await RNFetchBlob.fetch(
    "POST",
    `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
    {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain"
    },
    url // Отправляем URL файла в теле запроса
  );

  // ШАГ 6: Проверить статус ошибки
  if (response.respInfo.status >= 400) {
    const message = JSON.parse(response.data).data;
    throw new Error(`Ошибка загрузки файла: ${response.respInfo.status}`);
  }

  // ШАГ 7: Сохранить в формате Base64 в локальную ФС
  const base64 = await response.base64();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return response.respInfo.status < 400;
};
```

**Примеры использования**:

```typescript
// Успешная загрузка нового файла
await downloadFile({
  filename: "invoice.pdf",
  url: "https://api.example.com/file/123",
  id: "attachment-456"
});
// Результат: /Documents/files/attachment-456.pdf создан

// Повторная загрузка (попадание в кэш)
await downloadFile({ ... });
// Результат: возвращает true без повторной загрузки (файл существует)
```

---

### 3.3 Обработка очереди: `processQueue`

**Назначение**: Последовательная загрузка всех файлов из очереди с возможностью остановки.

```typescript
const processQueue = async () => {
  setIsProcessing(true); // UI: показать "обработка активна"

  // ШАГ 1: Цикл пока в очереди есть элементы
  while (queueRef.current.length) {
    console.log(
      "[File Processing] Обработка очереди, осталось",
      queueRef.current.length
    );

    // ШАГ 2: Загрузить первый файл из очереди
    const result = await downloadFile(queueRef.current[0]);

    // ШАГ 3: Если загрузка не удалась - выход из цикла
    if (!result) {
      break; // ✗ Ошибка, остановить обработку
    }

    // ШАГ 4: Удалить загруженный файл из очереди
    queueRef.current.shift(); // Удалить из начала

    // ШАГ 5: Проверить флаг паузы (установлен ли shouldStop?)
    if (shouldStopProxy.shouldStop) {
      console.log("[File Processing] Остановка обработки");
      shouldStopProxy.shouldStop = false;
      break; // Обработка приостановлена извне
    }
  }

  setIsProcessing(false); // UI: скрыть "обработка активна"
};
```

**Временная шкала**:

```
Время   Событие                  queueRef           isProcessing
────────────────────────────────────────────────────────────────
t=0    processQueue запущен     [A, B, C]          true
t=1    A загружен               [B, C]             true
t=2    B загружен               [C]                true
t=3    pauseProcessing()        [C]                false
t=4    resumeProcessing()       [C]                true
t=5    C загружен               []                 true
t=6    цикл завершён            []                 false
```

---

### 3.4 Приостановка: `pauseProcessing` и `resumeProcessing`

**Назначение**: Прерывание текущей обработки для приоритетных файлов.

```typescript
// ПАУЗА: Остановить очередь
const pauseProcessing = async () => {
  shouldStopProxy.shouldStop = true; // Флаг для цикла processQueue
  setIsProcessing(false); // UI: скрыть "обработка активна"
  await Promise.resolve(); // Позволить React обновиться
};

// ВОЗОБНОВЛЕНИЕ: Продолжить с того же места
const resumeProcessing = async () => {
  setIsProcessing(true);
  console.log("[File Processing] Запущена новая очередь обработки");
  await processQueue(); // Обработать оставшиеся файлы
};
```

**Сценарий использования** (срочная загрузка вложения):

```typescript
// Фоновая обработка очереди: [file1, file2, file3]
// Пользователь нажал "Загрузить сейчас" на файле в чате

const downloadFileFromMessage = async (attachment: Attachment) => {
  await pauseProcessing(); // ⏸ Остановить фоновую загрузку
  // queueRef = [file1, file2, file3], isProcessing = false

  const result = await downloadFile({
    // ↓ Загрузить срочный файл
    filename: attachment.name,
    url: attachment.url,
    id: attachment.id
  });

  resumeProcessing(); // ▶ Возобновить фоновую загрузку
  // Обработка [file1, file2, file3] возобновлена
};
```

---

### 3.5 Инициация загрузки: `useDownloadMessageAttachments`

**Назначение**: Хук для автоматического запуска очереди при восстановлении сети.

```typescript
// ШАГ 1: Подготовить вложения для очереди
const addFilesToProcessingQueue = useCallback(
  async (attachments: (Attachment | undefined)[]) => {
    resetQueue(); // Очистить старую очередь

    for (const attachment of attachments) {
      const filename = `${attachment?.id}.${getExtension(attachment?.name)}`;
      const path = `${ATTACHMENTS_DIR}${filename}`;

      // Проверить локальный кэш
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

// ШАГ 3: Отслеживать восстановление сети и состояние приложения
useEffect(() => {
  if (!attachments.length) return;

  // Начать загрузку ТОЛЬКО если:
  // 1. Приложение активно (на переднем плане)
  // 2. Интернет доступен (isConnected = true)
  if (isAppStateActive(appState) && isConnected) {
    addFilesToProcessingQueue(attachments);
    startProcessing(); // Начать обработку очереди
  }
}, [attachments.length, appState, isConnected]);
```

**Реальный сценарий**:

```
1. Приложение запущено, нет интернета
   → useDownloadMessageAttachments: ничего не делает

2. Пользователь включает Wi-Fi
   → isConnected меняется на true
   → isAppStateActive(appState) = true
   → useEffect срабатывает
   → addFilesToProcessingQueue добавляет все вложения в queueRef
   → startProcessing() начинает загрузку файлов в фоне

3. Пользователь закрыл приложение
   → appState = 'background'
   → pauseProcessing() вызывается автоматически (если реализовано)
   → queueRef остаётся нетронутым для последующего возобновления
```

---

## 4. Интеграция в приложение

**Обёртка провайдером**:

```typescript
// app/_layout.tsx
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

**Использование в компоненте**:

```typescript
function MessageScreen() {
  useDownloadMessageAttachments(); // Хук автоматически запустит очередь
  const { downloadFileFromMessage } = useDownloadMessageAttachmentsContext();

  return (
    <Button
      onPress={() => downloadFileFromMessage(attachment)}
      title="Загрузить сейчас"
    />
  );
}
```

---

## 5. Ключевые характеристики

| Характеристика          | Реализация                                              |
| ----------------------- | ------------------------------------------------------- |
| **Кэширование**         | Проверка через `FileSystem.getInfoAsync()` перед загрузкой |
| **Приоритизация**       | `unshift()` добавляет новые файлы в начало очереди      |
| **Безопасность**        | Токен из защищённого хранилища `authStorage`            |
| **Обработка ошибок**    | Проверка `status >= 400`, выброс Error                  |
| **Реактивность**        | Zustand `setIsProcessing` обновляет состояние UI        |
| **Устойчивость к сети** | Хук отслеживает `isConnected` через `useCheckNetworkStatus` |
