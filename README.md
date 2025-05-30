
## 📘 Hills Quills Backend – Documentation

A TypeScript-based backend for a content publishing system using Express.js, MySQL, and Docker, featuring author/admin authentication, article workflows, and public APIs.

---

### 🐳 Docker Setup

#### ✅ Prerequisites:

* Docker
* Docker Compose
* Node.js + npm (for development without Docker)

#### 📦 Start the containers:

```bash
docker-compose up --build
```

This starts:

* `app`: your TypeScript Node.js backend.
* `mysql_db`: MySQL 8+ instance.

---

### 🗃️ Initial Database Setup

If database tables are missing:

```bash
docker exec -it mysql_db mysql -u user -p hills_quills
# Then inside MySQL shell:
source /docker-entrypoint-initdb.d/tables.sql;
source /docker-entrypoint-initdb.d/data.sql;
```

Use these scripts to bootstrap all necessary tables and insert article test data.

---

### 🧪 Bulk Testing Data

You can use this SQL snippet to insert 16 articles for testing bulk delete, approve, top/unmark routes. These cover:

* `3–5`: delete
* `6–8`: approve
* `9–11`: mark as top
* `12–14`: unmark top
* `15–16`: trending/search testing

Run this via MySQL or attach it to your data seeder:

```sql
-- Start inserting from ID = 3
INSERT INTO articles (id, author_id, title, description, content, category, region, status, is_top_news, views_count, publish_date)
VALUES
-- 3, 4, 5 (for delete test)
(3, 1, 'Delete Test 1', 'To be deleted', 'Content to delete', 'Breaking News', 'Dehradun', 'pending', FALSE, 10, NOW()),
(4, 1, 'Delete Test 2', 'To be deleted', 'Content to delete', 'Breaking News', 'Haridwar', 'pending', FALSE, 15, NOW()),
(5, 2, 'Delete Test 3', 'To be deleted', 'Content to delete', 'Breaking News', 'Rishikesh', 'pending', FALSE, 5, NOW()),

-- 6, 7, 8 (for approve test)
(6, 2, 'Approve Test 1', 'To be approved', 'Approve this content', 'Hill Stations', 'Nainital', 'pending', FALSE, 20, NOW()),
(7, 3, 'Approve Test 2', 'To be approved', 'Approve this content', 'Culture & Heritage', 'Mussoorie', 'pending', FALSE, 30, NOW()),
(8, 3, 'Approve Test 3', 'To be approved', 'Approve this content', 'Food & Cuisine', 'Almora', 'pending', FALSE, 12, NOW()),

-- 9, 10, 11 (mark top news)
(9, 1, 'Top News Test 1', 'To be marked top', 'Content for top news', 'Local Festivals', 'Pauri Garhwal', 'approved', FALSE, 50, NOW()),
(10, 2, 'Top News Test 2', 'To be marked top', 'Top news story', 'Government Initiatives', 'Tehri Garhwal', 'approved', FALSE, 42, NOW()),
(11, 3, 'Top News Test 3', 'To be marked top', 'More top news', 'Transportation', 'Uttarkashi', 'approved', FALSE, 60, NOW()),

-- 12, 13, 14 (already marked as top news, for unmark test)
(12, 2, 'Already Top 1', 'Already top news', 'Featured article', 'Seasonal Tourism', 'Chamoli', 'approved', TRUE, 80, NOW()),
(13, 3, 'Already Top 2', 'Already top news', 'Trending top', 'Trekking & Hiking', 'Char Dham', 'approved', TRUE, 95, NOW()),
(14, 1, 'Already Top 3', 'Already top news', 'Hot top article', 'Pilgrimage', 'Valley of Flowers', 'approved', TRUE, 100, NOW()),

-- 15, 16 (search and trending)
(15, 1, 'Mussoorie Travel Guide', 'Explore Mussoorie', 'Beautiful hill station', 'Travel Guide', 'Mussoorie', 'approved', FALSE, 300, NOW() - INTERVAL 2 DAY),
(16, 2, 'Nainital Adventure', 'Adventure in the hills', 'Adventurous trip content', 'Adventure Tourism', 'Nainital', 'approved', FALSE, 500, NOW() - INTERVAL 1 DAY);

```

---
⚠️ Known Issues
These routes are currently not working — they do not even trigger console.log() inside their controller.

🔁 Bulk Admin Routes Not Working:
Method	Route	Status	Problem
POST	/articles/admin/bulk/top	❌	Controller not hit
DELETE	/articles/admin/bulk/top	❌	Controller not hit
POST	/articles/admin/bulk/approve	❌	Controller not hit


### 🔁 Route Overview

#### ✅ Auth Routes

* `POST /api/auth/admin/signup` / `login`
* `POST /api/auth/authors/signup` / `login`

---

### 🔐 Admin Routes (Token Required)

#### 📌 Bulk Article Admin Actions

| Method   | Route                          | Description                                 |
| -------- | ------------------------------ | ------------------------------------------- |
| `POST`   | `/articles/admin/bulk/delete`  | Delete multiple articles                    |
| `POST`   | `/articles/admin/bulk/approve` | Approve multiple pending articles           |
| `POST`   | `/articles/admin/bulk/top`     | Mark multiple approved articles as top news |
| `DELETE` | `/articles/admin/bulk/top`     | Unmark multiple top news articles           |

> ⚠️ Make sure articles have correct status. E.g., only pending → approved allowed.

---

### 🌍 Public Routes (No Auth Required)

| Route                                           | Description                           |
| ----------------------------------------------- | ------------------------------------- |
| `GET /public/articles`                          | Get all public articles               |
| `GET /public/articles/search?query=xyz`         | Search fulltext                       |
| `GET /public/articles/top`                      | Top news                              |
| `GET /public/articles/trending`                 | Trending                              |
| `GET /public/articles/region/:region`           | Filter by region                      |
| `GET /public/articles/from-districts`           | (renamed to region-based)             |
| `GET /public/articles/from-districts/:district` | Alias to region, use `region` instead |

> ✅ You can remove or alias `from-districts` to use `region` if there's no separate `district` column.

---

### 🧪 Postman Testing

Import the attached Postman collection:

📁 `hiills-quill-api-testing.postman_collection.json`

Contains prebuilt requests:

* Admin login/signup
* Author login/signup
* Article CRUD
* Bulk operations
* Trending / Search / Region

Set environment variables:

```env
baseUrl = http://localhost:3000
adminToken = <your_admin_jwt>
authorToken = <your_author_jwt>
```

---

### 🐞 Debugging Guide

* ✅ Use `console.log()` inside each controller to confirm if route is hit.
* ❌ If routes are not working (e.g. `/bulk/top`), confirm:

  * Routes are mounted in `articles.route.ts` like:

    ```ts
    adminRouter.post('/bulk/top', authenticate, requireAdmin, bulkMarkTopNews);
    ```
  * Ensure `adminRouter` is registered in `app.ts`

    ```ts
    app.use('/articles/admin', adminRouter);
    ```
* Check if route `middleware` is blocking request (missing auth, bad token).

---

### 🛠 Scripts (Optional)

#### Seed Script

If using a TS/Node seed script:

```bash
ts-node src/database/seed.ts
```

Use this to programmatically insert articles.

---

### 📚 Future Improvements

* Add `district` column if needed separately.
* Improve per-ID error reporting in bulk operations.
* Implement soft delete (`is_deleted`) flag.

---
