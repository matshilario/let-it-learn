"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  UserPlus,
  Loader2,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useClass,
  useAddStudentToClass,
  useRemoveStudentFromClass,
} from "@/lib/hooks/use-classes"

export default function ClassDetailPage() {
  const params = useParams()
  const classId = params.classId as string
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)

  const { data: classData, isLoading, error } = useClass(classId)
  const addStudent = useAddStudentToClass()
  const removeStudent = useRemoveStudentFromClass()

  const handleCopyCode = () => {
    if (classData?.join_code) {
      navigator.clipboard.writeText(classData.join_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleAddStudent = async () => {
    if (!studentId.trim()) return
    try {
      await addStudent.mutateAsync({ classId, studentId: studentId.trim() })
      setStudentId("")
      setAddStudentOpen(false)
    } catch {
      // handled by react-query
    }
  }

  const handleRemoveStudent = async (sid: string) => {
    try {
      await removeStudent.mutateAsync({ classId, studentId: sid })
    } catch {
      // handled by react-query
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (error || !classData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-destructive">
          Erro ao carregar turma. Tente novamente.
        </p>
      </div>
    )
  }

  const students = classData.students ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" render={<Link href="/classes" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {classData.name}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{students.length} alunos</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline"
              onClick={handleCopyCode}
            >
              Codigo: {classData.join_code}
              {copiedCode ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
            <Badge variant={classData.is_active ? "default" : "secondary"}>
              {classData.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => setAddStudentOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>

      {/* Gradebook */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alunos da Turma</CardTitle>
              <CardDescription>
                Lista de alunos matriculados nesta turma
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Nenhum aluno nesta turma ainda.
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Compartilhe o codigo <strong>{classData.join_code}</strong> com
                seus alunos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">XP</TableHead>
                    <TableHead className="text-center">Nivel</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.full_name || student.nickname || "Sem nome"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {student.email || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.total_xp}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.level}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveStudent(student.id)}
                          disabled={removeStudent.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={(open) => { if (!open) { setAddStudentOpen(false); setStudentId("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Aluno</DialogTitle>
            <DialogDescription>
              Insira o ID do aluno para adiciona-lo a esta turma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="student-id">ID do Aluno</Label>
              <Input
                id="student-id"
                placeholder="ID do aluno (UUID)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddStudent() }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddStudentOpen(false); setStudentId("") }}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={!studentId.trim() || addStudent.isPending}
            >
              {addStudent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
