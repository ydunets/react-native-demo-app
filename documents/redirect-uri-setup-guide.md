# 📋 Руководство по настройке Redirect URI для Expo + Keycloak

## 1️⃣ **Понимание Redirect URI в Expo**

Expo генерирует redirect URI автоматически на основе:
- **App Slug** (из app.json)
- **Platform** (iOS/Android/Web)
- **Environment** (development/production)

**Формат:** `{app-slug}://oauth2callback`

## 2️⃣ **Найти ваш App Slug**

Проверьте файл `app.json`:
```json
{
  "expo": {
    "name": "Expo App Presentation",
    "slug": "expo-app-presentation"  // ← Это ваш slug
  }
}
```

## 3️⃣ **Определить возможные Redirect URI**

Для приложения `expo-app-presentation`:

**Development (Expo Dev Server):**
```
expo-app-presentation://oauth2callback
exp://localhost:19000/oauth2callback
exp://localhost:8081/oauth2callback
exp://192.168.x.x:19000/oauth2callback
```

**Production/Standalone:**
```
expo-app-presentation://oauth2callback
com.yourcompany.expoapppresentation://oauth2callback
```

## 4️⃣ **Настройка в Keycloak Admin Console**

1. **Откройте Keycloak Admin Console:**
   ```
   http://localhost:8080/admin
   ```

2. **Перейдите к Client:**
   - Выберите realm (`expo-app-realm`)
   - Clients → `expo-app`

3. **Добавьте Redirect URIs:**
   ```
   expo-app-presentation://*
   exp://localhost:*
   exp://192.168.*:*
   exp://10.*:*
   http://localhost:*
   ```

## 5️⃣ **Настройка через REST API**

```bash
# Получить admin токен
ACCESS_TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin_password" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Получить Client UUID
CLIENT_UUID=$(curl -s -X GET "http://localhost:8080/admin/realms/expo-app-realm/clients?clientId=expo-app" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].id')

# Обновить Redirect URIs
curl -X PUT "http://localhost:8080/admin/realms/expo-app-realm/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "redirectUris": [
      "expo-app-presentation://*",
      "exp://localhost:*/*",
      "exp://192.168.*:*/*",
      "exp://10.*:*/*",
      "http://localhost:*/*"
    ]
  }'
```

## 6️⃣ **Проверка в React Native коде**

Добавьте логирование в `auth.tsx`:
```typescript
const redirectUri = AuthSession.makeRedirectUri({ path: 'oauth2callback' });
console.log("Generated Redirect URI:", redirectUri);
```

## 7️⃣ **Тестирование Redirect URI**

```bash
# Проверить что URI принимается
curl -I "http://localhost:8080/realms/expo-app-realm/protocol/openid-connect/auth?client_id=expo-app&response_type=code&scope=openid&redirect_uri=expo-app-presentation://oauth2callback"
```

**Ожидаемый результат:** HTTP 302 (redirect), НЕ 400 (Bad Request)

## 8️⃣ **Распространенные проблемы и решения**

| Проблема | Причина | Решение |
|----------|---------|---------|
| `invalid_redirect_uri` | URI не в списке разрешенных | Добавьте точный URI в Keycloak |
| `Invalid parameter redirect URI` | Неправильный формат URI | Проверьте app slug и схему |
| URI генерируется неправильно | Неправильные настройки Expo | Проверьте app.json и схему |

## 9️⃣ **Best Practices**

**Для Development:**
```json
"redirectUris": [
  "expo-app-presentation://*",
  "exp://localhost:*",
  "exp://192.168.*:*",
  "http://localhost:*"
]
```

**Для Production:**
```json
"redirectUris": [
  "expo-app-presentation://oauth2callback",
  "com.yourcompany.expoapppresentation://oauth2callback"
]
```

## 🔟 **Проверочный чеклист**

- [ ] App slug правильный в `app.json`
- [ ] Keycloak client настроен с правильными redirect URIs
- [ ] SSL отключен для development (`sslRequired: "NONE"`)
- [ ] PKCE включен (`usePKCE: true`)
- [ ] Логирование показывает правильный redirect URI
- [ ] Тестовый запрос к auth endpoint возвращает 302, не 400

## 🎯 **Для вашего проекта**

**Актуальные настройки:**
- **Realm:** `expo-app-realm`
- **Client ID:** `expo-app`
- **App Slug:** `expo-app-presentation`
- **Generated Redirect URI:** `expo-app-presentation://oauth2callback`

**Команды для быстрой настройки:**
```bash
# Получить токен
ACCESS_TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin_password" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Получить Client UUID
CLIENT_UUID=$(curl -s -X GET "http://localhost:8080/admin/realms/expo-app-realm/clients?clientId=expo-app" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].id')

# Установить redirect URIs
curl -X PUT "http://localhost:8080/admin/realms/expo-app-realm/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"redirectUris": ["expo-app-presentation://*", "*"]}'
```

Этот гайд должен помочь вам правильно настроить redirect URI для любого Expo приложения с Keycloak! 🎯