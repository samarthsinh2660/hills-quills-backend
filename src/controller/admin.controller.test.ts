import { ERRORS, RequestError } from "../utils/error.ts";
import { Admin } from "@models/admin.model.ts";
import { Author } from "@models/author.model.ts";
import { Paginated } from "types/pagination.ts";
import { err, ok, Result } from "neverthrow";
import {
  updateAdminProfile,
  updateAuthorProfile,
  getPaginatedAllAuthors,
  getAuthorById,
  updateAuthorStatus,
  deleteAuthor
} from "./admin.controller.ts";

import { IAdminRepository } from "@repositories/admin.repository.ts";
import { IAuthorRepository } from "@repositories/author.repository.ts";

// Mock the repository modules with factory functions
jest.mock("../repositories/admin.repository.ts", () => ({
  AdminRepository: {
    findAdminByUsername: jest.fn(),
    findAdminByEmail: jest.fn(),
    createAdmin: jest.fn(),
    getAdminById: jest.fn(),
    updateAdmin: jest.fn(),
    updateAdminPassword: jest.fn(),
  },
}));

jest.mock("../repositories/author.repository.ts", () => ({
  AuthorRepository: {
    findAuthorByEmail: jest.fn(),
    getAuthorById: jest.fn(),
    updateAuthor: jest.fn(),
    getAllAuthors: jest.fn(),
    searchAuthors: jest.fn(),
    getAuthorsCount: jest.fn(),
    getAuthorsSearchCount: jest.fn(),
    updateAuthorStatus: jest.fn(),
    deleteAuthor: jest.fn(),
    getAuthorArticlesCount: jest.fn(),
  },
}));

// Import the mocked repositories after mocking
import { AdminRepository } from "../repositories/admin.repository.ts";
import { AuthorRepository } from "../repositories/author.repository.ts";

// Create typed mocks from the imported repositories
const mockAdminRepository = AdminRepository as unknown as jest.Mocked<IAdminRepository>;
const mockAuthorRepository = AuthorRepository as unknown as jest.Mocked<IAuthorRepository>;

// Test data
const mockAdmin: Admin = {
  id: 1,
  username: "testadmin",
  email: "test@admin.com",
  password_hash: "$2b$10$abcdefghijklmnopqrstuv",
  role: "editor" as const,
  created_at: new Date("2025-01-01T00:00:00.000Z"),
} as Admin;

const mockAuthor: Author = {
  id: 1,
  name: "Test Author",
  email: "test@author.com",
  about: "Test bio",
  profession: "Writer",
  profile_photo_url: "https://example.com/photo.jpg",
  password_hash: "$2b$10$abcdefghijklmnopqrstuv",
  is_active: true,
  created_at: new Date("2025-01-01T00:00:00.000Z"),
} as Author;

const mockAuthors: Author[] = [
  mockAuthor,
  {
    ...mockAuthor,
    id: 2,
    name: "Test Author 2",
    email: "test2@author.com",
  } as Author,
];

describe("Admin Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateAdminProfile", () => {
    it("should successfully update admin profile with username and email and return the updated admin", async () => {
      // Arrange
      const userID = 1;
      const username = "newusername";
      const email = "newemail@admin.com";
      const updatedAdmin = { ...mockAdmin, username, email };

      mockAdminRepository.findAdminByUsername.mockResolvedValue(ok([]));
      mockAdminRepository.findAdminByEmail.mockResolvedValue(ok([]));
      mockAdminRepository.updateAdmin.mockResolvedValue(ok(updatedAdmin));

      // Act
      const result = await updateAdminProfile(userID, email, username);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.username).toBe(username);
        expect(result.value.email).toBe(email);
        expect(result.value.id).toBe(userID);
      }
    });

    it("should return error when username already exists", async () => {
      // Arrange
      const userID = 1;
      const username = "existingusername";

      mockAdminRepository.findAdminByUsername.mockResolvedValue(ok([mockAdmin]));

      // Act
      const result = await updateAdminProfile(userID, undefined, username);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.ADMIN_USERNAME_EXISTS);
      }
    });

    it("should return error when email already exists", async () => {
      // Arrange
      const userID = 1;
      const email = "existing@admin.com";

      mockAdminRepository.findAdminByEmail.mockResolvedValue(ok([mockAdmin]));

      // Act
      const result = await updateAdminProfile(userID, email);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.ADMIN_EMAIL_EXISTS);
      }
    });

    it("should handle database error when checking username", async () => {
      // Arrange
      const userID = 1;
      const username = "testusername";

      mockAdminRepository.findAdminByUsername.mockResolvedValue(err(ERRORS.DATABASE_ERROR));

      // Act
      const result = await updateAdminProfile(userID, undefined, username);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.DATABASE_ERROR);
      }
    });

    it("should successfully update when no username or email provided", async () => {
      // Arrange
      const userID = 1;

      mockAdminRepository.updateAdmin.mockResolvedValue(ok(mockAdmin));

      // Act
      const result = await updateAdminProfile(userID);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockAdmin);
      }
    });
  });

  describe("updateAuthorProfile", () => {
    it("should successfully update author profile and return the updated author", async () => {
      // Arrange
      const authorId = 1;
      const name = "Updated Author";
      const email = "updated@author.com";
      const about = "Updated bio";
      const profession = "Updated profession";
      const profile_photo_url = "https://example.com/updated.jpg";
      const updatedAuthor = { ...mockAuthor, name, email, about, profession, profile_photo_url };

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.findAuthorByEmail.mockResolvedValue(ok([]));
      mockAuthorRepository.updateAuthor.mockResolvedValue(ok(updatedAuthor));

      // Act
      const result = await updateAuthorProfile(authorId, name, email, about, profession, profile_photo_url);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(name);
        expect(result.value.email).toBe(email);
        expect(result.value.about).toBe(about);
        expect(result.value.profession).toBe(profession);
        expect(result.value.profile_photo_url).toBe(profile_photo_url);
      }
    });

    it("should return error when author not found", async () => {
      // Arrange
      const authorId = 999;

      mockAuthorRepository.getAuthorById.mockResolvedValue(err(ERRORS.AUTHOR_NOT_FOUND));

      // Act
      const result = await updateAuthorProfile(authorId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.AUTHOR_NOT_FOUND);
      }
    });

    it("should return error when author email already exists", async () => {
      // Arrange
      const authorId = 1;
      const email = "existing@author.com";

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.findAuthorByEmail.mockResolvedValue(ok([mockAuthor]));

      // Act
      const result = await updateAuthorProfile(authorId, undefined, email);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.AUTHOR_EMAIL_EXISTS);
      }
    });

    it("should skip email validation when email is undefined", async () => {
      // Arrange
      const authorId = 1;
      const name = "Updated Author";
      const updatedAuthor = { ...mockAuthor, name };

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.updateAuthor.mockResolvedValue(ok(updatedAuthor));

      // Act
      const result = await updateAuthorProfile(authorId, name);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(name);
        expect(result.value.email).toBe(mockAuthor.email); // Original email unchanged
      }
    });
  });

  describe("getPaginatedAllAuthors", () => {
    it("should return paginated authors without search", async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const totalCount = 20;

      mockAuthorRepository.getAllAuthors.mockResolvedValue(ok(mockAuthors));
      mockAuthorRepository.getAuthorsCount.mockResolvedValue(ok(totalCount));

      // Act
      const result = await getPaginatedAllAuthors(page, limit);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const paginatedResult = result.value;
        expect(paginatedResult.data).toEqual(mockAuthors);
        expect(paginatedResult.pagination.current_page).toBe(page);
        expect(paginatedResult.pagination.total_pages).toBe(2);
        expect(paginatedResult.pagination.total_count).toBe(totalCount);
        expect(paginatedResult.pagination.per_page).toBe(limit);
      }
    });

    it("should return paginated authors with search", async () => {
      // Arrange
      const page = 2;
      const limit = 5;
      const search = "test";
      const totalCount = 15;

      mockAuthorRepository.searchAuthors.mockResolvedValue(ok(mockAuthors));
      mockAuthorRepository.getAuthorsSearchCount.mockResolvedValue(ok(totalCount));

      // Act
      const result = await getPaginatedAllAuthors(page, limit, search);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const paginatedResult = result.value;
        expect(paginatedResult.data).toEqual(mockAuthors);
        expect(paginatedResult.pagination.current_page).toBe(page);
        expect(paginatedResult.pagination.total_pages).toBe(3);
        expect(paginatedResult.pagination.total_count).toBe(totalCount);
        expect(paginatedResult.pagination.per_page).toBe(limit);
      }
    });

    it("should handle error when getting all authors", async () => {
      // Arrange
      const page = 1;
      const limit = 10;

      mockAuthorRepository.getAllAuthors.mockResolvedValue(err(ERRORS.DATABASE_ERROR));

      // Act
      const result = await getPaginatedAllAuthors(page, limit);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.DATABASE_ERROR);
      }
    });

    it("should handle error when getting authors count", async () => {
      // Arrange
      const page = 1;
      const limit = 10;

      mockAuthorRepository.getAllAuthors.mockResolvedValue(ok(mockAuthors));
      mockAuthorRepository.getAuthorsCount.mockResolvedValue(err(ERRORS.DATABASE_ERROR));

      // Act
      const result = await getPaginatedAllAuthors(page, limit);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.DATABASE_ERROR);
      }
    });
  });

  describe("getAuthorById", () => {
    it("should successfully return author by ID", async () => {
      // Arrange
      const authorId = 1;

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));

      // Act
      const result = await getAuthorById(authorId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockAuthor);
        expect(result.value.id).toBe(authorId);
        expect(result.value.name).toBe(mockAuthor.name);
        expect(result.value.email).toBe(mockAuthor.email);
      }
    });

    it("should return error when author not found", async () => {
      // Arrange
      const authorId = 999;

      mockAuthorRepository.getAuthorById.mockResolvedValue(err(ERRORS.AUTHOR_NOT_FOUND));

      // Act
      const result = await getAuthorById(authorId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.AUTHOR_NOT_FOUND);
      }
    });

    it("should handle database error", async () => {
      // Arrange
      const authorId = 1;

      mockAuthorRepository.getAuthorById.mockResolvedValue(err(ERRORS.DATABASE_ERROR));

      // Act
      const result = await getAuthorById(authorId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.DATABASE_ERROR);
      }
    });
  });

  describe("updateAuthorStatus", () => {
    it("should successfully activate an author and return the updated author", async () => {
      // Arrange
      const authorID = 1;
      const is_active = true;
      const updatedAuthor = { ...mockAuthor, is_active: true };

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.updateAuthorStatus.mockResolvedValue(ok(updatedAuthor));

      // Act
      const result = await updateAuthorStatus(authorID, is_active);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.is_active).toBe(true);
        expect(result.value.id).toBe(authorID);
      }
    });

    it("should successfully deactivate an author and return the updated author", async () => {
      // Arrange
      const authorID = 1;
      const is_active = false;
      const updatedAuthor = { ...mockAuthor, is_active: false };

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.updateAuthorStatus.mockResolvedValue(ok(updatedAuthor));

      // Act
      const result = await updateAuthorStatus(authorID, is_active);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.is_active).toBe(false);
        expect(result.value.id).toBe(authorID);
      }
    });

    it("should return error when author not found", async () => {
      // Arrange
      const authorID = 999;
      const is_active = true;

      mockAuthorRepository.getAuthorById.mockResolvedValue(err(ERRORS.AUTHOR_NOT_FOUND));

      // Act
      const result = await updateAuthorStatus(authorID, is_active);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.AUTHOR_NOT_FOUND);
      }
    });

    it("should handle database error during status update", async () => {
      // Arrange
      const authorID = 1;
      const is_active = true;

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.updateAuthorStatus.mockResolvedValue(err(ERRORS.DATABASE_ERROR));

      // Act
      const result = await updateAuthorStatus(authorID, is_active);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.DATABASE_ERROR);
      }
    });
  });

  describe("deleteAuthor", () => {
    it("should successfully delete an author with no articles and return the deleted author", async () => {
      // Arrange
      const authorID = 1;

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.getAuthorArticlesCount.mockResolvedValue(ok(0));
      mockAuthorRepository.deleteAuthor.mockResolvedValue(ok(mockAuthor));

      // Act
      const result = await deleteAuthor(authorID);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockAuthor);
        expect(result.value.id).toBe(authorID);
      }
    });

    it("should return error when author not found", async () => {
      // Arrange
      const authorID = 999;

      mockAuthorRepository.getAuthorById.mockResolvedValue(err(ERRORS.AUTHOR_NOT_FOUND));

      // Act
      const result = await deleteAuthor(authorID);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.AUTHOR_NOT_FOUND);
      }
    });

    it("should return error when author has articles", async () => {
      // Arrange
      const authorID = 1;

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.getAuthorArticlesCount.mockResolvedValue(ok(5));

      // Act
      const result = await deleteAuthor(authorID);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.AUTHOR_CANNOT_BE_DELETED_ARTICLES_FOUND);
      }
    });

    it("should handle database error when checking article count", async () => {
      // Arrange
      const authorID = 1;

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.getAuthorArticlesCount.mockResolvedValue(err(ERRORS.DATABASE_ERROR));

      // Act
      const result = await deleteAuthor(authorID);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.DATABASE_ERROR);
      }
    });

    it("should handle database error during deletion", async () => {
      // Arrange
      const authorID = 1;

      mockAuthorRepository.getAuthorById.mockResolvedValue(ok(mockAuthor));
      mockAuthorRepository.getAuthorArticlesCount.mockResolvedValue(ok(0));
      mockAuthorRepository.deleteAuthor.mockResolvedValue(err(ERRORS.DATABASE_ERROR));

      // Act
      const result = await deleteAuthor(authorID);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe(ERRORS.DATABASE_ERROR);
      }
    });
  });
});
