DROP TABLE IF EXISTS book;

CREATE TABLE book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

INSERT INTO book (title, author, price, pages) VALUES
  ('The Alchemist', 'Paulo Coelho', 299, 208),
  ('Wings of Fire', 'A. P. J. Abdul Kalam', 250, 180),
  ('Clean Code', 'Robert C. Martin', 899, 464),
  ('The Pragmatic Programmer', 'Andrew Hunt', 799, 352),
  ('Atomic Habits', 'James Clear', 499, 320),
  ('Deep Work', 'Cal Newport', 450, 296),
  ('The Monk Who Sold His Ferrari', 'Robin Sharma', 275, 198),
  ('Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 336),
  ('Ikigai', 'Hector Garcia', 320, 208),
  ('You Can Win', 'Shiv Khera', 295, 288);
