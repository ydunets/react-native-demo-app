function MessageScreen() {
  useDownloadMessageAttachments(); // Хук автоматически запустит очередь
  const { downloadFileFromMessage } = useDownloadMessageAttachmentsContext();

  return (
    <Button
      onPress={() => downloadFileFromMessage(attachment)}
      title="Загрузить сейчас"
    />
  );
}# Документация функциональности: Загрузка вложений сообщений

---

## Какую проблему решает?

**Ценностное предложение и бизнес-контекст**

- **Основная проблема:** Пользователям необходим доступ и просмотр вложений сообщений (документов, изображений, файлов), отправленных в системе обмена сообщениями для здравоохранения, но мобильные устройства требуют локального доступа к файлам для просмотра и обмена вложениями.
- **Бизнес-ценность:** Позволяет медицинским работникам и пациентам беспрепятственно получать доступ к важным документам, медицинским записям, изображениям и другим файлам, передаваемым через систему обмена сообщениями, улучшая координацию медицинской помощи и эффективность коммуникации.
- **Решаемые проблемы пользователей:**
  - Устраняет необходимость вручную загружать каждое вложение
  - Обеспечивает офлайн-доступ к ранее загруженным вложениям
  - Корректно обрабатывает проблемы сетевого подключения с механизмами повторных попыток
  - Предотвращает дублирование загрузок и расход хранилища
- **Решаемые технические задачи:**
  - Управление аутентифицированными API-вызовами для безопасной загрузки файлов
  - Реализация интеллектуальной системы очередей для пакетных загрузок
  - Обработка операций файловой системы и управление хранилищем
  - Обеспечение фоновой обработки без блокировки UI

---

## Как получить доступ и использовать?

**Детали реализации и пользовательский путь**

### Методы доступа

- **Точки входа:**
  - Автоматически срабатывает при просмотре списков сообщений с вложениями
  - Ручная загрузка при нажатии на отдельные элементы вложений в деталях сообщения
  - Фоновая обработка когда приложение становится активным и сеть доступна
- **Предварительные требования:**
  - Пользователь должен быть аутентифицирован с действительными токенами доступа
  - На устройстве должно быть достаточно места для хранения
  - Сетевое подключение требуется для первоначальных загрузок
- **Необходимые разрешения:**
  - Разрешения на чтение/запись файловой системы
  - Разрешения на доступ к сети
  - Аутентификация через токены Keycloak OIDC

### Ключевые шаги использования

1. **Автоматическая фоновая загрузка:** Когда пользователь просматривает сообщения, система автоматически ставит в очередь вложения из последних 50 сообщений для загрузки
2. **Обработка очереди:** Система обрабатывает загрузки в фоновом режиме, учитывая сетевое подключение и состояние приложения
3. **Хранение файлов:** Загруженные файлы сохраняются в кэш устройства с уникальными идентификаторами и правильными расширениями файлов
4. **Взаимодействие пользователя:** Когда пользователь нажимает на вложение, система либо открывает локально кэшированный файл, либо инициирует немедленную загрузку
5. **Просмотр документов:** Использует нативный просмотрщик документов для отображения загруженных файлов с правильными заголовками и названиями

### Точки интеграции

- **UI-компоненты:**
  - Компоненты `AttachmentItem` в деталях сообщения
  - `AttachmentList` для отображения множественных вложений
  - Индикаторы загрузки во время процесса скачивания
- **Поток данных:**
  - API сообщений предоставляет метаданные вложений
  - Очередь загрузки управляет обработкой файлов
  - Локальная файловая система хранит загруженный контент
  - Просмотрщик документов обрабатывает представление файлов

---

## Известные ограничения и предварительные требования

**Важные соображения и требования**

### Текущие ограничения

- **Функциональные ограничения:**
  - Загружает вложения только из последних 50 сообщений
  - Нет поддержки возобновления прерванных загрузок
  - Не реализованы ограничения размера файлов или предупреждения
  - Ограничено типами файлов, поддерживаемыми нативным просмотрщиком документов
- **Ограничения производительности:**
  - Загрузки обрабатываются последовательно, не параллельно
  - Большие файлы могут влиять на производительность приложения во время загрузки
  - Нет сжатия или оптимизации для экономии трафика
- **Платформенные ограничения:**
  - Зависит от нативных возможностей просмотра документов устройства
  - Хранение файлов ограничено директорией кэша приложения
  - iOS и Android могут по-разному обрабатывать определённые типы файлов
- **Соображения масштабируемости:**
  - Обработка очереди может стать неэффективной при большом количестве вложений
  - Нет механизма очистки старых кэшированных файлов
  - Использование памяти может увеличиваться при больших очередях вложений

---

## Технические детали реализации

**Архитектура и структура кода**

### Ключевые компоненты

- **Файлы/Модули:**
  - `/contexts/downloadMessageAttachments.tsx` - Основной провайдер контекста для функциональности загрузки
  - `/hooks/useDownloadMessageAttachments.tsx` - Хук для управления автоматическими загрузками
  - `/models/Attachment.ts` и `/models/MhaAttachment.ts` - Модели данных вложений
  - `/utils/files.ts` - Утилиты для работы с файловой системой
  - `/constants/File.ts` - Константы и директории, связанные с файлами
- **Зависимости:**
  - `expo-file-system` - Операции файловой системы и управление директориями
  - `react-native-blob-util` - HTTP-запросы для загрузки файлов
  - `@react-native-documents/viewer` - Нативный просмотр документов
  - `@react-native-community/netinfo` - Определение сетевого подключения
- **Конфигурация:**
  - `ATTACHMENTS_DIR` - Директория кэша для загруженных файлов
  - API-эндпоинты настраиваются через пути dashboard-сервиса
  - Токены аутентификации из защищённого хранилища

### Примеры кода

```typescript
// Использование контекста загрузки
const { downloadFileFromMessage, isProcessing } =
  useDownloadMessageAttachmentsContext();

// Ручная загрузка конкретного вложения
const handleDownloadAttachment = async (attachment: Attachment) => {
  const success = await downloadFileFromMessage(attachment);
  if (success) {
    // Открыть загруженный файл
    await viewDocument({
      uri: getAttachmentFilePath(attachment),
      headerTitle: attachment.name
    });
  }
};

// Настройка автоматической фоновой загрузки
export const useDownloadMessageAttachments = () => {
  const { addCommand, startProcessing, resetQueue } =
    useDownloadMessageAttachmentsContext();
  const { attachments } = useAllMessages({ limit: "50" });

  const addFilesToProcessingQueue = useCallback(
    async (attachments) => {
      resetQueue();
      for (const attachment of attachments) {
        const filename = `${attachment?.id}.${getExtension(attachment?.name ?? "txt")}`;
        const path = `${ATTACHMENTS_DIR}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(path);

        if (!attachment?.url || fileInfo.exists) continue;

        addCommand({
          url: attachment.url,
          filename: attachment.name,
          id: attachment.id
        });
      }
    },
    [addCommand, resetQueue]
  );
};

// Реализация загрузки файла
const downloadFile = async ({ url, filename, id }: DownloadCommand) => {
  const accessToken = await getAuthToken();
  await makeDirectory(ATTACHMENTS_DIR);

  const path = `${ATTACHMENTS_DIR}${id}.${getExtension(filename)}`;
  const fileInfo = await FileSystem.getInfoAsync(path);

  if (fileInfo.exists) return true;

  const response = await RNFetchBlob.fetch(
    "POST",
    `${axiosConfig.baseURL}${getDashboardSrvPaths().messages.downloadFile}`,
    {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json, text/plain, */*",
      "Content-Type": "text/plain"
    },
    url
  );

  const base64 = await response.base64();
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64
  });

  return response.respInfo.status < 400;
};
```

### Архитектура управления очередью

```typescript
// Очередь обработки с управлением на основе Proxy
const useManageProcessingQueue = () => {
  let queueRef = useRef<DownloadCommand[]>([]);
  let shouldStopProxy = useRef(
    new Proxy(
      { shouldStop: false },
      {
        get: (target, prop) => Reflect.get(target, prop),
        set: (target, prop, value) => Reflect.set(target, prop, value)
      }
    )
  );

  const processQueue = async () => {
    setIsProcessing(true);
    while (queueRef.current.length) {
      const result = await downloadFile(queueRef.current[0]);
      if (!result || shouldStopProxy.current.shouldStop) break;
      queueRef.current.shift();
    }
    setIsProcessing(false);
  };
};
```

### Интеграция с файловой системой

```typescript
// Генерация и управление путями к файлам
export const getAttachmentFilePath = (attachment: Attachment) =>
  `${ATTACHMENTS_DIR}${attachment.id}.${getExtension(attachment.name)}`;

export const makeDirectory = async (directoryUri: string) => {
  const directoryExists = await checkIfDirectoryExists(directoryUri);
  if (!directoryExists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
};

// Запуск загрузки с учётом сети
useEffect(() => {
  if (attachments.length && isAppStateActive(appState) && isConnected) {
    startDownloads();
  }
}, [attachments.length, appState, isConnected]);
```

---

**Примечание:** Эта функциональность бесшовно интегрируется с системой обмена сообщениями React Native для здравоохранения, обеспечивая надёжные возможности управления файлами при сохранении безопасности через аутентифицированные API-вызовы и правильные механизмы обработки ошибок.
