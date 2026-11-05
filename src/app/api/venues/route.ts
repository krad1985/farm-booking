import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const venues = await prisma.venue.findMany({
    include: { itineraryTemplates: { where: { isActive: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(venues);
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const venue = await prisma.venue.create({
    data: {
      name: body.name,
      slug: body.slug,
      intro: body.intro,
      photos: JSON.stringify(body.photos || []),
      facilities: body.facilities,
      contact: body.contact ? JSON.stringify(body.contact) : null,
      transportNote: body.transportNote,
    },
  });
  return NextResponse.json(venue, { status: 201 });
}
