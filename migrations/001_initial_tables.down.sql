-- Удаляем таблицы в обратном порядке (учитываем внешние ключи)
DROP TABLE IF EXISTS borrowed_books;
DROP TABLE IF EXISTS readers;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;