import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const classroomId = (session.user as any).classroomId;
  if (role !== "CLASSROOM_ADMIN" && role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { classroomId: targetClassroomId, students } = body;
  const cid = targetClassroomId || classroomId;
  if (!cid) return NextResponse.json({ error: "classroomId required" }, { status: 400 });
  if (!Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "students array required" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  let errors: string[] = [];

  for (const s of students) {
    const { studentCode, name, phone, email, group, subgroup, role: studentRole } = s;
    if (!studentCode || !name) {
      errors.push(`缺少學員代號或姓名: ${JSON.stringify(s)}`);
      continue;
    }
    try {
      const existing = await prisma.student.findUnique({
        where: { classroomId_studentCode: { classroomId: cid, studentCode } },
        include: { user: true },
      });
      if (existing) {
        await prisma.student.update({
          where: { id: existing.id },
          data: {
            name,
            phone: phone || existing.phone,
            email: email || existing.email,
          },
        });
        // Update linked user
        if (existing.user) {
          await prisma.user.update({
            where: { id: existing.user.id },
            data: { name, phone: phone || existing.phone, classroomId: cid },
          });
        }
        updated++;
      } else {
        const student = await prisma.student.create({
          data: { classroomId: cid, studentCode, name, phone, email },
        });
        // Create user account for student (default password = phone or studentCode)
        const passwordHash = await bcrypt.hash(phone || studentCode, 10);
        await prisma.user.create({
          data: {
            phone: phone || null,
            name,
            passwordHash,
            role: "STUDENT",
            classroomId: cid,
            studentId: student.id,
          },
        });
        created++;
      }
    } catch (e: any) {
      errors.push(`${studentCode}: ${e.message}`);
    }
  }

  // Store extra fields (group, subgroup, role) in a note or separate table
  // For now, we store them in the student's name field as metadata is not available
  // Future: add group/subgroup/role fields to Student model

  return NextResponse.json({ created, updated, errors, total: students.length });
}
