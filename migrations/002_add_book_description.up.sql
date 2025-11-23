-- Добавляем поле description к таблице books
ALTER TABLE books ADD COLUMN description TEXT;

-- Обновляем существующие записи, добавляя описание по умолчанию
UPDATE books 
SET description = 'Описание добавлено автоматически при миграции' 
WHERE description IS NULL;