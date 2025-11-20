import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Response,
  Route,
  SuccessResponse,
} from "tsoa";
import { db } from "../lib/database.ts";
import type { ErrorResponse } from "../models/error.ts";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "../models/user.ts";

@Route("users")
export class UserController extends Controller {
  /**
   * Get all users with optional pagination
   * @param limit Maximum number of users to return
   * @param offset Number of users to skip
   */
  @Get("/")
  @SuccessResponse("200", "Users retrieved successfully")
  @Response<ErrorResponse>("500", "Internal server error")
  public async listUsers(
    @Query() limit: number = 100,
    @Query() offset: number = 0
  ): Promise<User[]> {
    try {
      const query = db.query<User, [number, number]>(
        "SELECT * FROM users ORDER BY created_at DESC LIMIT ?1 OFFSET ?2"
      );
      return query.all(limit, offset);
    } catch (error) {
      this.setStatus(500);
      throw new Error("Failed to retrieve users");
    }
  }

  /**
   * Get a specific user by ID
   * @param id User ID
   */
  @Get("/{id}")
  @SuccessResponse("200", "User retrieved successfully")
  @Response<ErrorResponse>("404", "User not found")
  @Response<ErrorResponse>("500", "Internal server error")
  public async getUser(@Path() id: number): Promise<User> {
    try {
      const query = db.query<User, [number]>(
        "SELECT * FROM users WHERE id = ?1"
      );
      const user = query.get(id);

      if (!user) {
        this.setStatus(404);
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      if (this.getStatus() === 404) throw error;
      this.setStatus(500);
      throw new Error("Failed to retrieve user");
    }
  }

  /**
   * Create a new user
   * @param requestBody User creation data
   */
  @Post("/")
  @SuccessResponse("201", "User created successfully")
  @Response<ErrorResponse>("400", "Invalid request")
  @Response<ErrorResponse>("500", "Internal server error")
  public async createUser(@Body() body: CreateUserRequest): Promise<User> {
    try {
      const insertQuery = db.query(
        "INSERT INTO users (name, email) VALUES (?1, ?2)"
      );
      const result = insertQuery.run(body.name, body.email);

      const selectQuery = db.query<User, [number]>(
        "SELECT * FROM users WHERE id = ?1"
      );
      const user = selectQuery.get(result.lastInsertRowid as number);

      if (!user) {
        this.setStatus(500);
        throw new Error("Failed to create user");
      }

      this.setStatus(201);
      return user;
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        this.setStatus(400);
        throw new Error("Email already exists");
      }
      this.setStatus(500);
      throw new Error("Failed to create user");
    }
  }

  /**
   * Update an existing user
   * @param id User ID
   * @param body User update data
   */
  @Put("/{id}")
  @SuccessResponse("200", "User updated successfully")
  @Response<ErrorResponse>("404", "User not found")
  @Response<ErrorResponse>("400", "Invalid request")
  @Response<ErrorResponse>("500", "Internal server error")
  public async updateUser(
    @Path() id: number,
    @Body() body: UpdateUserRequest
  ): Promise<User> {
    try {
      // Check if user exists
      const checkQuery = db.query<User, [number]>(
        "SELECT * FROM users WHERE id = ?1"
      );
      const existingUser = checkQuery.get(id);

      if (!existingUser) {
        this.setStatus(404);
        throw new Error("User not found");
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (body.name !== undefined) {
        updates.push("name = ?");
        values.push(body.name);
      }
      if (body.email !== undefined) {
        updates.push("email = ?");
        values.push(body.email);
      }

      if (updates.length === 0) {
        return existingUser;
      }

      values.push(id);
      const updateQuery = db.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?${values.length}`
      );
      updateQuery.run(...values);

      const selectQuery = db.query<User, [number]>(
        "SELECT * FROM users WHERE id = ?1"
      );
      const user = selectQuery.get(id);

      if (!user) {
        this.setStatus(500);
        throw new Error("Failed to update user");
      }

      return user;
    } catch (error: any) {
      if (this.getStatus() === 404) throw error;
      if (error.message?.includes("UNIQUE constraint")) {
        this.setStatus(400);
        throw new Error("Email already exists");
      }
      this.setStatus(500);
      throw new Error("Failed to update user");
    }
  }

  /**
   * Delete a user
   * @param id User ID
   */
  @Delete("/{id}")
  @SuccessResponse("204", "User deleted successfully")
  @Response<ErrorResponse>("404", "User not found")
  @Response<ErrorResponse>("500", "Internal server error")
  public async deleteUser(@Path() id: number): Promise<void> {
    try {
      const checkQuery = db.query<User, [number]>(
        "SELECT * FROM users WHERE id = ?1"
      );
      const user = checkQuery.get(id);

      if (!user) {
        this.setStatus(404);
        throw new Error("User not found");
      }

      const deleteQuery = db.query("DELETE FROM users WHERE id = ?1");
      deleteQuery.run(id);

      this.setStatus(204);
    } catch (error) {
      if (this.getStatus() === 404) throw error;
      this.setStatus(500);
      throw new Error("Failed to delete user");
    }
  }
}
