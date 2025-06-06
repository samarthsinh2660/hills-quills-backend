# 📘 Hills Quills Backend

A robust TypeScript backend for a content publishing system built with Express.js, MySQL, and Docker. This system features secure author/admin authentication, detailed article workflows, and comprehensive public APIs for publishing and browsing content.

---

## 🚀 Features

- **Authentication**: JWT-based login and signup for admins and authors.
- **Role-based Access**: Separate routes and permissions for admins and authors.
- **Article Management**: CRUD operations, approval workflows, and bulk actions.
- **Bulk Admin Actions**: Approve, delete, mark/unmark top news for multiple articles.
- **Public APIs**: Browse, search, filter by region, trending, and top articles.
- **Testing Data**: Seed scripts and SQL for bulk data testing.
- **Dockerized Development**: Simple setup for local and production environments.

---

## 🖥️ Technologies Used

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MySQL 8+
- **ORM/Query**: (Add if using Sequelize/TypeORM/Knex, else native)
- **Containerization**: Docker, Docker Compose

---

## 🐳 Quick Start

### ✅ Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js & npm](https://nodejs.org/) (for development outside Docker)

### 📦 Start with Docker

```bash
docker-compose up --build
```

This starts:
- `app`: The TypeScript Node.js backend.
- `mysql_db`: MySQL 8+ database.

### 🗃️ Initial Database Setup

If tables are missing, run:
```bash
docker exec -it mysql_db mysql -u user -p hills_quills
# Then inside MySQL shell:
source /docker-entrypoint-initdb.d/tables.sql;
source /docker-entrypoint-initdb.d/data.sql;
```

### 🧪 Seed Test Data

- Use provided SQL scripts to insert bulk articles for testing deletion, approval, top/unmark, and trending/search routes.
- Alternatively, run the TypeScript seed script:

```bash
ts-node src/database/seed.ts
```

---

## 🏁 Running Locally (Without Docker)

```bash
npm install
cp .env.example .env
# Edit .env for your local DB credentials
npm run build
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file and set:

```
DB_HOST=localhost
DB_USER=youruser
DB_PASSWORD=yourpassword
DB_NAME=hills_quills
JWT_SECRET=<your_secret>
PORT=3000
```

---

## 🔗 API Overview

### ✅ Auth Routes

- `POST /api/auth/admin/signup` – Admin signup
- `POST /api/auth/admin/login` – Admin login
- `POST /api/auth/authors/signup` – Author signup
- `POST /api/auth/authors/login` – Author login

### 🔐 Admin Routes (JWT Token Required)

| Method   | Route                          | Description                                 |
|----------|------------------------------- |---------------------------------------------|
| POST     | /articles/admin/bulk/delete    | Delete multiple articles                    |
| POST     | /articles/admin/bulk/approve   | Approve multiple pending articles           |
| POST     | /articles/admin/bulk/top       | Mark multiple articles as top news          |
| DELETE   | /articles/admin/bulk/top       | Unmark multiple top news articles           |

### 🌍 Public Routes

| Route                                     | Description                   |
|--------------------------------------------|-------------------------------|
| GET /public/articles                      | Get all public articles       |
| GET /public/articles/search?query=xyz     | Search articles (fulltext)    |
| GET /public/articles/top                  | Top news articles             |
| GET /public/articles/trending             | Trending articles             |
| GET /public/articles/region/:region       | Articles by region            |

---

## 🧪 Testing with Postman

Import `hiills-quill-api-testing.postman_collection.json` for ready-to-use requests.

Set environment variables in Postman:

```
baseUrl = http://localhost:3000
adminToken = <your_admin_jwt>
authorToken = <your_author_jwt>
```

---

## 🐞 Debugging Tips

- Use `console.log()` in controllers to verify route hits.
- Ensure routes are mounted in `articles.route.ts` and registered in `app.ts`.
- Check for middleware issues (auth, token).

---

## 📚 Future Improvements

- Add `district` column if needed.
- Improve error reporting for bulk operations.
- Consider soft-delete (`is_deleted` flag).

---

## 🤝 Contributing

1. Fork this repo
2. Create your feature branch (`git checkout -b feature/FeatureName`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/FeatureName`)
5. Open a pull request

---

## 📄 License

MIT
