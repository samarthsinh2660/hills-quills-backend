import request from 'supertest';
import express from 'express';
import { GenericContainer } from 'testcontainers';
import mysql from 'mysql2/promise';
import adminRouter from '../../routes/admin.route.ts';
import { db } from '../../database/db.ts';
import { CREATE_ADMIN_TABLE_QUERY, ADMIN_TABLE } from '../../models/admin.model.ts';
import { createAuthToken } from '../../utils/jwt.ts';
import { AUTHOR_TABLE, CREATE_AUTHOR_TABLE } from '@models/author.model.ts';
import { ARTICLE_TABLE, CREATE_ARTICLE_TABLE } from '@models/article.model.ts';

let mockPool: any;
let container: any;
let app: express.Application;

jest.setTimeout(30000);

// Mock the database module
jest.mock('../../database/db.ts', () => ({
    get db() {
        return mockPool;
    }
}));

// Mock JWT secret for testing
jest.mock('../../config/env.ts', () => ({
    JWT_SECRET: 'test-secret',
}));

async function setupDatabase() {
    const connection = await mockPool.getConnection();
    await connection.query(CREATE_ADMIN_TABLE_QUERY);
    await connection.query(CREATE_AUTHOR_TABLE);
    await connection.query(CREATE_ARTICLE_TABLE);
    await connection.release();
}

async function tearDownDatabase() {
    const connection = await mockPool.getConnection();
    await connection.query(`DROP TABLE IF EXISTS ${ADMIN_TABLE}`);
    await connection.query(`DROP TABLE IF EXISTS ${AUTHOR_TABLE}`);
    await connection.query(`DROP TABLE IF EXISTS ${ARTICLE_TABLE}`);
    await connection.release();
}

async function resetAdminTable() {
    const connection = await mockPool.getConnection();
    await connection.query(`DELETE FROM ${ADMIN_TABLE}`);
    await connection.query(`
        INSERT INTO admins (id, username, email, password_hash, role, created_at) VALUES
        (1, 'superadmin', 'superadmin@example.com', '$2b$10$abcdefghijklmnopqrstuv', 'super', '2025-08-12 10:00:00'),
        (2, 'editor1', 'editor1@example.com', '$2b$10$zyxwvutsrqponmlkjihgf', 'editor', '2025-08-12 11:00:00'),
        (3, 'editor2', 'editor2@example.com', '$2b$10$1234567890abcdef12345', 'editor', '2025-08-12 12:00:00');
    `);
    await connection.query(`DELETE FROM ${AUTHOR_TABLE}`);
    await connection.query(`
        INSERT INTO authors (id, name, email, password_hash, about, profession, profile_photo_url, is_active, created_at) VALUES
        (1, 'John Doe', 'john@example.com', '$2b$10$abcdefghijklmnopqrstuv', 'Experienced writer', 'Journalist', 'https://example.com/john.jpg', true, '2025-01-01 10:00:00'),
        (2, 'Jane Smith', 'jane@example.com', '$2b$10$zyxwvutsrqponmlkjihgf', 'Creative storyteller', 'Novelist', 'https://example.com/jane.jpg', true, '2025-01-01 11:00:00'),
        (3, 'Bob Wilson', 'bob@example.com', '$2b$10$1234567890abcdef12345', 'Tech enthusiast', 'Tech Writer', 'https://example.com/bob.jpg', false, '2025-01-01 12:00:00'),
        (4, 'Alice Brown', 'alice@example.com', '$2b$10$fedcba9876543210fedcb', 'Food lover', 'Food Blogger', 'https://example.com/alice.jpg', true, '2025-01-01 13:00:00'),
        (5, 'Charlie Davis', 'charlie@example.com', '$2b$10$mnopqrstuabcdefhijkl', 'Travel expert', 'Travel Writer', 'https://example.com/charlie.jpg', true, '2025-01-01 14:00:00');
    `);
    await connection.release();
}

beforeAll(async () => {
    // Setup a mock database connection using testcontainers
    container = await new GenericContainer("mysql:latest")
        .withExposedPorts(3306)
        .withEnvironment({
            MYSQL_ROOT_PASSWORD: 'root',
            MYSQL_DATABASE: 'test_db',
            MYSQL_USER: 'test_user',
            MYSQL_PASSWORD: 'test_password'
        })
        .start();

    const port = container.getMappedPort(3306);
    
    // Create the pool with the dynamically assigned port
    mockPool = mysql.createPool({
        host: 'localhost',
        user: 'test_user',
        password: 'test_password',
        database: 'test_db',
        port: port
    });

    await setupDatabase();
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/admin', adminRouter);
});

afterAll(async () => {
    await tearDownDatabase();
    if (mockPool) {
        await mockPool.end();
    }
    
    if (container) {
        await container.stop();
    }
});

beforeEach(async () => {
    await resetAdminTable();
    jest.clearAllMocks();
});

describe('Admin Routes Integration Tests', () => {
    describe('PUT /admin/profile', () => {
        it('should update admin profile successfully', async () => {
            const adminToken = createAuthToken({
                id: 1,
                is_admin: true,
                email: 'superadmin@example.com',
                username: 'superadmin'
            });
            
            const response = await request(app)
                .put('/admin/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'updated_username',
                    email: 'updated@example.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Profile updated successfully');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.username).toBe('updated_username');
            expect(response.body.data.email).toBe('updated@example.com');

            // Verify the database was actually updated
            const connection = await mockPool.getConnection();
            const [rows] = await connection.query(
                'SELECT username, email FROM admins WHERE id = ?',
                [1]
            );
            await connection.release();
            
            expect(rows[0].username).toBe('updated_username');
            expect(rows[0].email).toBe('updated@example.com');
        });
    });

    describe('GET /admin/authors', () => {
        it('should fetch paginated authors successfully', async () => {
            const adminToken = createAuthToken({
                id: 1,
                is_admin: true,
                email: 'superadmin@example.com',
                username: 'superadmin'
            });
            
            const response = await request(app)
                .get('/admin/authors?page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Authors fetched successfully');
            expect(response.body.data).toBeDefined();
        });
    });

    describe('GET /admin/authors/:authorId', () => {
        it('should fetch author by ID successfully', async () => {
            const adminToken = createAuthToken({
                id: 1,
                is_admin: true,
                email: 'superadmin@example.com',
                username: 'superadmin'
            });
            
            const response = await request(app)
                .get('/admin/authors/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Author fetched successfully');
            expect(response.body.data).toBeDefined();
        });
    });

    describe('PUT /admin/authors/status', () => {
        it('should update author status successfully', async () => {
            const adminToken = createAuthToken({
                id: 1,
                is_admin: true,
                email: 'superadmin@example.com',
                username: 'superadmin'
            });
            
            const response = await request(app)
                .put('/admin/authors/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    authorID: 1,
                    is_active: false
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Author status updated successfully');
            expect(response.body.data).toBeDefined();
        });
    });

    describe('PUT /admin/authors/:authorId', () => {
        it('should update author profile successfully', async () => {
            const adminToken = createAuthToken({
                id: 1,
                is_admin: true,
                email: 'superadmin@example.com',
                username: 'superadmin'
            });
            
            const response = await request(app)
                .put('/admin/authors/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Author Name',
                    email: 'updated@example.com',
                    about: 'Updated about section',
                    profession: 'Updated profession'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Author profile updated successfully');
            expect(response.body.data).toBeDefined();
        });
    });

    describe('DELETE /admin/authors/:authorID', () => {
        it('should delete author successfully', async () => {
            const adminToken = createAuthToken({
                id: 1,
                is_admin: true,
                email: 'superadmin@example.com',
                username: 'superadmin'
            });
            
            const response = await request(app)
                .delete('/admin/authors/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Author deleted successfully');
            expect(response.body.data).toBeDefined();
        });
    });
});
