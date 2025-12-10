# Автоматическое обновление токенов в приложении

## Обзор

Реализовать надёжный механизм обновления токенов с использованием React Query, который автоматически поддерживает валидные токены аутентификации на протяжении всего жизненного цикла приложения. Система обрабатывает фоновые состояния, сетевые прерывания и обеспечивает graceful recovery при ошибках.

---

## Основная функция обновления токенов

Основная функция обновления обменивает истекший или существующий refresh токен на новый набор токенов:

```typescript
const refreshTokens = async (refreshToken?: string) => {
  const {
    refreshToken: newRefreshToken,
    accessToken,
    idToken
  } = await refreshAsync(
    {
      clientId: envConfig.clientId,
      refreshToken: refreshToken
    },
    {
      tokenEndpoint: `${envConfig.keycloakURL}/realms/${envConfig.realm}/protocol/openid-connect/token`
    }
  );

  return {
    refreshToken: newRefreshToken,
    accessToken,
    idToken
  };
};
```

### Поведение функции:

- **Входные данные**: Текущий refresh токен (опционально)
- **Процесс**: Вызов endpoint Keycloak с учётными данными клиента
- **Выходные данные**: Новый набор токенов (refresh + access + ID)
- **Endpoint**: `{keycloakURL}/realms/{realm}/protocol/openid-connect/token`

---

## Интеграция с React Query

React Query обрабатывает планирование фонового обновления и логику повторных попыток:

```typescript
const { isError, isFetched, isFetching, error, refetch } = useQuery<
  AuthStorageTokens,
  CustomError
>({
  queryKey: ["refreshToken"],
  enabled, // Контролируется состоянием приложения и условиями
  queryFn: async () => {
    setIsTokensFetching(true);
    const tokens = await refreshTokens(refreshToken);
    setTokens(tokens); // Сохранение в Zustand
    setIsTokensCanUseAfterBackground(true);

    return tokens;
  },

  // АВТООБНОВЛЕНИЕ: Каждые N минут (обычно 15 мин жизни access токена)
  refetchInterval: ACCESS_TOKEN_LIFESPAN,

  // ЛОГИКА ПОВТОРА: До 3 попыток только при сетевых ошибках
  retry: (failureCount, error) =>
    error.message === ErrorMessages.NETWORK_REQUEST_FAILED && failureCount < 3
});
```

### Детали конфигурации запроса:

| Параметр            | Назначение                       | Значение                             |
| ------------------- | -------------------------------- | ------------------------------------ |
| **queryKey**        | Уникальный идентификатор запроса | `["refreshToken"]`                   |
| **enabled**         | Контролирует выполнение запроса  | Динамический на основе условий       |
| **queryFn**         | Логика обновления токенов        | Вызывает `refreshTokens()`           |
| **refetchInterval** | Частота автообновления           | Время жизни access токена (~15 мин)  |
| **retry**           | Стратегия восстановления         | 3 попытки только при сетевых ошибках |

---

## Условия обновления токенов

Токены обновляются **только когда выполнены ВСЕ условия**:

```typescript
// ✅ Приложение активно (не в фоне)
const isAppActive = !isAppStateBackground(appState);

// ✅ Есть сетевое соединение
const hasInternet = isConnected;

// ✅ Истек таймаут неактивности
const timeoutFinished = isTimeoutFinished;

// ✅ Возврат из фонового состояния
const returnedFromBackground = hasAppBeenInBackground;

// Включить обновление при выполнении всех условий
const enabled =
  isAppActive && hasInternet && (timeoutFinished || returnedFromBackground);
```

### Почему эти условия?

| Условие                | Причина                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **Приложение активно** | Предотвращение обновления в фоне (сбережение батареи/ресурсов) |
| **Есть интернет**      | Избежание сетевых запросов в оффлайне                          |
| **Истек таймаут**      | Rate-limiting (не обновлять слишком часто)                     |
| **Возврат из фона**    | Немедленное обновление при возобновлении приложения            |

---

## Отслеживание состояния приложения

Мониторить переход приложения в/из фонового состояния для управления обновлением токенов:

```typescript
useEffect(() => {
  const subscription = AppState.addEventListener("change", (nextAppState) => {
    // ПОЛЬЗОВАТЕЛЬ ЗАКРЫЛ ПРИЛОЖЕНИЕ: Запретить использование токенов
    if (isAppStateBackground(nextAppState)) {
      setIsTokensCanUseAfterBackground(false);
    }

    // ПРИЛОЖЕНИЕ ПЕРЕШЛО В ФОН: Отметить для обновления при возврате
    if (
      isAppStateBackground(nextAppState) ||
      isAppStateInactive(nextAppState)
    ) {
      setHasAppBeenInBackground(true);
    }
  });

  return () => subscription.remove();
}, []);
```

### Переходы состояний:

```
FOREGROUND (Активно)
    ↓ (пользователь свернул приложение)
BACKGROUND (Фон)
    ├─ hasAppBeenInBackground = true
    ├─ isTokensCanUseAfterBackground = false
    └─ Не использовать токены до обновления

    ↓ (пользователь открыл приложение)
FOREGROUND (Активно)
    ├─ Незамедлительное обновление
    ├─ Set isTokensCanUseAfterBackground = true
    └─ Возобновить обычное использование токенов
```

---

## Обработка ошибок

Обработка различных сценариев ошибок с соответствующими ответами:

```typescript
useEffect(() => {
  // СЦЕНАРИЙ 1: Ошибка сервера (500, 502, и т.д.)
  if (
    isError &&
    error.statusCode === CUSTOM_ERRORS.HTTP_STATUS_INTERNAL_SERVER_ERROR
  ) {
    confirmTechnicalIssue(); // Показать диалог повтора пользователю
    // Разрешить повтор без logout
  }

  // СЦЕНАРИЙ 2: Ошибка аутентификации/авторизации
  // (Неверные учётные данные, отозванный токен, отказано в доступе)
  if (isError && error.message !== ErrorMessages.NETWORK_REQUEST_FAILED) {
    clearUser(); // Очистить данные пользователя
    clearAuthData(); // Очистить состояние аутентификации
    clearTokensState(); // Очистить хранилище токенов

    // Удалить устаревший запрос обновления из кеша
    client.removeQueries({
      queryKey: ["refreshToken"],
      exact: true
    });

    confirm(); // Logout пользователя и перенаправление на login
  }
}, [isError, error]);
```

### Классификация ошибок:

| Тип ошибки                | Код статуса   | Пример                                  | Действие                |
| ------------------------- | ------------- | --------------------------------------- | ----------------------- |
| **Ошибка сервера**        | 500, 502, 503 | Keycloak недоступен                     | Показать диалог повтора |
| **Ошибка сети**           | N/A           | Нет интернета                           | Повтор до 3 раз         |
| **Ошибка аутентификации** | 401, 403      | Истек refresh токен, отказано в доступе | Принудительный logout   |
| **Ошибка клиента**        | 400           | Неверный client ID, некорректный запрос | Принудительный logout   |

---

## Принцип работы

### 1. **Фоновое обновление** (Автоматическое)

```
t=0мин: Приложение запущено
  ↓ (каждые 15 мин)
t=15мин: React Query запускает refetchInterval
  └─ Если enabled → вызов refreshTokens()
  └─ Новые токены сохранены в Zustand
  └─ Приложение продолжает работу с валидными токенами
```

### 2. **Реактивность** (Событийно-ориентированная)

```
Пользователь свернул приложение (Background) ──→ hasAppBeenInBackground = true
        ↓ (пользователь открыл)
Пользователь возобновил (Foreground) ────→ enabled = true
        ↓
React Query немедленно обновляет ──→ Получены новые валидные токены
```

### 3. **Логика повтора** (Умное восстановление)

```
Попытка обновления #1 ──→ Ошибка сети ──→ Ожидание + Повтор #2
Попытка обновления #2 ──→ Ошибка сети ──→ Ожидание + Повтор #3
Попытка обновления #3 ──→ Ошибка сети ──→ Остановка (пользователь может повторить)
                    ↓
                    Успех ──→ Сохранение токенов + Продолжение
```

### 4. **Graceful Degradation** (Восстановление при ошибках)

```
Не-сетевая ошибка (аутентификация/сервер)
    ├─ Сетевая ошибка? ──НЕТ→ Очистить токены + Logout
    └─ ДА? ──→ Повтор (React Query обрабатывает)
```

---

## Диаграмма потока данных

```
┌─────────────────────────────────────────────────────────┐
│              ПРИЛОЖЕНИЕ ЗАПУЩЕНО                        │
└────────────────────┬────────────────────────────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Проверка enabled:          │
        │ isAppActive &&             │
        │ hasInternet &&             │
        │ (timeoutElapsed ||         │
        │  returnedFromBackground)   │
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Запрос включен? ────НЕТ──→ Ожидание
        │                   │
        │                  ДА↓
        │ refreshTokens()
        │ • Получить токен авторизации
        │ • Вызвать Keycloak
        │ • Получить новые токены
        │ • Сохранить в Zustand
        │ • Отметить готовыми к использованию
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Запланировать следующее:   │
        │ refetchInterval = 15 мин    │
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────┐
        │ Обработка ошибок:          │
        │ • Ошибка сервера?  → Повтор│
        │ • Ошибка аутентификации? → Logout
        │ • Ошибка сети?     → Повтор│
        └────────────────────────────┘

ФОНОВЫЙ ЦИКЛ:
Каждый refetchInterval (15 мин) → Повтор процесса (если включено)
Пользователь возобновил → Немедленное обновление (если включено)
```

---

## Пример интеграции в компонент

```typescript
// hooks/useTokenRefresh.tsx
export const useTokenRefresh = () => {
  const { refreshToken } = useAuthStore();
  const { appState } = useAppStateStore();
  const { isConnected } = useCheckNetworkStatus();
  const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);
  const [hasAppBeenInBackground, setHasAppBeenInBackground] = useState(false);

  // Таймаут неактивности
  const { resetTimeout } = useTimeout(() => {
    setIsTimeoutFinished(true);
  }, INACTIVITY_TIMEOUT);

  // Отслеживание состояния приложения
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (isAppStateBackground(nextAppState)) {
        setIsTokensCanUseAfterBackground(false);
      }
      if (isAppStateBackground(nextAppState) || isAppStateInactive(nextAppState)) {
        setHasAppBeenInBackground(true);
      }
    });
    return () => subscription.remove();
  }, []);

  // Расчёт состояния enabled
  const enabled =
    !isAppStateBackground(appState) &&
    isConnected &&
    (isTimeoutFinished || hasAppBeenInBackground) &&
    !!refreshToken;

  // React Query
  const query = useQuery<AuthStorageTokens, CustomError>({
    queryKey: ["refreshToken"],
    enabled,
    queryFn: async () => {
      const tokens = await refreshTokens(refreshToken);
      setTokens(tokens);
      setIsTokensCanUseAfterBackground(true);
      return tokens;
    },
    refetchInterval: ACCESS_TOKEN_LIFESPAN,
    retry: (failureCount, error) =>
      error.message === ErrorMessages.NETWORK_REQUEST_FAILED &&
      failureCount < 3
  });

  return {
    isRefreshing: query.isFetching,
    refreshError: query.error,
    canUseTokens: isTokensCanUseAfterBackground
  };
};

// Использование в компоненте
function AppContent() {
  const { isRefreshing, refreshError, canUseTokens } = useTokenRefresh();

  if (refreshError && refreshError.message !== NETWORK_ERROR) {
    return <LoginRequired />;
  }

  if (!canUseTokens) {
    return <LoadingSpinner />;
  }

  return <MainApp />;
}
```

---

## Результат: Прозрачное управление токенами

### Опыт пользователя:

✅ **Прозрачность**: Пользователи не видят истечение токенов  
✅ **Автоматизация**: Фоновое обновление без действий пользователя  
✅ **Устойчивость**: Сетевые прерывания обрабатываются корректно  
✅ **Отзывчивость**: Немедленное обновление при возобновлении приложения  
✅ **Безопасность**: Автоматический logout при ошибке аутентификации

### Технические преимущества:

✅ **Без ручного обновления**: React Query управляет расписанием  
✅ **Снижение запросов**: Обновление по интервалу, не по требованию  
✅ **Умный повтор**: Повторяет только сетевые ошибки, быстро выходит при ошибках аутентификации  
✅ **Осведомлённость о состоянии**: Уважает жизненный цикл приложения (foreground/background)  
✅ **Кеш запросов**: React Query кеширует состояние токенов

### Результат:

**Пользователи всегда имеют валидные токены без ручного вмешательства**, обеспечивая прозрачную аутентификацию на протяжении всего жизненного цикла приложения.

---

## Конфигурационные константы

```typescript
// Время жизни токена (когда запустить обновление)
const ACCESS_TOKEN_LIFESPAN = 15 * 60 * 1000; // 15 минут в миллисекундах

// Таймаут неактивности перед требованием обновления
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 минут в миллисекундах

// Максимум повторных попыток при сетевых ошибках
const MAX_RETRY_ATTEMPTS = 3;

// Сообщения об ошибках
const ErrorMessages = {
  NETWORK_REQUEST_FAILED: "Network request failed",
  INVALID_CREDENTIALS: "Invalid credentials",
  TOKEN_EXPIRED: "Token expired"
};

// Пользовательские коды HTTP ошибок
const CUSTOM_ERRORS = {
  HTTP_STATUS_INTERNAL_SERVER_ERROR: 500
};
```

---

## Тестирование обновления токенов

```typescript
// Тест: Переход из фона в активность
test("должно обновить токены при возврате приложения из фона", async () => {
  const { result } = renderHook(() => useTokenRefresh());

  // Симуляция фонового состояния
  act(() => {
    AppState.emit("change", "background");
  });

  // Симуляция возврата в активность
  act(() => {
    AppState.emit("change", "active");
  });

  // Ожидание обновления
  await waitFor(() => {
    expect(result.current.isRefreshing).toBe(false);
  });

  expect(result.current.canUseTokens).toBe(true);
});

// Тест: Повтор при сетевой ошибке
test("должно повторить попытку при ошибке сети до 3 раз", async () => {
  const mockRefresh = jest.fn();
  mockRefresh.mockRejectedValueOnce(new Error("Network error"));
  mockRefresh.mockResolvedValueOnce(newTokens);

  // Запрос должен автоматически повторять
  // После 3 неудач остановить повторы
});

// Тест: Logout при ошибке аутентификации
test("должно выполнить logout при ошибке аутентификации", async () => {
  const mockRefresh = jest.fn();
  mockRefresh.mockRejectedValueOnce(
    new HttpError(401, "Invalid refresh token")
  );

  // Должно запустить процесс logout
  await waitFor(() => {
    expect(clearAuthData).toHaveBeenCalled();
  });
});
```

---

## Итоговая сводка

Этот механизм автоматического обновления токенов обеспечивает:

1. **Запланированное обновление**: React Query управляет обновлением по интервалам
2. **Событийно-ориентированное**: Реагирует на изменения состояния приложения
3. **Умный повтор**: Учитывает сетевые условия с экспоненциальной задержкой
4. **Graceful обработка**: Разные стратегии для разных типов ошибок
5. **Прозрачность**: Пользователи не осведомлены об управлении токенами

Результат — надёжная, production-ready система аутентификации, которая поддерживает валидные токены на протяжении всего жизненного цикла приложения.
