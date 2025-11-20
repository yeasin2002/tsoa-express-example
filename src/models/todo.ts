export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  user_id: number;
  title: string;
  description?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}
