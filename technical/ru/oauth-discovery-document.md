# OAuth 2.0 Discovery Document в Keycloak

## Обзор

Discovery Document (также известный как OpenID Connect Discovery) — это JSON файл, содержащий метаданные об OAuth 2.0/OpenID Connect провайдере. Он позволяет автоматически конфигурировать аутентификацию без хардкодирования endpoint'ов.

**Главное преимущество**: Zero-конфигурация аутентификации, которая автоматически адаптируется к изменениям провайдера.

---

## 1. Что такое Discovery Document?

### Определение

Discovery Document — это стандартизированный JSON endpoint (`.well-known/openid-configuration`), содержащий всю необходимую информацию для взаимодействия с OAuth 2.0/OpenID Connect провайдером.

### RFC 8414 Стандарт

Механизм discovery определен в **RFC 8414** (OAuth 2.0 Authorization Server Metadata), обеспечивая совместимость между провайдерами.

### Паттерн URL

```
{provider-url}/.well-known/openid-configuration
```

### Пример Keycloak

```
http://localhost:8080/realms/fusion-test/.well-known/openid-configuration
```

---

## 2. Структура Discovery Document

### Полный Пример

```json
{
  "issuer": "http://localhost:8080/realms/fusion-test",
  "authorization_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/auth",
  "token_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/token",
  "userinfo_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/userinfo",
  "end_session_endpoint": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/logout",
  "jwks_uri": "http://localhost:8080/realms/fusion-test/protocol/openid-connect/certs",
  "scopes_supported": ["openid", "profile", "email"],
  "response_types_supported": ["code", "token", "id_token"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

### Ключевые Поля

| Поле                            | Назначение                             | Пример                                     |
| ------------------------------- | -------------------------------------- | ------------------------------------------ |
| **issuer**                      | Идентификатор OAuth провайдера         | `http://localhost:8080/realms/fusion-test` |
| **authorization_endpoint**      | Куда отправить пользователя для логина | `/protocol/openid-connect/auth`            |
| **token_endpoint**              | Обменять код на токены                 | `/protocol/openid-connect/token`           |
| **userinfo_endpoint**           | Получить информацию о профиле          | `/protocol/openid-connect/userinfo`        |
| **end_session_endpoint**        | URL выхода                             | `/protocol/openid-connect/logout`          |
| **jwks_uri**                    | Публичные ключи для валидации токенов  | `/protocol/openid-connect/certs`           |
| **scopes_supported**            | Доступные области разрешений           | `["openid", "profile", "email"]`           |
| **response_types_supported**    | Типы потоков аутентификации            | `["code", "token", "id_token"]`            |
| **grant_types_supported**       | Типы грантов токенов                   | `["authorization_code", "refresh_token"]`  |
| **token_endpoint_auth_methods** | Методы аутентификации клиента          | `["client_secret_basic"]`                  |

---

## 3. Использование Discovery в React Native

### Автоматическое Обнаружение с `useAutoDiscovery`

Библиотека `expo-auth-session` предоставляет hook `useAutoDiscovery()` для автоматической выборки и кеширования метаданных discovery.

```typescript
import * as AuthSession from "expo-auth-session";

const useKeycloakDiscovery = () => {
  // Автоматически выбрать discovery document из Keycloak
  const discovery = AuthSession.useAutoDiscovery(
    `${envConfig.keycloakURL}/realms/${envConfig.realm}`
  );

  return discovery;
};
```

### Полная Реализация

```typescript
// hooks/useKeycloakAuth.ts
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";

import { envConfig } from "@/configs/env-config";

export const useKeycloakAuth = () => {
  // Шаг 1: Автоматически выбрать метаданные discovery
  const discovery = AuthSession.useAutoDiscovery(
    `${envConfig.keycloakURL}/realms/${envConfig.realm}`
  );

  // Шаг 2: Определить OAuth учетные данные
  const clientId = envConfig.clientId;

  // Шаг 3: Подготовить запрос
  const request = new AuthSession.AuthRequest({
    clientId,
    // Discovery автоматически предоставляет все endpoint'ы
    redirectUrl: AuthSession.makeRedirectUrl()
  });

  // Шаг 4: Запросить пользователя на аутентификацию
  const promptAsync = async () => {
    try {
      const result = await request.promptAsync(discovery);

      if (result.type === "success" && result.params.code) {
        // Обменять код авторизации на токены
        const tokens = await exchangeCodeForTokens(
          result.params.code,
          discovery.tokenEndpoint
        );

        // Сохранить токены безопасно
        await SecureStore.setItemAsync("access_token", tokens.access_token);
        await SecureStore.setItemAsync("refresh_token", tokens.refresh_token);

        return tokens;
      }
    } catch (error) {
      console.error("Ошибка аутентификации:", error);
    }
  };

  return {
    discovery,
    request,
    promptAsync,
    isReady: discovery !== null
  };
};
```

---

## 4. Почему Discovery Важен

### Проблема Без Discovery

```typescript
// ❌ Хардкодированные endpoint'ы - хрупко и подвержено ошибкам
const authEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/auth";
const tokenEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/token";
const userInfoEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/userinfo";
const logoutEndpoint =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/logout";
const jwksUri =
  "http://localhost:8080/realms/fusion-test/protocol/openid-connect/certs";

// Если Keycloak изменит endpoint'ы или структуру → приложение сломается!
// Если переключиться на другого провайдера (Auth0, Azure AD) → нужно переписать все endpoint'ы
// Если версия Keycloak обновится → может потребоваться изменение кода
```

### Решение с Discovery

```typescript
// ✅ Автоматическое обнаружение - поддерживаемо и гибко
const discovery = useAutoDiscovery(`${keycloakURL}/realms/${realm}`);

// Все endpoint'ы доступны автоматически
const authEndpoint = discovery.authorizationEndpoint;
const tokenEndpoint = discovery.tokenEndpoint;
const userInfoEndpoint = discovery.userinfoEndpoint;
const logoutEndpoint = discovery.endSessionEndpoint;
const jwksUri = discovery.jwksUri;

// Если Keycloak изменится → автоматически обнаружится
// Переключиться на другого провайдера → просто измените URL discovery
// Приложение всегда работает с правильными endpoint'ами
```

---

## 5. Преимущества Discovery

### ✅ Автоматическая Конфигурация

**Не нужно хардкодировать**

```typescript
// Вместо ручного указания endpoint'ов
const config = {
  authorizationEndpoint: "http://...",
  tokenEndpoint: "http://..."
  // ... еще 5+ endpoint'ов
};

// Discovery предоставляет все сразу
const discovery = useAutoDiscovery(providerUrl);
// Все доступно в объекте discovery
```

**Обнаружение Возможностей Провайдера**

```typescript
// Проверить, что поддерживает провайдер
if (discovery.scopes_supported.includes("email")) {
  // Запросить scope email
}

if (discovery.response_types_supported.includes("id_token")) {
  // Использовать ID token flow
}
```

### ✅ Гибкость

**Легко Переключаться Между Окружениями**

```typescript
// Один и тот же код работает для всех окружений
const getDiscovery = (env: "dev" | "staging" | "prod") => {
  const keycloakUrl = envConfig[env].keycloakURL;
  const realm = envConfig[env].realm;

  return useAutoDiscovery(`${keycloakUrl}/realms/${realm}`);
};

// dev: http://localhost:8080/realms/fusion-test
// staging: https://staging-auth.example.com/realms/fusion-staging
// prod: https://auth.example.com/realms/fusion-prod
// Все работают без изменения кода!
```

**Независим От Провайдера**

```typescript
// Работает с любым OAuth 2.0/OIDC провайдером
const keycloakDiscovery = useAutoDiscovery(
  "http://localhost:8080/realms/fusion-test"
);

const auth0Discovery = useAutoDiscovery("https://your-tenant.auth0.com");

const azureDiscovery = useAutoDiscovery(
  "https://login.microsoftonline.com/your-tenant/v2.0"
);

// Один и тот же код аутентификации работает для всех!
```

### ✅ Стандартизация

**Соответствие RFC 8414**

```
Каждый OAuth 2.0/OIDC сервер, соответствующий RFC 8414, имеет:
/{issuer}/.well-known/openid-configuration

Этот стандартизированный endpoint обеспечивает:
✓ Согласованность между провайдерами
✓ Дизайн, устойчивый к будущим изменениям
✓ Совместимость
```

**Предсказуемая Структура**

```typescript
// Вы знаете точные поля, которые будут возвращены
interface DiscoveryMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
  scopes_supported: string[];
  response_types_supported: string[];
  // ... еще поля
}
```

### ✅ Безопасность

**Автоматическое Обновление JWKS**

```typescript
// Discovery предоставляет JWKS URI для валидации токенов
const jwksUri = discovery.jwksUri;
// http://localhost:8080/realms/fusion-test/protocol/openid-connect/certs

// Использовать это для валидации подписи токена
const publicKeys = await fetchJWKS(jwksUri);
const isValidToken = verifyToken(token, publicKeys);

// Ключи автоматически обновляются Keycloak
// Ручная ротация ключей не требуется
```

**Верификация Алгоритма**

```typescript
// Discovery содержит список поддерживаемых алгоритмов
const supportedAlgorithms = discovery.id_token_signing_alg_values_supported;
// ["RS256", "ES256", ...]

// Проверить, что токен использует поддерживаемый алгоритм
if (!supportedAlgorithms.includes(tokenHeader.alg)) {
  throw new Error("Неподдерживаемый алгоритм");
}

// Защита от атак подстановки алгоритма
```

---

## 6. Discovery в Multi-Environment Настройке

### Discovery Специфический для Окружения

```typescript
// configs/env-config.ts
export const envConfig = {
  dev: {
    keycloakURL: "http://localhost:8080",
    realm: "fusion-test",
    clientId: "fusion-mobile-dev"
  },
  staging: {
    keycloakURL: "https://staging-auth.example.com",
    realm: "fusion-staging",
    clientId: "fusion-mobile-stg"
  },
  production: {
    keycloakURL: "https://auth.example.com",
    realm: "fusion-prod",
    clientId: "fusion-mobile-prod"
  }
};

// hooks/useDiscovery.ts
export const useDiscovery = () => {
  const environment = process.env.APP_VARIANT || "dev";
  const config = envConfig[environment];

  return useAutoDiscovery(`${config.keycloakURL}/realms/${config.realm}`);
};
```

### Тестирование с Отдельным Realm

**Преимущества Test Realm**

```
┌──────────────────────────────────────────────────────┐
│                 Keycloak Server                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │  dev Realm       │      │  test Realm      │    │
│  │  (разработка)    │      │  (изолировано)   │    │
│  ├──────────────────┤      ├──────────────────┤    │
│  │ Пользователи:    │      │ Пользователи:    │    │
│  │ dev-team         │      │ test-users       │    │
│  │ Политики:        │      │ Политики:        │    │
│  │ мягкие           │      │ строгие          │    │
│  │ Данные:          │      │ Данные:          │    │
│  │ общие            │      │ изолированные    │    │
│  └──────────────────┘      └──────────────────┘    │
│                                                      │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │ staging Realm    │      │ prod Realm       │    │
│  │ (pre-production) │      │ (production)     │    │
│  └──────────────────┘      └──────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘

Каждый realm имеет свой:
✓ Пользователи и роли
✓ OAuth клиенты
✓ Сертификаты
✓ Метаданные discovery
✓ Изолированная конфигурация
```

**Discovery URLs По Realm**

```typescript
// Dev
const devDiscovery = useAutoDiscovery(
  "http://localhost:8080/realms/fusion-test"
);

// Staging
const stagingDiscovery = useAutoDiscovery(
  "https://staging-auth.example.com/realms/fusion-staging"
);

// Production
const prodDiscovery = useAutoDiscovery(
  "https://auth.example.com/realms/fusion-prod"
);

// Каждый имеет полностью отдельные метаданные
// Пользователи не могут пересекаться между окружениями
// Тестирование не влияет на production
```

---

## 7. Кеширование Discovery

### Как Работает `useAutoDiscovery`

```typescript
// expo-auth-session автоматически кеширует метаданные discovery

const discovery = useAutoDiscovery(discoveryUrl);

// Первый вызов: Выбирает из Keycloak
// Последующие вызовы: Возвращает кэшированную версию
// Предотвращает чрезмерные сетевые запросы
```

### Паттерн Ручного Кеширования

```typescript
// store/discoveryStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DiscoveryState {
  discovery: AuthSession.DiscoveryDocument | null;
  setDiscovery: (discovery: AuthSession.DiscoveryDocument) => void;
}

export const useDiscoveryStore = create(
  persist<DiscoveryState>(
    (set) => ({
      discovery: null,
      setDiscovery: (discovery) => set({ discovery })
    }),
    {
      name: "discovery-storage"
    }
  )
);

// Использование
const discovery = await fetchDiscoveryDocument();
useDiscoveryStore.getState().setDiscovery(discovery);
```

---

## 8. Реальный Поток с Discovery

### Полный Поток Аутентификации

```
1. ПРИЛОЖЕНИЕ ЗАПУСКАЕТСЯ
   ↓
2. useAutoDiscovery(keycloakURL/realms/{realm})
   ├─ Выбирает .well-known/openid-configuration
   ├─ Получает все URL endpoint'ов
   └─ Кеширует для последующего использования
   ↓
3. ПОЛЬЗОВАТЕЛЬ НАЖИМАЕТ ВХОД
   ↓
4. useAuthRequest с discovery
   ├─ authorizationEndpoint: discovery.authorization_endpoint
   ├─ tokenEndpoint: discovery.token_endpoint
   └─ Готово к аутентификации
   ↓
5. БРАУЗЕР ОТКРЫВАЕТСЯ
   └─ Переходит на discovery.authorization_endpoint
   ↓
6. ПОЛЬЗОВАТЕЛЬ ВВОДИТ УЧЕТНЫЕ ДАННЫЕ
   └─ Keycloak проверяет
   ↓
7. ВОЗВРАЩЕН КОД АВТОРИЗАЦИИ
   ↓
8. ОБМЕН КОДА НА ТОКЕНЫ
   └─ POST на discovery.token_endpoint
   ├─ Отправить: code + client_id + redirect_uri
   └─ Получить: access_token + refresh_token + id_token
   ↓
9. ВАЛИДАЦИЯ ТОКЕНА (опционально)
   └─ Выбрать публичные ключи из discovery.jwks_uri
   ├─ Проверить подпись токена
   ├─ Проверить время истечения
   └─ Подтвердить, что issuer совпадает с discovery.issuer
   ↓
10. ПОЛЬЗОВАТЕЛЬ АУТЕНТИФИЦИРОВАН ✓
    ├─ Токены сохранены безопасно
    ├─ Пользователь вошел
    └─ Данные приложения доступны
```

---

## 9. Решение Проблем Discovery

### Распространенные Проблемы

#### Проблема 1: Discovery Endpoint Не Найден

```
Ошибка: Failed to fetch discovery document
Причина: Неправильный realm или URL Keycloak

Решение:
const correctUrl = `${keycloakURL}/realms/${realm}`;
// Проверить, что .well-known/openid-configuration доступен
// curl http://localhost:8080/realms/fusion-test/.well-known/openid-configuration
```

#### Проблема 2: CORS Ошибки

```
Ошибка: CORS policy blocked request

Решение:
// Конфигурировать CORS в настройках realm Keycloak
// Или использовать proxy для разработки

// В разработке
const proxyUrl = "/api/keycloak";
const discovery = useAutoDiscovery(
  `${proxyUrl}/realms/${realm}`
);
```

#### Проблема 3: Discovery Возвращает Null

```typescript
const discovery = useAutoDiscovery(url);

// Ждать загрузки discovery
if (discovery === null) {
  return <LoadingSpinner />;
}

// Теперь безопасно использовать
const tokenEndpoint = discovery.tokenEndpoint;
```

---

## 10. Резюме: Преимущества Discovery

### Решенные Проблемы ✅

| Проблема                    | Решение                         |
| --------------------------- | ------------------------------- |
| Хардкодированные endpoint'ы | Автоматическое обнаружение      |
| Привязка к провайдеру       | Работает с любым OAuth 2.0/OIDC |
| Ручная конфигурация         | Zero-конфигурация               |
| Изменения endpoint'ов       | Автоматически обнаруживаются    |
| Ротация ключей безопасности | Автоматическое обновление JWKS  |
| Multi-environment настройка | Один codebase, разные realms    |
| Изоляция тестирования       | Отдельный test realm            |

### Ключевые Выводы 🎯

```
1. Discovery автоматически предоставляет все OAuth endpoint'ы
   └─ Не нужно хардкодировать

2. Работает с любым RFC 8414 совместимым провайдером
   └─ Keycloak, Auth0, Azure AD, и т.д.

3. Включает multi-environment настройку
   └─ dev/staging/prod с отдельными realms

4. Предоставляет преимущества безопасности
   └─ Автоматическая ротация ключей и валидация

5. Упрощает тестирование
   └─ Изолированный test realm без влияния на разработку

6. Design, устойчивый к будущему
   └─ Адаптируется, если провайдер изменится
```

---

## Ссылки

- [RFC 8414 - OAuth 2.0 Authorization Server Metadata](https://tools.ietf.org/html/rfc8414)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- [Документация Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Конфигурация Keycloak OIDC](https://www.keycloak.org/docs/latest/securing_apps/#oidc)
