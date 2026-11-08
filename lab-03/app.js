// Lab 3: REST API with query parameters, validation and correct status codes.
// createApp(db) is exported so the app can be started by index.js or a test file.
const express = require("express");

const SORTABLE_COLUMNS = ["id", "title", "author", "price", "pages"];
const SORT_ORDERS = ["ASC", "DESC"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Anything thrown as an ApiError becomes a clean { message } response.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 does not catch rejected promises, so every async route goes through this.
const wrap = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

// ?x=a&x=b arrives as an array, ?x[k]=v arrives as an object: keep only plain text.
const firstValue = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) return value.length > 0 ? String(value[0]) : fallback;
  if (typeof value === "object") return fallback;
  return String(value);
};

const parseIntegerValue = (text, name, { min, max }) => {
  if (!/^-?\d+$/.test(text)) throw new ApiError(400, `${name} must be an integer`);
  const value = Number(text);
  if (min !== undefined && value < min) throw new ApiError(400, `${name} must be at least ${min}`);
  if (max !== undefined && value > max) throw new ApiError(400, `${name} must be at most ${max}`);
  return value;
};

const parseIntegerParam = (raw, name, { min, max, fallback }) => {
  const text = firstValue(raw).trim();
  if (text === "") return fallback;
  return parseIntegerValue(text, name, { min, max });
};

const parseOptionalInteger = (raw, name, { min }) => {
  const text = firstValue(raw).trim();
  if (text === "") return null;
  return parseIntegerValue(text, name, { min });
};

const validateBook = (body) => {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Request body must be a JSON object");
  }

  const { title, author, price, pages } = body;

  if (typeof title !== "string" || title.trim() === "") {
    throw new ApiError(400, "title is required and must be a non-empty string");
  }
  if (typeof author !== "string" || author.trim() === "") {
    throw new ApiError(400, "author is required and must be a non-empty string");
  }
  // The column is INTEGER, so decimals are rejected here as well as in min_price/max_price.
  if (!Number.isInteger(price) || price <= 0) {
    throw new ApiError(400, "price must be a positive integer");
  }
  if (!Number.isInteger(pages) || pages <= 0) {
    throw new ApiError(400, "pages must be a positive integer");
  }

  return { title: title.trim(), author: author.trim(), price, pages };
};

const isNumericId = (value) => /^\d+$/.test(value);

const createApp = (db) => {
  const app = express();

  app.disable("x-powered-by");
  app.set("json spaces", 2);
  app.use(express.json());

  // 1. GET /books/ - list with search, sorting, price range and pagination
  app.get(
    "/books/",
    wrap(async (request, response) => {
      const search_q = firstValue(request.query.search_q).trim();

      const order_by = firstValue(request.query.order_by, "id").trim() || "id";
      if (!SORTABLE_COLUMNS.includes(order_by)) {
        throw new ApiError(400, `order_by must be one of: ${SORTABLE_COLUMNS.join(", ")}`);
      }

      const order = (firstValue(request.query.order, "ASC").trim() || "ASC").toUpperCase();
      if (!SORT_ORDERS.includes(order)) {
        throw new ApiError(400, "order must be ASC or DESC");
      }

      const limit = parseIntegerParam(request.query.limit, "limit", {
        min: 1,
        max: MAX_LIMIT,
        fallback: DEFAULT_LIMIT,
      });
      const offset = parseIntegerParam(request.query.offset, "offset", {
        min: 0,
        fallback: 0,
      });
      const min_price = parseOptionalInteger(request.query.min_price, "min_price", { min: 0 });
      const max_price = parseOptionalInteger(request.query.max_price, "max_price", { min: 0 });

      if (min_price !== null && max_price !== null && min_price > max_price) {
        throw new ApiError(400, "min_price cannot be greater than max_price");
      }

      // Only values go into the parameter list; column names come from the whitelist above.
      const filters = [];
      const values = [];
      if (search_q !== "") {
        filters.push("title LIKE ?");
        values.push(`%${search_q}%`);
      }
      if (min_price !== null) {
        filters.push("price >= ?");
        values.push(min_price);
      }
      if (max_price !== null) {
        filters.push("price <= ?");
        values.push(max_price);
      }
      const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

      const { total } = await db.get(`SELECT COUNT(*) AS total FROM book ${where};`, values);
      const books = await db.all(
        `SELECT * FROM book ${where} ORDER BY ${order_by} ${order} LIMIT ? OFFSET ?;`,
        [...values, limit, offset]
      );

      response.set("X-Total-Count", String(total));
      response.status(200).json(books);
    })
  );

  // 2. GET /books/:bookId/ - one book
  app.get(
    "/books/:bookId/",
    wrap(async (request, response) => {
      const { bookId } = request.params;
      if (!isNumericId(bookId)) {
        throw new ApiError(400, "bookId must be a number");
      }

      const book = await db.get(`SELECT * FROM book WHERE id = ?;`, [bookId]);
      if (!book) {
        throw new ApiError(404, `Book with id ${bookId} not found`);
      }
      response.status(200).json(book);
    })
  );

  // 3. POST /books/ - create
  app.post(
    "/books/",
    wrap(async (request, response) => {
      const book = validateBook(request.body);
      const result = await db.run(
        `INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);`,
        [book.title, book.author, book.price, book.pages]
      );
      response.status(201).json({ message: "Book created", bookId: result.lastID });
    })
  );

  // 4. PUT /books/:bookId/ - replace all fields
  app.put(
    "/books/:bookId/",
    wrap(async (request, response) => {
      const { bookId } = request.params;
      if (!isNumericId(bookId)) {
        throw new ApiError(400, "bookId must be a number");
      }

      const book = validateBook(request.body);
      const result = await db.run(
        `UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;`,
        [book.title, book.author, book.price, book.pages, bookId]
      );
      if (result.changes === 0) {
        throw new ApiError(404, `Book with id ${bookId} not found`);
      }
      response.status(200).json({ message: "Book updated" });
    })
  );

  // 5. DELETE /books/:bookId/ - remove
  app.delete(
    "/books/:bookId/",
    wrap(async (request, response) => {
      const { bookId } = request.params;
      if (!isNumericId(bookId)) {
        throw new ApiError(400, "bookId must be a number");
      }

      const result = await db.run(`DELETE FROM book WHERE id = ?;`, [bookId]);
      if (result.changes === 0) {
        throw new ApiError(404, `Book with id ${bookId} not found`);
      }
      response.status(200).json({ message: "Book deleted" });
    })
  );

  // Unknown route: the same JSON shape as every other error.
  app.use((request, response) => {
    response.status(404).json({ message: `Route not found: ${request.method} ${request.originalUrl}` });
  });

  // Central error handler: ApiError -> its status, everything else -> 500.
  app.use((error, request, response, next) => {
    if (error instanceof ApiError) {
      return response.status(error.status).json({ message: error.message });
    }
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return response.status(400).json({ message: "Invalid JSON body" });
    }
    console.error(error);
    return response.status(500).json({ message: "Internal server error" });
  });

  return app;
};

module.exports = { createApp, ApiError };
