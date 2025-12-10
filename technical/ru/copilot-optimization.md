# Оптимизация Premium-запросов Copilot

Стратегии для снижения количества premium-запросов при использовании Copilot Chat и Copilot CLI вместе.

## Стратегии оптимизации premium-запросов

### 1. Эффективное управление контекстом

**Используйте `#codebase` вместо множественных файлов:**
```bash
# ❌ Плохо - много отдельных запросов
"Explain file1.tsx"
"Explain file2.tsx"  
"Explain file3.tsx"

# ✅ Хорошо - один запрос с codebase search
"Explain how authentication works across #codebase"
```

**Группируйте связанные вопросы:**
```bash
# ✅ Один запрос вместо трех
"How does token refresh work in #codebase? Include error handling and retry logic"
```

### 2. Используйте планирование и чекпоинты

**Planning Mode** — создает план без выполнения:
- Меньше итераций
- Один запрос на планирование вместо множества пробных

**Checkpoints** — возврат к предыдущему состоянию без повторных запросов

### 3. Используйте @-mentions для простых задач

**Для простых вопросов используйте специализированных помощников:**
```bash
# ✅ Используйте @vscode для вопросов о VS Code (не premium)
"@vscode how to configure settings"

# ✅ Используйте @terminal для команд (не premium)
"@terminal find large files"
```

### 4. Оптимизируйте размер контекста

**Включайте только нужные файлы:**
```bash
# ❌ Плохо - весь проект
"Refactor this" #codebase

# ✅ Хорошо - конкретные файлы
"Refactor authentication logic" #auth.tsx #token.ts
```

**Используйте символы вместо целых файлов:**
```bash
# ✅ Упоминайте конкретные функции/классы
"Explain #refreshToken function"
```

### 5. Используйте Inline Chat для локальных изменений

**Inline Chat** часто эффективнее для небольших изменений:
- Меньше контекста
- Более целенаправленные запросы
- Меньше premium-запросов

### 6. Batch-запросы в одном сообщении

```bash
# ✅ Один запрос с несколькими задачами
"Review #auth.tsx for:
1. Security vulnerabilities
2. Performance issues  
3. Code style consistency
4. Suggest improvements"
```

### 7. Используйте локальные модели когда возможно

**Настройте Language Models:**
- Используйте локальные модели для простых задач
- Оставляйте premium для сложных задач

### 8. Переиспользуйте ответы

**Сохраняйте полезные ответы:**
- Копируйте решения в документацию
- Создавайте шаблоны для повторяющихся задач
- Используйте Custom Instructions для стандартных паттернов

### 9. Используйте Agents эффективно

**Agents могут быть эффективнее:**
- Автоматически определяют нужный контекст
- Используют инструменты оптимально
- Меньше ручных итераций

### 10. Избегайте избыточных запросов

```bash
# ❌ Плохо - множественные уточнения
"Explain this"
"What about error handling?"
"And performance?"
"And security?"

# ✅ Хорошо - один детальный запрос
"Explain this code including error handling, performance considerations, and security implications"
```

## Практические примеры для React Native проекта

**Для React Native проекта:**

```bash
# ✅ Эффективный запрос
"Review token refresh implementation in #codebase. Check:
- Error handling for network failures
- Token expiration logic  
- Background refresh strategy
- Security best practices"

# ✅ Используйте конкретные файлы
"Optimize #useRefreshTokens.tsx for better error recovery and retry logic"
```

## Мониторинг использования

- Отслеживайте количество запросов в настройках Copilot
- Используйте Chat Debug View для анализа контекста
- Оптимизируйте на основе статистики использования

## Ключевые выводы

✅ **Группируйте связанные вопросы** в один запрос  
✅ **Используйте `#codebase`** для широкого поиска вместо множественных чтений файлов  
✅ **Используйте @-mentions** для простых задач (не premium)  
✅ **Оптимизируйте размер контекста** - включайте только необходимые файлы  
✅ **Используйте Inline Chat** для небольших локальных изменений  
✅ **Объединяйте несколько задач** в один запрос  
✅ **Переиспользуйте ответы** и создавайте шаблоны  
✅ **Используйте Planning mode** для уменьшения итераций  

---

**Ссылка:** [VS Code Documentation - Manage context for AI](https://code.visualstudio.com/docs/copilot/chat/copilot-chat-context)

