import mysql from 'mysql2/promise';
import { GenericContainer } from 'testcontainers';
import { ADMIN_TABLE, CREATE_ADMIN_TABLE_QUERY } from '../models/admin.model.ts';
import { db } from '../database/db.ts';
import { AdminRepository } from './admin.repository.ts';  
import { ERRORS } from '@utils/error.ts';

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
    await connection.query(CREATE_ADMIN_TABLE_QUERY);
    await connection.release();
}

async function tearDownDatabase() {
    const connection = await mockPool.getConnection();
    await connection.query(`DROP TABLE IF EXISTS ${ADMIN_TABLE}`);
    await connection.release();
}

// Clear all the data in the admin table and inserts dummy data
async function resetAdminTable() {
    const connection = await mockPool.getConnection();
    await connection.query(`DELETE FROM ${ADMIN_TABLE}`);
    await connection.query(`
        INSERT INTO admins (id, username, email, password_hash, role, created_at) VALUES
        (1, 'superadmin', 'superadmin@example.com', '$2b$10$abcdefghijklmnopqrstuv', 'super', '2025-08-12 10:00:00'),
        (2, 'editor1', 'editor1@example.com', '$2b$10$zyxwvutsrqponmlkjihgf', 'editor', '2025-08-12 11:00:00'),
        (3, 'editor2', 'editor2@example.com', '$2b$10$1234567890abcdef12345', 'editor', '2025-08-12 12:00:00'),
        (4, 'editor3', 'editor3@example.com', '$2b$10$fedcba9876543210fedcb', 'editor', '2025-08-12 13:00:00'),
        (5, 'adminhelper', 'adminhelper@example.com', '$2b$10$mnopqrstuabcdefhijkl', 'editor', '2025-08-12 14:00:00');`)
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

describe('AdminRepository', () => {
    it('findAdminByEmail called with editor1@example.com; should return a Result with an array containing 1 admin user', async () => {
        await resetAdminTable();
        const result = await AdminRepository.findAdminByEmail('editor1@example.com');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const admins = result.value;
            expect(admins).toHaveLength(1);
            expect(admins[0].email).toBe('editor1@example.com');
        }
    });
    
    it('findAdminByEmail called with non-existing email; should return a Result with an empty array', async () => {
        await resetAdminTable();
        const result = await AdminRepository.findAdminByEmail('notexists@exmple.com');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const admins = result.value;
            expect(admins).toHaveLength(0);
        }
    });
    
    it('findAdminByUsername called with editor1; should return a Result with an array containing 1 admin user', async () => {
        await resetAdminTable();
        const result = await AdminRepository.findAdminByUsername('editor1');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const admins = result.value;
            expect(admins).toHaveLength(1);
            expect(admins[0].id).toBe(2);
        }
    });
    
    it('findAdminByUsername called with non-existing username; should return a Result with an empty array', async () => {
        await resetAdminTable();
        const result = await AdminRepository.findAdminByUsername('nonexistentuser');
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const admins = result.value;
            expect(admins).toHaveLength(0);
        }
    });
    
    it('createAdmin should create a new admin and return a Result with admin object', async () => {
        await resetAdminTable();
        const result = await AdminRepository.createAdmin(
            'newadmin', 
            'newadmin@example.com', 
            '$2b$10$testhashedpassword'
        );
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const admin = result.value;
            expect(admin).toBeDefined();
            expect(admin.username).toBe('newadmin');
            expect(admin.email).toBe('newadmin@example.com');
        }
        
        // Verify admin was created in database
        const findResult = await AdminRepository.findAdminByEmail('newadmin@example.com');
        expect(findResult.isOk()).toBe(true);
        if (findResult.isOk()) {
            expect(findResult.value).toHaveLength(1);
        }
    });
    
    it('getAdminById should return a Result with admin with matching id', async () => {
        await resetAdminTable();
        const result = await AdminRepository.getAdminById(2);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const admin = result.value;
            expect(admin.id).toBe(2);
            expect(admin.username).toBe('editor1');
            expect(admin.email).toBe('editor1@example.com');
        }
    });
    
    it('getAdminById with non-existent id should return a Result.err with ADMIN_NOT_FOUND error', async () => {
        await resetAdminTable();
        const result = await AdminRepository.getAdminById(999);
        
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe(ERRORS.ADMIN_NOT_FOUND);
        }
    });
    
    it('updateAdmin should update admin username and email and return a Result with the updated admin', async () => {
        await resetAdminTable();
        const result = await AdminRepository.updateAdmin('updated_username', 'updated@example.com', 2);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAdmin = result.value;
            expect(updatedAdmin.username).toBe('updated_username');
            expect(updatedAdmin.email).toBe('updated@example.com');
        }
        
        // Verify changes in database
        const adminResult = await AdminRepository.getAdminById(2);
        expect(adminResult.isOk()).toBe(true);
        if (adminResult.isOk()) {
            const admin = adminResult.value;
            expect(admin.username).toBe('updated_username');
            expect(admin.email).toBe('updated@example.com');
        }
    });
    
    it('updateAdmin with only username should update just the username and return a Result', async () => {
        await resetAdminTable();
        const result = await AdminRepository.updateAdmin('only_username_updated', undefined, 3);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAdmin = result.value;
            expect(updatedAdmin.username).toBe('only_username_updated');
            expect(updatedAdmin.email).toBe('editor2@example.com'); // Original email unchanged
        }
    });
    
    it('updateAdmin with only email should update just the email and return a Result', async () => {
        await resetAdminTable();
        const result = await AdminRepository.updateAdmin(undefined, 'only_email_updated@example.com', 4);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const updatedAdmin = result.value;
            expect(updatedAdmin.username).toBe('editor3'); // Original username unchanged
            expect(updatedAdmin.email).toBe('only_email_updated@example.com');
        }
    });
    
    it('updateAdminPassword should update the password hash and return a Result', async () => {
        await resetAdminTable();
        const newPasswordHash = '$2b$10$newhashedpasswordvalue';
        const result = await AdminRepository.updateAdminPassword(2, newPasswordHash);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBeDefined();
        }
        
        // Verify password was updated in database by querying directly
        const connection = await mockPool.getConnection();
        const [rows] = await connection.query(
            "SELECT password_hash FROM admins WHERE id = ?",
            [2]
        );
        await connection.release();
        
        expect(rows[0].password_hash).toBe(newPasswordHash);
    });
});
