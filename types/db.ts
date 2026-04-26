export type Role = 'user' | 'admin'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'
export type SubmissionStatus = 'success' | 'failure'
export type TargetType = 'task' | 'challenge'
export type ProgressStatus = 'unlocked' | 'solved'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  points: number
  role: Role
  created_at: string
}

export interface Room {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  order_index: number
  created_at: string
}

export interface Task {
  id: string
  room_id: string
  title: string
  description: string
  hints: string[]
  task_index: number
  points: number
  created_at: string
  // flag_hash is NOT included - never sent to client
}

export interface Challenge {
  id: string
  title: string
  category: string
  difficulty: Difficulty
  points: number
  description: string
  attachment_paths: string[]
  created_at: string
  // flag_hash is NOT included - never sent to client
}

export interface Submission {
  id: string
  user_id: string
  target_type: TargetType
  target_id: string
  status: SubmissionStatus
  created_at: string
}

export interface UserProgress {
  user_id: string
  room_id: string
  task_id: string
  status: ProgressStatus
  unlocked_at: string
  solved_at: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      rooms: {
        Row: Room
        Insert: Omit<Room, 'id' | 'created_at'>
        Update: Partial<Omit<Room, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task & { flag_hash: string }
        Insert: Omit<Task, 'id' | 'created_at'> & { flag_hash: string }
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
      challenges: {
        Row: Challenge & { flag_hash: string }
        Insert: Omit<Challenge, 'id' | 'created_at'> & { flag_hash: string }
        Update: Partial<Omit<Challenge, 'id' | 'created_at'>>
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, 'id' | 'created_at'>
        Update: never
      }
      user_progress: {
        Row: UserProgress
        Insert: UserProgress
        Update: Partial<Pick<UserProgress, 'status' | 'solved_at'>>
      }
    }
  }
}
