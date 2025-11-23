# API Examples - Примеры использования Library API

Этот файл содержит практические примеры вызовов API для тестирования всех функций библиотечной системы.

## Базовый URL
```
http://localhost:8080/api/v1
```

## 1. Проверка работоспособности

```bash
curl http://localhost:8080/health
```

**Ожидаемый ответ:**
```json
{
  "status": "OK",
  "service": "library-api"
}
```

## 2. Аутентификация

### Регистрация нового библиотекаря

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@library.com",
    "password": "admin123"
  }'
```

**Ответ:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Регистрация прошла успешно"
}
```

### Вход в систему

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@library.com",
    "password": "admin123"
  }'
```

**Сохраните токен из ответа для использования в следующих запросах:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 3. Управление книгами

### Создание книги (защищенный эндпоинт)

```bash
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Война и мир",
    "author": "Лев Толстой",
    "publication_year": 1869,
    "isbn": "978-5-389-07960-1",
    "copies_count": 3,
    "description": "Роман-эпопея Льва Толстого о жизни русского общества в эпоху наполеоновских войн"
  }'
```

### Создание еще нескольких книг

```bash
# Преступление и наказание
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Преступление и наказание",
    "author": "Фёдор Достоевский",
    "publication_year": 1866,
    "isbn": "978-5-17-066373-3",
    "copies_count": 2,
    "description": "Роман о моральных и психологических терзаниях Родиона Раскольникова"
  }'

# Мастер и Маргарита
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Мастер и Маргарита",
    "author": "Михаил Булгаков",
    "publication_year": 1967,
    "isbn": "978-5-17-085345-1",
    "copies_count": 1,
    "description": "Роман о дьяволе, который посещает атеистический Советский Союз"
  }'
```

### Получить список всех книг (публичный)

```bash
curl http://localhost:8080/api/v1/books
```

### Получить список книг с пагинацией

```bash
curl "http://localhost:8080/api/v1/books?limit=2&offset=0"
```

### Получить конкретную книгу (сохраните ID из предыдущих ответов)

```bash
# Замените BOOK_ID на реальный UUID из ответа создания книги
export BOOK_ID="ваш-book-id-здесь"
curl http://localhost:8080/api/v1/books/$BOOK_ID
```

### Обновить книгу

```bash
curl -X PUT http://localhost:8080/api/v1/books/$BOOK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "copies_count": 5,
    "description": "Обновленное описание книги"
  }'
```

## 4. Управление читателями

### Создать читателей

```bash
# Первый читатель
curl -X POST http://localhost:8080/api/v1/readers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Анна Петрова",
    "email": "anna.petrova@email.com"
  }'

# Второй читатель
curl -X POST http://localhost:8080/api/v1/readers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Иван Сидоров",
    "email": "ivan.sidorov@email.com"
  }'

# Третий читатель
curl -X POST http://localhost:8080/api/v1/readers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Мария Иванова",
    "email": "maria.ivanova@email.com"
  }'
```

### Получить список читателей

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/readers
```

### Получить конкретного читателя

```bash
# Замените READER_ID на реальный UUID
export READER_ID="ваш-reader-id-здесь"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/readers/$READER_ID
```

### Обновить читателя

```bash
curl -X PUT http://localhost:8080/api/v1/readers/$READER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Анна Петровна Смирнова",
    "email": "anna.smirnova@email.com"
  }'
```

## 5. Выдача и возврат книг

### Выдать книгу читателю

```bash
curl -X POST http://localhost:8080/api/v1/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID'",
    "reader_id": "'$READER_ID'"
  }'
```

### Выдать несколько книг одному читателю (для тестирования лимитов)

```bash
# Получите ID других книг и выдайте их тому же читателю
# Это поможет протестировать лимит в 3 книги

# Вторая книга
curl -X POST http://localhost:8080/api/v1/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID_2'",
    "reader_id": "'$READER_ID'"
  }'

# Третья книга
curl -X POST http://localhost:8080/api/v1/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID_3'",
    "reader_id": "'$READER_ID'"
  }'

# Четвертая книга - должна вернуть ошибку "максимальное количество книг"
curl -X POST http://localhost:8080/api/v1/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID_4'",
    "reader_id": "'$READER_ID'"
  }'
```

### Получить список книг, взятых читателем

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/borrow/reader/$READER_ID
```

### Вернуть книгу

```bash
curl -X POST http://localhost:8080/api/v1/borrow/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID'",
    "reader_id": "'$READER_ID'"
  }'
```

### Попытка вернуть книгу, которая не была взята (должна вернуть ошибку)

```bash
curl -X POST http://localhost:8080/api/v1/borrow/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID'",
    "reader_id": "'$READER_ID'"
  }'
```

## 6. Тестирование ошибок

### Попытка доступа без токена

```bash
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Тест без токена",
    "author": "Автор"
  }'
```

**Ожидаемый ответ: 401 Unauthorized**

### Попытка доступа с неверным токеном

```bash
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token" \
  -d '{
    "title": "Тест с неверным токеном",
    "author": "Автор"
  }'
```

**Ожидаемый ответ: 401 Unauthorized**

### Попытка создать книгу с дублирующимся ISBN

```bash
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Другая книга",
    "author": "Другой автор",
    "isbn": "978-5-389-07960-1"
  }'
```

**Ожидаемый ответ: 409 Conflict - "книга с таким ISBN уже существует"**

### Попытка создать читателя с дублирующимся email

```bash
curl -X POST http://localhost:8080/api/v1/readers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Другое имя",
    "email": "anna.petrova@email.com"
  }'
```

**Ожидаемый ответ: 409 Conflict - "читатель с таким email уже существует"**

### Валидация: невалидные данные

```bash
# Неверный email
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "123"
  }'

# Слишком короткий пароль
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123"
  }'

# Отрицательное количество копий
curl -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Тест",
    "author": "Автор",
    "copies_count": -1
  }'
```

## 7. Полный сценарий тестирования

Вот полный скрипт для автоматизированного тестирования:

```bash
#!/bin/bash

# 1. Проверка здоровья
echo "1. Проверка здоровья API..."
curl http://localhost:8080/health

# 2. Регистрация
echo -e "\n2. Регистрация библиотекаря..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@library.com",
    "password": "password123"
  }')

echo $REGISTER_RESPONSE

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "Токен: $TOKEN"

# 3. Создание книги
echo -e "\n3. Создание книги..."
BOOK_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Тестовая книга",
    "author": "Тестовый автор",
    "copies_count": 2
  }')

echo $BOOK_RESPONSE
BOOK_ID=$(echo $BOOK_RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

# 4. Создание читателя
echo -e "\n4. Создание читателя..."
READER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/readers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Тестовый читатель",
    "email": "reader@test.com"
  }')

echo $READER_RESPONSE
READER_ID=$(echo $READER_RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

# 5. Выдача книги
echo -e "\n5. Выдача книги..."
BORROW_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/borrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID'",
    "reader_id": "'$READER_ID'"
  }')

echo $BORROW_RESPONSE

# 6. Просмотр взятых книг
echo -e "\n6. Просмотр взятых книг..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/borrow/reader/$READER_ID

# 7. Возврат книги
echo -e "\n7. Возврат книги..."
RETURN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/borrow/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_ID'",
    "reader_id": "'$READER_ID'"
  }')

echo $RETURN_RESPONSE

echo -e "\n✅ Тестирование завершено!"
```

Сохраните этот скрипт как `test_api.sh` и запустите:

```bash
chmod +x test_api.sh
./test_api.sh
```

## Заключение

Эти примеры покрывают все основные сценарии использования API:

- ✅ Аутентификация и авторизация
- ✅ CRUD операции для всех сущностей
- ✅ Бизнес-логика выдачи/возврата книг
- ✅ Обработка ошибок и валидация
- ✅ Защищенные и публичные эндпоинты

Используйте их для тестирования и понимания работы API!