import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Generating test data...");

  const ts = await prisma.trainingSystem.findFirst({ where: { id: "ts-default" } });
  if (!ts) throw new Error("No training system found");

  // Create additional classrooms
  const classroomNames = ["台北教室", "台中教室", "高雄教室", "新竹教室", "台南教室"];
  const classrooms: any[] = [];
  for (const name of classroomNames) {
    const c = await prisma.classroom.upsert({
      where: { id: `cls-${name}` },
      update: {},
      create: { id: `cls-${name}`, trainingSystemId: ts.id, name },
    });
    classrooms.push(c);
    // Create classroom admin
    const hash = await bcrypt.hash("classroom123", 10);
    await prisma.user.upsert({
      where: { email: `${name}@example.com` },
      update: {},
      create: { email: `${name}@example.com`, name: `${name}管理`, passwordHash: hash, role: "CLASSROOM_ADMIN", classroomId: c.id },
    });
  }
  // Add original classroom
  const origClassroom = await prisma.classroom.findUnique({ where: { id: "cls-yunlin" } });
  if (origClassroom) classrooms.push(origClassroom);

  // Create students for each classroom
  const firstNames = ["志明", "春嬌", "大華", "小美", "阿強", "雅婷", "建國", "淑芬", "文龍", "美玲"];
  const lastNames = ["王", "李", "張", "陳", "林", "黃", "吳", "劉", "蔡", "楊"];
  for (const cls of classrooms) {
    for (let i = 0; i < 25; i++) {
      const code = `${cls.id.replace("cls-", "").substring(0, 2).toUpperCase()}${String(i + 1).padStart(3, "0")}`;
      await prisma.student.upsert({
        where: { classroomId_studentCode: { classroomId: cls.id, studentCode: code } },
        update: {},
        create: {
          classroomId: cls.id,
          studentCode: code,
          name: `${lastNames[i % lastNames.length]}${firstNames[i % firstNames.length]}`,
          phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
        },
      });
    }
  }

  // Get slots
  const slots = await prisma.slot.findMany({ include: { itineraryTemplate: true, venue: true } });

  // Create bookings for each classroom (mix of slots)
  const statuses = ["PENDING", "CONFIRMED", "REGISTRATION_OPEN", "FINALIZED"];
  const defaultForm = await prisma.formTemplate.findFirst({ where: { isDefault: true } });

  for (let ci = 0; ci < classrooms.length; ci++) {
    const cls = classrooms[ci];
    // Each classroom books 2-3 slots
    const numBookings = 2 + (ci % 2);
    for (let bi = 0; bi < numBookings; bi++) {
      const slot = slots[(ci * 3 + bi) % slots.length];
      const status = statuses[(ci + bi) % statuses.length];
      const booking = await prisma.booking.create({
        data: {
          classroomId: cls.id,
          slotId: slot.id,
          estimatedHeadcount: 15 + Math.floor(Math.random() * 20),
          status,
          registrationOpen: status === "REGISTRATION_OPEN" || status === "FINALIZED",
          registrationLink: `test-${cls.id}-${bi}`,
          registrationDeadline: new Date("2026-10-01"),
          overrideFormTemplateId: defaultForm?.id,
        },
      });

      // Create registrations for open/finalized bookings
      if (status === "REGISTRATION_OPEN" || status === "FINALIZED") {
        const students = await prisma.student.findMany({ where: { classroomId: cls.id }, take: 12 + Math.floor(Math.random() * 8) });
        const regStatuses = ["SUBMITTED", "CONFIRMED", "PAID"];
        for (const stu of students) {
          await prisma.registration.create({
            data: {
              bookingId: booking.id,
              studentId: stu.id,
              submittedById: (await prisma.user.findFirst({ where: { classroomId: cls.id } }))?.id || "",
              formData: JSON.stringify({
                name: stu.name,
                idNumber: `A${String(Math.floor(Math.random() * 1000000000)).padStart(9, "0")}`,
                birthDate: "1990-01-01",
                phone: stu.phone,
                emergencyContact: "緊急聯絡人",
                emergencyPhone: "0987654321",
                mealPreference: ["一般", "素食", "清真"][Math.floor(Math.random() * 3)],
                specialDiet: Math.random() > 0.7 ? "不吃辣" : "",
                transport: Math.random() > 0.5 ? "自行前往" : "搭乘遊覽車",
              }),
              status: regStatuses[Math.floor(Math.random() * regStatuses.length)],
            },
          });
        }
      }
    }
  }

  console.log("Test data generated successfully!");
  console.log(`Classrooms: ${classrooms.length}`);
  console.log(`Students: ${classrooms.length * 25}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
