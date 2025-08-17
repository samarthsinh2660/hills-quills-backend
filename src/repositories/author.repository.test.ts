import mysql from 'mysql2/promise';
import { GenericContainer } from 'testcontainers';
import { AUTHOR_TABLE, CREATE_AUTHOR_TABLE } from '../models/author.model.ts';
import { db } from '../database/db.ts';
import { AuthorRepository } from './author.repository.ts';  
import { ERRORS } from '@utils/error.ts';
import { ARTICLE_TABLE, CREATE_ARTICLE_TABLE } from '@models/article.model.ts';

let mockPool: any;
let container: any;
jest.setTimeout(30000);
jest.mock('../database/db.ts', () => ({
    get db() {
        return mockPool;
    }
}));

async function setupDatabase() {
    const connection = await mockPool.getConnection();
    await connection.query(CREATE_AUTHOR_TABLE);
    await connection.query(CREATE_ARTICLE_TABLE);
    await connection.release();
}

async function tearDownDatabase() {
    const connection = await mockPool.getConnection();
    await connection.query(`DROP TABLE IF EXISTS ${AUTHOR_TABLE}`);
    await connection.query(`DROP TABLE IF EXISTS ${ARTICLE_TABLE}`);
    await connection.release();
}

// Clear all the data in the author table and inserts dummy data
async function resetAuthorTable() {
    const connection = await mockPool.getConnection();
    await connection.query(`DELETE FROM ${AUTHOR_TABLE}`);
    await connection.query(`
        INSERT INTO authors (id, name, email, password_hash, about, profession, profile_photo_url, is_active, created_at) VALUES
        (1, 'John Doe', 'john@example.com', '$2b$10$abcdefghijklmnopqrstuv', 'Experienced writer', 'Journalist', 'https://example.com/john.jpg', true, '2025-01-01 10:00:00'),
        (2, 'Jane Smith', 'jane@example.com', '$2b$10$zyxwvutsrqponmlkjihgf', 'Creative storyteller', 'Novelist', 'https://example.com/jane.jpg', true, '2025-01-01 11:00:00'),
        (3, 'Bob Wilson', 'bob@example.com', '$2b$10$1234567890abcdef12345', 'Tech enthusiast', 'Tech Writer', 'https://example.com/bob.jpg', false, '2025-01-01 12:00:00'),
        (4, 'Alice Brown', 'alice@example.com', '$2b$10$fedcba9876543210fedcb', 'Food lover', 'Food Blogger', 'https://example.com/alice.jpg', true, '2025-01-01 13:00:00'),
        (5, 'Charlie Davis', 'charlie@example.com', '$2b$10$mnopqrstuabcdefhijkl', 'Travel expert', 'Travel Writer', 'https://example.com/charlie.jpg', true, '2025-01-01 14:00:00');`)
    await connection.release();
}

async function resetArticleTable() {
    const connection = await mockPool.getConnection();
    await connection.query(`DELETE FROM ${ARTICLE_TABLE}`);
    await connection.query(`
        INSERT INTO articles (id, author_id, title, created_at, category) VALUES
        (1, 1, 'Article 1', '2025-01-01 10:00:00', 'Technology'),
        (2, 1, 'Article 2', '2025-01-01 11:00:00', 'Science');`)
    await connection.release();
}

beforeAll(async () => {
    // Setup a mock database connection
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
})

afterAll(async () => {
    await tearDownDatabase();
    if (mockPool) {
        await mockPool.end();
    }
    
    if (container) {
        await container.stop();
    }
});

describe('AuthorRepository', () => {
    it('findAuthorByEmail called with jane@example.com; should return a Result with an array containing 1 author user', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.findAuthorByEmail('jane@example.com');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const authors = result.value;
            expect(authors).toHaveLength(1);
            expect(authors[0].email).toBe('jane@example.com');
        }
    });
    
    it('findAuthorByEmail called with non-existing email; should return a Result with an empty array', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.findAuthorByEmail('notexists@example.com');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const authors = result.value;
            expect(authors).toHaveLength(0);
        }
    });

    it('createAuthor should create a new author and return a Result with insert result', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.createAuthor(
            'New Author', 
            'newauthor@example.com', 
            '$2b$10$testhashedpassword',
            'New bio',
            'New profession',
            'https://example.com/new.jpg'
        );
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBeDefined();
        }
        
        // Verify author was created in database
        const findResult = await AuthorRepository.findAuthorByEmail('newauthor@example.com');
        expect(findResult.isOk()).toBe(true);
        if (findResult.isOk()) {
            expect(findResult.value).toHaveLength(1);
        }
    });

    it('getAuthorById should return a Result with author with matching id', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.getAuthorById(2);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const author = result.value;
            expect(author.id).toBe(2);
            expect(author.name).toBe('Jane Smith');
            expect(author.email).toBe('jane@example.com');
            expect(author.profession).toBe('Novelist');
        }
    });

    it('getAuthorById with non-existent id should return a Result.err with AUTHOR_NOT_FOUND error', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.getAuthorById(999);
        
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe(ERRORS.AUTHOR_NOT_FOUND);
        }
    });

    it('updateAuthor should update author name and email and return a Result with the updated author', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.updateAuthor(2, 'Updated Jane', 'updated@example.com');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAuthor = result.value;
            expect(updatedAuthor.name).toBe('Updated Jane');
            expect(updatedAuthor.email).toBe('updated@example.com');
        }
        
        // Verify changes in database
        const authorResult = await AuthorRepository.getAuthorById(2);
        expect(authorResult.isOk()).toBe(true);
        if (authorResult.isOk()) {
            const author = authorResult.value;
            expect(author.name).toBe('Updated Jane');
            expect(author.email).toBe('updated@example.com');
        }
    });

    it('updateAuthor with only name should update just the name and return a Result', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.updateAuthor(3, 'Updated Bob');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAuthor = result.value;
            expect(updatedAuthor.name).toBe('Updated Bob');
            expect(updatedAuthor.email).toBe('bob@example.com'); // Original email unchanged
        }
    });

    it('updateAuthor with only about should update just the about and return a Result', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.updateAuthor(4, undefined, undefined, 'Updated about section');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAuthor = result.value;
            expect(updatedAuthor.about).toBe('Updated about section');
            expect(updatedAuthor.name).toBe('Alice Brown'); // Original name unchanged
        }
    });

    it('getAllAuthors should return paginated authors with correct limit and offset', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.getAllAuthors(3, 1);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const authors = result.value;
            expect(authors).toHaveLength(3);
            // Should start from second author (offset 1)
            expect(authors[0].id).toBe(2);
            expect(authors[1].id).toBe(3);
            expect(authors[2].id).toBe(4);
        }
    });

    it('getAllAuthors with limit 0 should return empty array', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.getAllAuthors(0, 0);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const authors = result.value;
            expect(authors).toHaveLength(0);
        }
    });

    it('searchAuthors should return authors matching search term in name, email, or profession', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.searchAuthors('tech', 10, 0);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const authors = result.value;
            expect(authors).toHaveLength(1);
            expect(authors[0].profession).toBe('Tech Writer');
        }
    });

    it('searchAuthors with "writer" should return multiple authors', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.searchAuthors('writer', 10, 0);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const authors = result.value;
            expect(authors.length).toBeGreaterThan(0);
            // Should find authors with "writer" in their profession
            const hasWriter = authors.some(author => 
                author.profession?.toLowerCase().includes('writer')
            );
            expect(hasWriter).toBe(true);
        }
    });

    it('getAuthorsCount should return total number of authors', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.getAuthorsCount();
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(5);
        }
    });

    it('getAuthorsSearchCount should return count of authors matching search term', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.getAuthorsSearchCount('writer');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBeGreaterThan(0);
        }
    });

    it('updateAuthorStatus should activate an inactive author and return the updated author', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.updateAuthorStatus(3, true);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAuthor = result.value;
            expect(updatedAuthor.is_active).toBeTruthy();
            expect(updatedAuthor.id).toBe(3);
        }
        
        // Verify status was updated in database
        const authorResult = await AuthorRepository.getAuthorById(3);
        expect(authorResult.isOk()).toBe(true);
        if (authorResult.isOk()) {
            expect(authorResult.value.is_active).toBeTruthy();
        }
    });

    it('updateAuthorStatus should deactivate an active author and return the updated author', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.updateAuthorStatus(1, false);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAuthor = result.value;
            expect(updatedAuthor.is_active).toBeFalsy();
            expect(updatedAuthor.id).toBe(1);
        }
    });

    it('deleteAuthor should delete an author and return the deleted author', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.deleteAuthor(5);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const deletedAuthor = result.value;
            expect(deletedAuthor.id).toBe(5);
            expect(deletedAuthor.name).toBe('Charlie Davis');
        }
        
        // Verify author was deleted from database
        const authorResult = await AuthorRepository.getAuthorById(5);
        expect(authorResult.isErr()).toBe(true);
        if (authorResult.isErr()) {
            expect(authorResult.error).toBe(ERRORS.AUTHOR_NOT_FOUND);
        }
    });

    it('deleteAuthor with non-existent id should return AUTHOR_NOT_FOUND error', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.deleteAuthor(999);
        
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe(ERRORS.AUTHOR_NOT_FOUND);
        }
    });

    it('getAuthorArticlesCount should return count of articles for an author', async () => {
        await resetAuthorTable();
        await resetArticleTable();
        
        const result = await AuthorRepository.getAuthorArticlesCount(1);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(2);
        }
        
        // Clean up articles table
        const cleanupConnection = await mockPool.getConnection();
        await cleanupConnection.release();
    });

    it('getAuthorArticlesCount for author with no articles should return 0', async () => {
        await resetAuthorTable();
        const result = await AuthorRepository.getAuthorArticlesCount(5);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(0);
        }
    });

    it('updateAuthorPassword should update password hash and return success', async () => {
        await resetAuthorTable();
        const newPasswordHash = '$2b$10$newhashedpasswordvalue';
        const result = await AuthorRepository.updateAuthorPassword('john@example.com', newPasswordHash);
        
        expect(result.isOk()).toBe(true);
        
        // Verify password was updated in database by querying directly
        const connection = await mockPool.getConnection();
        const [rows] = await connection.query(
            "SELECT password_hash FROM authors WHERE email = ?",
            ['john@example.com']
        );
        await connection.release();
        
        expect(rows[0].password_hash).toBe(newPasswordHash);
    });

    it('updateAuthorPassword with non-existent email should still return success (MySQL behavior)', async () => {
        await resetAuthorTable();
        const newPasswordHash = '$2b$10$newhashedpasswordvalue';
        const result = await AuthorRepository.updateAuthorPassword('nonexistent@example.com', newPasswordHash);
        
        expect(result.isOk()).toBe(true);
    });
});




