import apiClient from "./client"

export interface ClassStudent {
  id: string
  email: string | null
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  total_xp: number
  level: number
  created_at: string
  updated_at: string
}

export interface ClassData {
  id: string
  teacher_id: string
  institution_id: string | null
  name: string
  join_code: string
  is_active: boolean
  students: ClassStudent[]
  created_at: string
  updated_at: string
}

export async function getClasses(): Promise<ClassData[]> {
  const { data } = await apiClient.get<ClassData[]>("/api/v1/classes/")
  return data
}

export async function getClass(classId: string): Promise<ClassData> {
  const { data } = await apiClient.get<ClassData>(`/api/v1/classes/${classId}`)
  return data
}

export async function createClass(body: {
  name: string
  institution_id?: string
}): Promise<ClassData> {
  const { data } = await apiClient.post<ClassData>("/api/v1/classes/", body)
  return data
}

export async function updateClass(
  classId: string,
  body: { name?: string; is_active?: boolean }
): Promise<ClassData> {
  const { data } = await apiClient.put<ClassData>(
    `/api/v1/classes/${classId}`,
    body
  )
  return data
}

export async function deleteClass(classId: string): Promise<void> {
  await apiClient.delete(`/api/v1/classes/${classId}`)
}

export async function addStudentToClass(
  classId: string,
  studentId: string
): Promise<void> {
  await apiClient.post(`/api/v1/classes/${classId}/students`, {
    student_id: studentId,
  })
}

export async function removeStudentFromClass(
  classId: string,
  studentId: string
): Promise<void> {
  await apiClient.delete(`/api/v1/classes/${classId}/students/${studentId}`)
}
