import request from 'supertest';
import express from 'express';
import adminRouter from './admin.route.ts';
import { ERRORS } from '@utils/error.ts';
import { ok, err } from 'neverthrow';
import { Admin } from '@models/admin.model.ts';
import { Author } from '@models/author.model.ts';

// Mock the admin controller
jest.mock('../controller/admin.controller.ts', () => ({
  updateAdminProfile: jest.fn(),
  getAuthorById: jest.fn(),
  updateAuthorProfile: jest.fn(),
  deleteAuthor: jest.fn(),
  getPaginatedAllAuthors: jest.fn(),
  updateAuthorStatus: jest.fn(),
}));

jest.mock('../config/env.ts', () => {
    return {
        JWT_SECRET: 'test-secret',
    }
})



// Import the mocked functions
import {
  updateAdminProfile,
  getAuthorById,
  updateAuthorProfile,
  deleteAuthor,
  getPaginatedAllAuthors,
  updateAuthorStatus,
} from '../controller/admin.controller.ts';
import { JWT_SECRET } from '../config/env.ts';
import { createAuthToken, createExpiredAuthToken } from '@utils/jwt.ts';

const mockUpdateAdminProfile = updateAdminProfile as jest.MockedFunction<typeof updateAdminProfile>;
const mockGetAuthorById = getAuthorById as jest.MockedFunction<typeof getAuthorById>;
const mockUpdateAuthorProfile = updateAuthorProfile as jest.MockedFunction<typeof updateAuthorProfile>;
const mockDeleteAuthor = deleteAuthor as jest.MockedFunction<typeof deleteAuthor>;
const mockGetPaginatedAllAuthors = getPaginatedAllAuthors as jest.MockedFunction<typeof getPaginatedAllAuthors>;
const mockUpdateAuthorStatus = updateAuthorStatus as jest.MockedFunction<typeof updateAuthorStatus>;

// Create test app
const app = express();
app.use(express.json());
app.use('/admin', adminRouter);

function getAdminAuthToken() {
    return createAuthToken({
        id: 1,
        is_admin: true,
        email: 'test@admin.com',
    })
}

function getNonAdminAuthToken() {
    return createAuthToken({
        id: 1,
        is_admin: false,
        email: 'test@author.com',
    })
}

function getExpiredAuthToken() {
    return createExpiredAuthToken({
        id: 1,
        is_admin: true,
        email: 'test@admin.com',
    })
}

// Mock admin data
const mockAdmin = {
    id: 1,
    username: 'testadmin',
    email: 'test@admin.com',
    created_at: new Date('2025-01-01T00:00:00.000Z'),
    password_hash: '',
    role: 'super'
} as Admin;

const mockAuthor = {
  id: 1,
  name: 'Author 1',
  email: 'author1@test.com',
  about: null,
  profession: null,
  profile_photo_url: null,
} as Author;

describe('Admin Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /profile', () => {
    it('should successfully update admin profile with username and email', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
        email: 'newemail@admin.com',
      };
      const updatedAdmin = { ...mockAdmin, username: 'newusername', email: 'newemail@admin.com' };
      
      mockUpdateAdminProfile.mockResolvedValue(ok(updatedAdmin));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(JSON.parse(JSON.stringify(updatedAdmin)));
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should successfully update admin profile with only username', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
      };
      const updatedAdmin = { ...mockAdmin, username: 'newusername' };
      
      mockUpdateAdminProfile.mockResolvedValue(ok(updatedAdmin));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(JSON.parse(JSON.stringify(updatedAdmin)));
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should successfully update admin profile with only email', async () => {
      // Arrange
      const requestBody = {
        email: 'newemail@admin.com',
      };
      const updatedAdmin = { ...mockAdmin, email: 'newemail@admin.com' };
      
      mockUpdateAdminProfile.mockResolvedValue(ok(updatedAdmin));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(JSON.parse(JSON.stringify(updatedAdmin)));
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should return error when request body is empty', async () => {
      // Arrange
      const requestBody = {};
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when both username and email are empty strings', async () => {
      // Arrange
      const requestBody = {
        username: '',
        email: '',
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when username and email are null', async () => {
      // Arrange
      const requestBody = {
        username: null,
        email: null,
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when username and email are undefined', async () => {
      // Arrange
      const requestBody = {
        username: undefined,
        email: undefined,
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when email format is invalid', async () => {
      // Arrange
      const requestBody = {
        email: 'invalid-email',
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return error when username is not a string', async () => {
      // Arrange
      const requestBody = {
        username: 123,
        email: 'test@admin.com',
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return error when email is not a string', async () => {
      // Arrange
      const requestBody = {
        username: 'testuser',
        email: 123,
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return error when controller returns an error', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
        email: 'newemail@admin.com',
      };
      const controllerError = ERRORS.INTERNAL_SERVER_ERROR;
      
      mockUpdateAdminProfile.mockResolvedValue(err(controllerError));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(controllerError.code);
      expect(response.body.error.message).toBe(controllerError.message);
    });

    it('should return error when user is not admin', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
        email: 'newemail@admin.com',
      };
      const token = getNonAdminAuthToken();
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.ADMIN_ONLY_ROUTE.code);
      expect(response.body.error.message).toBe(ERRORS.ADMIN_ONLY_ROUTE.message);
    });

    it('should return error when user is not authenticated', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
        email: 'newemail@admin.com',
      };
      const response = await request(app)
        .put('/admin/profile')
        .send(requestBody)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });

    it('should return error when authorization header is missing', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
        email: 'newemail@admin.com',
      };

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });

    it('should return error when authorization header format is invalid', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
        email: 'newemail@admin.com',
      };

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', 'InvalidFormat')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });

    it('should return error when authorization token is expired', async () => {
      // Arrange
      const requestBody = {
        username: 'newusername',
        email: 'newemail@admin.com',
      };
      
      // Create an expired token (this would need to be implemented in the JWT utility)
      // For now, we'll test with a malformed token
      const expiredToken = getExpiredAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.TOKEN_EXPIRED.code);
      expect(response.body.error.message).toBe(ERRORS.TOKEN_EXPIRED.message);
    });

    it('should handle whitespace in username and email', async () => {
      // Arrange
      const requestBody = {
        username: '  newusername  ',
        email: '  newemail@admin.com  ',
      };
      const updatedAdmin = { ...mockAdmin, username: 'newusername', email: 'newemail@admin.com' };
      
      mockUpdateAdminProfile.mockResolvedValue(ok(updatedAdmin));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });
  });
  
  describe('GET /authors', () => {
    it('should successfully fetch paginated authors with default pagination', async () => {
      // Arrange
      const mockAuthor1 = mockAuthor;
      const mockAuthor2 = {
        ...mockAuthor,
        id: 2,
        name: 'Author 2',
        email: 'author2@test.com',
      };
      const mockAuthors = {
        data: [
          mockAuthor1,
          mockAuthor2,
        ],
        pagination: { current_page: 1, per_page: 10, total_count: 2, total_pages: 1 }
      };
      
      mockGetPaginatedAllAuthors.mockResolvedValue(ok(mockAuthors));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAuthors);
      expect(response.body.message).toBe('Authors fetched successfully');

    });

    it('should successfully fetch paginated authors with custom pagination', async () => {
      // Arrange
      const mockAuthors = {
        data: [mockAuthor],
        pagination: { current_page: 2, per_page: 5, total_count: 1, total_pages: 1 }
      };
      
      mockGetPaginatedAllAuthors.mockResolvedValue(ok(mockAuthors));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAuthors);

    });

    it('should successfully fetch authors with search parameter', async () => {
      // Arrange
      const mockAuthors = {
        data: [mockAuthor],
        pagination: { current_page: 1, per_page: 10, total_count: 1, total_pages: 1 }
      };
      
      mockGetPaginatedAllAuthors.mockResolvedValue(ok(mockAuthors));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors?search=Author')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAuthors);

    });

    it('should return error when page is less than 1', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors?page=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_QUERY_PARAMETER.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_QUERY_PARAMETER.message);
    });

    it('should return error when limit is less than 1', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors?limit=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_QUERY_PARAMETER.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_QUERY_PARAMETER.message);
    });

    it('should return error when page is not a number', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors?page=invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_QUERY_PARAMETER.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_QUERY_PARAMETER.message);
    });

    it('should return error when limit is not a number', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors?limit=invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_QUERY_PARAMETER.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_QUERY_PARAMETER.message);
    });

    it('should return error when controller returns an error', async () => {
      // Arrange
      const controllerError = ERRORS.INTERNAL_SERVER_ERROR;
      mockGetPaginatedAllAuthors.mockResolvedValue(err(controllerError));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(controllerError.code);
      expect(response.body.error.message).toBe(controllerError.message);
    });

    it('should return error when user is not admin', async () => {
      // Arrange
      const token = getNonAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.ADMIN_ONLY_ROUTE.code);
      expect(response.body.error.message).toBe(ERRORS.ADMIN_ONLY_ROUTE.message);
    });

    it('should return error when user is not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/admin/authors')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });
  });

  describe('GET /authors/:authorId', () => {
    it('should successfully fetch author by ID', async () => {
      // Arrange
      const testAuthor = { ...mockAuthor, password_hash: 'hash', is_active: true, created_at: new Date() };
      mockGetAuthorById.mockResolvedValue(ok(testAuthor));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(JSON.parse(JSON.stringify(testAuthor)));
      expect(response.body.message).toBe('Author fetched successfully');

    });

    it('should return error when author ID is not a number', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors/invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_AUTHOR_ID.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_AUTHOR_ID.message);
    });

    it('should return error when author ID is decimal', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors/1.5')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_AUTHOR_ID.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_AUTHOR_ID.message);
    });

    it('should return error when controller returns an error', async () => {
      // Arrange
      const controllerError = ERRORS.AUTHOR_NOT_FOUND;
      mockGetAuthorById.mockResolvedValue(err(controllerError));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(controllerError.code);
      expect(response.body.error.message).toBe(controllerError.message);
    });

    it('should return error when user is not admin', async () => {
      // Arrange
      const token = getNonAdminAuthToken();

      // Act
      const response = await request(app)
        .get('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.ADMIN_ONLY_ROUTE.code);
      expect(response.body.error.message).toBe(ERRORS.ADMIN_ONLY_ROUTE.message);
    });

    it('should return error when user is not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/admin/authors/1')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });
  });

  describe('PUT /authors/:authorId', () => {
    it('should successfully update author profile with all fields', async () => {
      // Arrange
      const requestBody = {
        name: 'Updated Author',
        email: 'updated@author.com',
        about: 'Updated about',
        profession: 'Updated profession',
        profile_photo_url: 'https://example.com/photo.jpg'
      };
      const updatedAuthor = { ...mockAuthor, ...requestBody, about: requestBody.about || null, profession: requestBody.profession || null, profile_photo_url: requestBody.profile_photo_url || null, password_hash: 'hash', is_active: true, created_at: new Date() };
      
      mockUpdateAuthorProfile.mockResolvedValue(ok(updatedAuthor));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(JSON.parse(JSON.stringify(updatedAuthor)));
      expect(response.body.message).toBe('Author profile updated successfully');

    });

    it('should successfully update author profile with only name', async () => {
      // Arrange
      const requestBody = { name: 'Updated Author' };
      const updatedAuthor = {
        ...mockAuthor,
        name: 'Updated Author',
      };
      
      mockUpdateAuthorProfile.mockResolvedValue(ok(updatedAuthor));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);

    });

    it('should successfully update author profile with only email', async () => {
      // Arrange
      const requestBody = { email: 'updated@author.com' };
      const updatedAuthor = {
        ...mockAuthor,
        email: 'updated@author.com',
      };
      
      mockUpdateAuthorProfile.mockResolvedValue(ok(updatedAuthor));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);

    });

    it('should return error when request body is empty', async () => {
      // Arrange
      const requestBody = {};
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when all fields are empty strings', async () => {
      // Arrange
      const requestBody = {
        name: '',
        email: '',
        about: '',
        profession: '',
        profile_photo_url: ''
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when email format is invalid', async () => {
      // Arrange
      const requestBody = { email: 'invalid-email' };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return error when profile_photo_url is not a valid URL', async () => {
      // Arrange
      const requestBody = { profile_photo_url: 'not-a-url' };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return error when controller returns an error', async () => {
      // Arrange
      const requestBody = { name: 'Updated Author' };
      const controllerError = ERRORS.INTERNAL_SERVER_ERROR;
      
      mockUpdateAuthorProfile.mockResolvedValue(err(controllerError));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(controllerError.code);
      expect(response.body.error.message).toBe(controllerError.message);
    });

    it('should return error when user is not admin', async () => {
      // Arrange
      const requestBody = { name: 'Updated Author' };
      const token = getNonAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.ADMIN_ONLY_ROUTE.code);
      expect(response.body.error.message).toBe(ERRORS.ADMIN_ONLY_ROUTE.message);
    });

    it('should return error when user is not authenticated', async () => {
      // Arrange
      const requestBody = { name: 'Updated Author' };

      // Act
      const response = await request(app)
        .put('/admin/authors/1')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });
  });

  describe('PUT /authors/status', () => {
    it('should successfully update author status to active', async () => {
      // Arrange
      const requestBody = {
        authorID: 1,
        is_active: true
      };
      const updatedAuthor = { ...mockAuthor, is_active: true };
      
      mockUpdateAuthorStatus.mockResolvedValue(ok(updatedAuthor));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(JSON.parse(JSON.stringify(updatedAuthor)));
      expect(response.body.message).toBe('Author status updated successfully');

    });

    it('should successfully update author status to inactive', async () => {
      // Arrange
      const requestBody = {
        authorID: 1,
        is_active: false
      };
      const updatedAuthor = {
        ...mockAuthor,
        is_active: false,
      };
      
      mockUpdateAuthorStatus.mockResolvedValue(ok(updatedAuthor));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(JSON.parse(JSON.stringify(updatedAuthor)));

    });

    it('should return error when authorID is missing', async () => {
      // Arrange
      const requestBody = { is_active: true };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return error when is_active is missing', async () => {
      // Arrange
      const requestBody = { authorID: 1 };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when authorID is not a number', async () => {
      // Arrange
      const requestBody = {
        authorID: 'invalid',
        is_active: true
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when authorID is not positive', async () => {
      // Arrange
      const requestBody = {
        authorID: 0,
        is_active: true
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when is_active is not a boolean', async () => {
      // Arrange
      const requestBody = {
        authorID: 1,
        is_active: 'true'
      };
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_REQUEST_BODY.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_REQUEST_BODY.message);
    });

    it('should return error when controller returns an error', async () => {
      // Arrange
      const requestBody = {
        authorID: 1,
        is_active: true
      };
      const controllerError = ERRORS.AUTHOR_NOT_FOUND;
      
      mockUpdateAuthorStatus.mockResolvedValue(err(controllerError));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(controllerError.code);
      expect(response.body.error.message).toBe(controllerError.message);
    });

    it('should return error when user is not admin', async () => {
      // Arrange
      const requestBody = {
        authorID: 1,
        is_active: true
      };
      const token = getNonAdminAuthToken();

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody)
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.ADMIN_ONLY_ROUTE.code);
      expect(response.body.error.message).toBe(ERRORS.ADMIN_ONLY_ROUTE.message);
    });

    it('should return error when user is not authenticated', async () => {
      // Arrange
      const requestBody = {
        authorID: 1,
        is_active: true
      };

      // Act
      const response = await request(app)
        .put('/admin/authors/status')
        .send(requestBody)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });
  });

  describe('DELETE /authors/:authorID', () => {
    it('should successfully delete author', async () => {
      // Arrange
      const deletedAuthor = mockAuthor;
      mockDeleteAuthor.mockResolvedValue(ok(deletedAuthor));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .delete('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(deletedAuthor);
      expect(response.body.message).toBe('Author deleted successfully');

    });

    it('should return error when authorID is not a number', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .delete('/admin/authors/invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_AUTHOR_ID.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_AUTHOR_ID.message);
    });

    it('should return error when authorID is decimal', async () => {
      // Arrange
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .delete('/admin/authors/1.5')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.INVALID_AUTHOR_ID.code);
      expect(response.body.error.message).toBe(ERRORS.INVALID_AUTHOR_ID.message);
    });

    it('should return error when controller returns an error', async () => {
      // Arrange
      const controllerError = ERRORS.AUTHOR_NOT_FOUND;
      mockDeleteAuthor.mockResolvedValue(err(controllerError));
      const token = getAdminAuthToken();

      // Act
      const response = await request(app)
        .delete('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(controllerError.code);
      expect(response.body.error.message).toBe(controllerError.message);
    });

    it('should return error when user is not admin', async () => {
      // Arrange
      const token = getNonAdminAuthToken();

      // Act
      const response = await request(app)
        .delete('/admin/authors/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.ADMIN_ONLY_ROUTE.code);
      expect(response.body.error.message).toBe(ERRORS.ADMIN_ONLY_ROUTE.message);
    });

    it('should return error when user is not authenticated', async () => {
      // Act
      const response = await request(app)
        .delete('/admin/authors/1')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERRORS.UNAUTHORIZED.code);
      expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED.message);
    });
  });
  
});
