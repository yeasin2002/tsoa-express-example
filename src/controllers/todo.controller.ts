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
  CreateTodoRequest,
  Todo,
  UpdateTodoRequest,
} from "../models/todo.ts";

@Route("todos")
export class TodoController extends Controller {
  /**
   * Get all todos with optional filtering
   * @param user_id Filter by user ID
   * @param completed Filter by completion status
   * @param limit Maximum number of todos to return
   * @param offset Number of todos to skip
   */
  @Get("/")
  @SuccessResponse("200", "Todos retrieved successfully")
  @Response<ErrorResponse>("500", "Internal server error")
  public async listTodos(
    @Query() user_id?: number,
    @Query() completed?: boolean,
    @Query() limit: number = 100,
    @Query() offset: number = 0
  ): Promise<Todo[]> {
    try {
      let sql = "SELECT * FROM todos WHERE 1=1";
      const params: any[] = [];

      if (user_id !== undefined) {
        sql += " AND user_id = ?";
        params.push(user_id);
      }

      if (completed !== undefined) {
        sql += " AND completed = ?";
        params.push(completed ? 1 : 0);
      }

      sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const query = db.query<Todo, any[]>(sql);
      return query.all(...params);
    } catch (error) {
      this.setStatus(500);
      throw new Error("Failed to retrieve todos");
    }
  }

  /**
   * Get a specific todo by ID
   * @param id Todo ID
   */
  @Get("/{id}")
  @SuccessResponse("200", "Todo retrieved successfully")
  @Response<ErrorResponse>("404", "Todo not found")
  @Response<ErrorResponse>("500", "Internal server error")
  public async getTodo(@Path() id: number): Promise<Todo> {
    try {
      const query = db.query<Todo, [number]>(
        "SELECT * FROM todos WHERE id = ?1"
      );
      const todo = query.get(id);

      if (!todo) {
        this.setStatus(404);
        throw new Error("Todo not found");
      }

      return todo;
    } catch (error) {
      if (this.getStatus() === 404) throw error;
      this.setStatus(500);
      throw new Error("Failed to retrieve todo");
    }
  }

  /**
   * Get all todos for a specific user
   * @param userId User ID
   * @param completed Filter by completion status
   */
  @Get("/user/{userId}")
  @SuccessResponse("200", "User todos retrieved successfully")
  @Response<ErrorResponse>("500", "Internal server error")
  public async getUserTodos(
    @Path() userId: number,
    @Query() completed?: boolean
  ): Promise<Todo[]> {
    try {
      let sql = "SELECT * FROM todos WHERE user_id = ?1";
      const params: any[] = [userId];

      if (completed !== undefined) {
        sql += " AND completed = ?2";
        params.push(completed ? 1 : 0);
      }

      sql += " ORDER BY created_at DESC";

      const query = db.query<Todo, any[]>(sql);
      return query.all(...params);
      // oxlint-disable-next-line no-unused-vars
    } catch (error) {
      this.setStatus(500);
      throw new Error("Failed to retrieve user todos");
    }
  }

  /**
   * Create a new todo
   * @param body Todo creation data
   */
  @Post("/")
  @SuccessResponse("201", "Todo created successfully")
  @Response<ErrorResponse>("400", "Invalid request")
  @Response<ErrorResponse>("500", "Internal server error")
  public async createTodo(@Body() body: CreateTodoRequest): Promise<Todo> {
    try {
      // Verify user exists
      const userQuery = db.query("SELECT id FROM users WHERE id = ?1");
      const user = userQuery.get(body.user_id);

      if (!user) {
        this.setStatus(400);
        throw new Error("User not found");
      }

      const insertQuery = db.query(
        "INSERT INTO todos (user_id, title, description) VALUES (?1, ?2, ?3)"
      );
      const result = insertQuery.run(
        body.user_id,
        body.title,
        body.description || null
      );

      const selectQuery = db.query<Todo, [number]>(
        "SELECT * FROM todos WHERE id = ?1"
      );
      const todo = selectQuery.get(result.lastInsertRowid as number);

      if (!todo) {
        this.setStatus(500);
        throw new Error("Failed to create todo");
      }

      this.setStatus(201);
      return todo;
    } catch (error: any) {
      if (this.getStatus() === 400) throw error;
      this.setStatus(500);
      throw new Error("Failed to create todo");
    }
  }

  /**
   * Update an existing todo
   * @param id Todo ID
   * @param body Todo update data
   */
  @Put("/{id}")
  @SuccessResponse("200", "Todo updated successfully")
  @Response<ErrorResponse>("404", "Todo not found")
  @Response<ErrorResponse>("500", "Internal server error")
  public async updateTodo(
    @Path() id: number,
    @Body() body: UpdateTodoRequest
  ): Promise<Todo> {
    try {
      // Check if todo exists
      const checkQuery = db.query<Todo, [number]>(
        "SELECT * FROM todos WHERE id = ?1"
      );
      const existingTodo = checkQuery.get(id);

      if (!existingTodo) {
        this.setStatus(404);
        throw new Error("Todo not found");
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (body.title !== undefined) {
        updates.push("title = ?");
        values.push(body.title);
      }
      if (body.description !== undefined) {
        updates.push("description = ?");
        values.push(body.description);
      }
      if (body.completed !== undefined) {
        updates.push("completed = ?");
        values.push(body.completed ? 1 : 0);
      }

      if (updates.length === 0) {
        return existingTodo;
      }

      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      const updateQuery = db.query(
        `UPDATE todos SET ${updates.join(", ")} WHERE id = ?${values.length}`
      );
      updateQuery.run(...values);

      const selectQuery = db.query<Todo, [number]>(
        "SELECT * FROM todos WHERE id = ?1"
      );
      const todo = selectQuery.get(id);

      if (!todo) {
        this.setStatus(500);
        throw new Error("Failed to update todo");
      }

      return todo;
    } catch (error) {
      if (this.getStatus() === 404) throw error;
      this.setStatus(500);
      throw new Error("Failed to update todo");
    }
  }

  /**
   * Delete a todo
   * @param id Todo ID
   */
  @Delete("/{id}")
  @SuccessResponse("204", "Todo deleted successfully")
  @Response<ErrorResponse>("404", "Todo not found")
  @Response<ErrorResponse>("500", "Internal server error")
  public async deleteTodo(@Path() id: number): Promise<void> {
    try {
      const checkQuery = db.query<Todo, [number]>(
        "SELECT * FROM todos WHERE id = ?1"
      );
      const todo = checkQuery.get(id);

      if (!todo) {
        this.setStatus(404);
        throw new Error("Todo not found");
      }

      const deleteQuery = db.query("DELETE FROM todos WHERE id = ?1");
      deleteQuery.run(id);

      this.setStatus(204);
    } catch (error) {
      if (this.getStatus() === 404) throw error;
      this.setStatus(500);
      throw new Error("Failed to delete todo");
    }
  }
}
