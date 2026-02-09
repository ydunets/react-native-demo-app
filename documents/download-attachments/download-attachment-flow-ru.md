# Техническая документация: Система загрузки вложений сообщений

## 1. Цель реализации

RU

Реализовать **очередь загрузки вложений сообщений** с поддержкой:

- Автоматической паузы/возобновления при переходе приложения в фон и обратно
- Перезапуска обработки при возвращении в активное состояние (при наличии элементов в очереди)
- Приоритизации срочных загрузок с отменой текущей и временной паузой очереди
- Кэширования файлов и мгновенного открытия ранее загруженных вложений
- Отслеживания состояния очереди (active/paused/queued/idle)

EN

Implement a **message attachment download queue** with support for:

- Automatic pause/resume on background/foreground transitions
- Restarting processing on app return when the queue still has items
- Priority downloads that cancel the current transfer and temporarily pause the queue
- Local file caching with instant open for cached attachments
- Queue state tracking (active/paused/queued/idle)

RU

### Слайд: Как работает загрузка файлов

- Вложения собираются, проверяются по кэшу и добавляются в очередь
- Очередь запускает последовательную загрузку одного файла за раз
- Пауза/возобновление зависят от сети, app state и авторизации
- Приоритетная загрузка временно останавливает очередь и качает нужный файл

EN

### Slide: How file loading works

- Attachments are collected, cache-checked, and queued
- The queue downloads one file at a time sequentially
- Pause/resume depends on network, app state, and auth
- Priority download temporarily pauses the queue to fetch the requested file

RU

### Слайд: Шаги загрузки файлов (внутри контекста)

- Проверка токена и подготовка пути сохранения
- Старт RNFetchBlob-загрузки с прогрессом и сохранением в кэш
- Успех: возврат пути файла, ошибка: очистка кэша и остановка текущего шага



RU

### Слайд: Шаги реализации (реальный пример)

1. Получаем вложения, фильтруем кэш, добавляем команды в очередь
2. Запускаем `runProcessing()` и скачиваем файлы по одному через RNFetchBlob
3. Обновляем прогресс, отмечаем завершенные команды, состояние сохраняется в MMKV
4. При уходе в фон — пауза, при возвращении — проверка условий и возобновление
5. Приоритетная загрузка: отменяем текущую, скачиваем нужный файл, возвращаем очередь

EN

### Implementation steps (real example)

1. Fetch attachments, filter cache, enqueue download commands
2. Start `runProcessing()` and download files one by one with RNFetchBlob
3. Update progress, mark completed commands, state persists to MMKV
4. On background — pause, on return — re-check conditions and resume
5. Priority download: cancel current, fetch requested file, resume the queue

RU

### Слой 1 - Инициация и мониторинг

- Все условия запуска собраны в одном месте (`useDownloadMessageAttachments`)
- Отслеживаются сеть (`useNetInfo`), состояние приложения (`useAppState`) и данные сообщений (`useMessageAttachments`)
- Очередь запускается автоматически, когда выполнены условия (авторизация, сеть, активное состояние)

### Слой 2 - Координация и контекст

- React Context как единая точка входа для операций загрузки
- Поддержка одиночной и приоритетной загрузки с отменой текущей
- Zustand используется для состояния прогресса и авторизации

### Слой 3 - Управление очередью (Valtio)

- Valtio хранит состояние очереди и флаги паузы
- Цикл обработки и скачивание файлов выполняются в `contexts/downloadMessageAttachments.tsx`
- Пауза/возобновление управляются флагами `pausedDueTo*` и `isProcessing`

EN

### Layer 1 - Initiation and Monitoring

- All start conditions are centralized in `useDownloadMessageAttachments`
- Tracks network (`useNetInfo`), app state (`useAppState`), and message data (`useMessageAttachments`)
- Automatically starts the queue when conditions are met (auth, network, active state)

### Layer 2 - Coordination and Context

- React Context as the single entry point for download operations
- Supports single-file and priority downloads with cancel of the current transfer
- Zustand is used for progress and auth state

### Layer 3 - Queue Management (Valtio)

- Valtio stores queue state and pause flags
- Processing loop and file downloads run in `contexts/downloadMessageAttachments.tsx`
- Pause/resume is driven by `pausedDueTo*` flags and `isProcessing`

RU

### Ключевые библиотеки (текущая реализация)

- Expo File System — проверка кэша, сохранение файлов, оффлайн-доступ
- RN Fetch Blob Util — бинарные загрузки, прогресс, обработка больших файлов
- NetInfo / AppState — контроль сети и состояния приложения, автопауза/возврат
- React Context API — единый API загрузок и координация очереди
- Valtio — состояние очереди и флаги паузы, подготовка к восстановлению

EN

### Key libraries (current implementation)

- Expo File System — cache validation, file persistence, offline access
- RN Fetch Blob Util — binary downloads, progress tracking for large files
- NetInfo / AppState — network and app state monitoring, auto pause/resume
- React Context API — global download API and queue coordination
- Valtio — queue state and pause flags, ready for restore/resume

RU

### Общее описание сценариев

- Сценарий 1: базовая очередь — все файлы добавляются в очередь, затем скачиваются по одному
- Сценарий 2: фон/передний план — загрузки ставятся на паузу в фоне и возобновляются при возвращении
- Сценарий 3: приоритетная загрузка — срочный файл скачивается вне очереди с временной паузой основной обработки

EN

### General scenario overview

- Scenario 1: basic queue — all files are queued first, then downloaded sequentially
- Scenario 2: background/foreground — downloads pause in background and resume on return
- Scenario 3: priority download — urgent file downloads outside the queue with a temporary pause of the main flow

---

## 2. Обзор компонентов

RU

**useDownloadMessageAttachments**

- Собирает условия запуска (auth, сеть, app state)
- Готовит очередь: фильтрует кэш и добавляет команды
- Запускает обработку через `runProcessing()`

**DownloadMessageAttachmentsContext**

- Единая точка входа для загрузок и приоритетных скачиваний
- Координирует паузы/возобновления и отмену текущего файла
- Инкапсулирует RNFetchBlob-загрузки и обработку ошибок

**Valtio download queue**

- Хранит очередь, статус и флаги паузы (`pausedDueTo*`)
- Даёт вычислимые статусы (`queued/processing/paused/idle`)
- Сохраняет состояние через MMKV

**Progress + Auth (Zustand)**

- Хранит прогресс текущего файла и общую позицию в очереди
- Предоставляет данные авторизации для загрузки
- Синхронизируется с процессом загрузки без дублирования логики

EN

**useDownloadMessageAttachments**

- Centralizes start conditions (auth, network, app state)
- Builds the queue: cache filter + command enqueue
- Starts processing via `runProcessing()`

**DownloadMessageAttachmentsContext**

- Single entry point for normal and priority downloads
- Coordinates pause/resume and current download cancellation
- Encapsulates RNFetchBlob downloads and error handling

**Valtio download queue**

- Stores queue, status, and pause flags (`pausedDueTo*`)
- Exposes computed states (`queued/processing/paused/idle`)
- Persists state via MMKV

**Progress + Auth (Zustand)**

- Tracks per-file progress and overall position
- Supplies auth state for download access
- Syncs with download flow without duplicating logic

EN

### Slide: File loading steps (inside context)

- Check auth token and prepare the local file path
- Start RNFetchBlob download with progress and cache write
- On success return the file path, on error cleanup cache and stop the step

---

RU

### Слайд: Методы управления очередью

- `addCommand`, `removeCommand`, `resetQueue` — управление составом очереди
- `startProcessing`, `completeCurrentCommand`, `completeProcessing` — запуск и завершение обработки
- `pauseProcessing`, `pauseDueToBackground`, `pauseDueToMessageDownload`, `pauseDueToAuth`, `resumeProcessing`, `resumeFromBackground`, `clearPauseDueToMessageDownload` — пауза и возобновление

EN

### Slide: Queue control methods

- `addCommand`, `removeCommand`, `resetQueue` — queue composition
- `startProcessing`, `completeCurrentCommand`, `completeProcessing` — start and finish processing
- `pauseProcessing`, `pauseDueToBackground`, `pauseDueToMessageDownload`, `pauseDueToAuth`, `resumeProcessing`, `resumeFromBackground`, `clearPauseDueToMessageDownload` — pause and resume

---

RU

### Шаги `processQueue`

- Проверить наличие токена и остановиться, если авторизация отсутствует
- Установить статус обработки и зафиксировать общее количество файлов
- В цикле: если очередь на паузе — остановиться; иначе выбрать следующий файл и обновить прогресс (какой файл сейчас и сколько осталось)
- Запустить загрузку файла и остановиться при ошибке
- Отметить файл завершенным, проверить паузу после завершения
- Завершить обработку и сбросить прогресс

EN

### `processQueue` steps

- Check auth token and stop if not authenticated
- Set processing status and capture total file count
- Loop: if paused, stop; otherwise pick the next file and update progress (current file and how many remain)
- Download the file and stop on failure
- Mark the file completed and re-check pause after completion
- Complete processing and reset progress

---

RU

### Шаги `downloadFileFromMessage` (приоритетная загрузка)

- Проверить кэш и открыть файл сразу, если он уже сохранен
- Поставить очередь на паузу и отменить текущую загрузку
- Скачать выбранный файл по приоритету
- Удалить его из очереди, если он там был
- Снять паузу и возобновить очередь при соблюдении условий

EN

### `downloadFileFromMessage` steps (priority download)

- Check cache and open the file immediately if it already exists
- Pause the queue and cancel the current download
- Download the selected file with priority
- Remove it from the queue if it was queued
- Clear the pause and resume the queue when conditions allow

---

RU

### Шаги `downloadFile`

- Проверить токен и остановиться, если нет доступа
- Подготовить путь файла и директорию кэша
- Запустить RNFetchBlob-загрузку с прогрессом
- При успехе вернуть путь файла
- При ошибке очистить кэш и завершить шаг

EN

### `downloadFile` steps

- Check auth token and stop if access is missing
- Prepare the file path and cache directory
- Start the RNFetchBlob download with progress
- On success return the file path
- On error clean up cache and end the step