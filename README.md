# Backend Development Fundamentals — Lab Reports

**Koppula Jashwanth Reddy** · Registration number **252U1R9072** · Section **CSE (GEN.AI)**

Course: Backend Development Fundamentals — Year II Term II — Aurora
Faculty: Joel Prashanth D

This repository holds one folder per lab for the course. Each folder is a self-contained project with its own `README.md`, source code, and screenshots.

## Lab index

| Lab | Title | Topics | Folder |
|---|---|---|---|
| Lab 01 | Node.js and Express server | Node.js `http` module, Express routing, status codes, 404 handling | [`lab-01/`](./lab-01) |
| Lab 02 | SQLite database and CRUD routes | SQLite, `sqlite`/`sqlite3`, parameterised queries, REST CRUD, status codes | [`lab-02/`](./lab-02) |
| Lab 03 | REST API, query parameters, validation | Search, sorting, pagination, price filters, input validation, consistent errors | [`lab-03/`](./lab-03) |

## Running any lab

```bash
cd lab-03
npm install
npm start
```

Each lab's `README.md` documents its own endpoints, environment variables and screenshots.

## Rules followed in every lab

- `node_modules` is never committed; each folder has a `.gitignore`.
- `.env` files are never committed and contain no real values in the repository.
- Every route returns the correct HTTP status code.
- Database queries use parameterised statements, never string concatenation with user input.
