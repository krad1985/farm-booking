import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  const gukeng = await prisma.venue.upsert({
    where: { slug: "gukeng" },
    update: {},
    create: {
      name: "古坑大自然莊園",
      slug: "gukeng",
      intro: "位於雲林古坑的自然莊園，提供導覽、體驗與用餐行程。",
      photos: JSON.stringify([]),
      facilities: "停車場、餐廳、教室、步道",
      contact: JSON.stringify({ phone: "05-xxx-xxxx", address: "雲林縣古坑鄉" }),
      transportNote: "自行開車或遊覽車，園區備有大型停車場。",
    },
  });

  const guanmiao = await prisma.venue.upsert({
    where: { slug: "guanmiao" },
    update: {},
    create: {
      name: "關廟護生園區",
      slug: "guanmiao",
      intro: "位於台南關廟的護生園區，提供生命教育與自然體驗。",
      photos: JSON.stringify([]),
      facilities: "停車場、教室、步道、護生園",
      contact: JSON.stringify({ phone: "06-xxx-xxxx", address: "台南市關廟區" }),
      transportNote: "自行開車或遊覽車。",
    },
  });

  const gkTemplates = [
    { type: "FULL_DAY", title: "全天行程（含午晚餐）", price: 1200 },
    { type: "HALF_AM_LUNCH", title: "半天上午（含午餐）", price: 600 },
    { type: "HALF_PM_DINNER", title: "半天下午（含晚餐）", price: 700 },
  ];
  for (const t of gkTemplates) {
    await prisma.itineraryTemplate.upsert({
      where: { id: `gk-${t.type}` },
      update: {},
      create: {
        id: `gk-${t.type}`,
        venueId: gukeng.id,
        type: t.type,
        title: t.title,
        description: `${gukeng.name} - ${t.title}`,
        schedule: JSON.stringify([]),
        price: t.price,
        meal: t.type === "FULL_DAY" ? "午晚餐" : t.type === "HALF_AM_LUNCH" ? "午餐" : "晚餐",
        isActive: true,
      },
    });
  }

  const gmTemplates = [
    { type: "FULL_DAY", title: "全天行程（含午晚餐）", price: 1100 },
    { type: "HALF_AM_LUNCH", title: "半天上午（含午餐）", price: 550 },
    { type: "HALF_PM_DINNER", title: "半天下午（含晚餐）", price: 650 },
  ];
  for (const t of gmTemplates) {
    await prisma.itineraryTemplate.upsert({
      where: { id: `gm-${t.type}` },
      update: {},
      create: {
        id: `gm-${t.type}`,
        venueId: guanmiao.id,
        type: t.type,
        title: t.title,
        description: `${guanmiao.name} - ${t.title}`,
        schedule: JSON.stringify([]),
        price: t.price,
        meal: t.type === "FULL_DAY" ? "午晚餐" : t.type === "HALF_AM_LUNCH" ? "午餐" : "晚餐",
        isActive: true,
      },
    });
  }

  const ts = await prisma.trainingSystem.upsert({
    where: { id: "ts-default" },
    update: {},
    create: { id: "ts-default", name: "福智團體儲訓課程" },
  });

  const classroom = await prisma.classroom.upsert({
    where: { id: "cls-yunlin" },
    update: {},
    create: { id: "cls-yunlin", trainingSystemId: ts.id, name: "雲林教室" },
  });

  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "系統管理員", passwordHash: adminHash, role: "SYSTEM_ADMIN" },
  });

  const merchantHash = await bcrypt.hash("merchant123", 10);
  await prisma.user.upsert({
    where: { email: "gukeng@example.com" },
    update: {},
    create: { email: "gukeng@example.com", name: "古坑莊園管理", passwordHash: merchantHash, role: "MERCHANT_ADMIN", venueId: gukeng.id },
  });

  const classroomHash = await bcrypt.hash("classroom123", 10);
  await prisma.user.upsert({
    where: { email: "yunlin@example.com" },
    update: {},
    create: { email: "yunlin@example.com", name: "雲林教室管理", passwordHash: classroomHash, role: "CLASSROOM_ADMIN", classroomId: classroom.id },
  });

  const formFields = [
    { key: "name", label: "姓名", type: "text", required: true },
    { key: "idNumber", label: "身分證字號", type: "text", required: true, visibility: "classroom_only" },
    { key: "birthDate", label: "出生日期", type: "date", required: true, visibility: "classroom_only" },
    { key: "phone", label: "電話", type: "text", required: true },
    { key: "emergencyContact", label: "緊急聯絡人", type: "text", required: true, visibility: "classroom_only" },
    { key: "emergencyPhone", label: "緊急聯絡電話", type: "text", required: true, visibility: "classroom_only" },
    { key: "mealPreference", label: "餐點偏好", type: "select", options: ["一般", "素食", "清真"], required: true },
    { key: "specialDiet", label: "特殊飲食/過敏", type: "textarea", required: false },
    { key: "transport", label: "交通方式", type: "select", options: ["自行前往", "搭乘遊覽車"], required: true },
  ];

  await prisma.formTemplate.upsert({
    where: { id: "tpl-insurance" },
    update: {},
    create: {
      id: "tpl-insurance",
      scope: "SYSTEM",
      name: "保險報名表（預設）",
      description: "含個資、緊急聯絡人、飲食需求",
      fields: JSON.stringify(formFields),
      isDefault: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });