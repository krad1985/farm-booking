import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const venueId = (session.user as any).venueId;
  if (role !== "SYSTEM_ADMIN" && (role !== "MERCHANT_ADMIN" || venueId !== id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const venue = await prisma.venue.update({
    where: { id },
    data: {
      ...(body.intro !== undefined && { intro: body.intro }),
      ...(body.featureIntro !== undefined && { featureIntro: body.featureIntro }),
      ...(body.transportNote !== undefined && { transportNote: body.transportNote }),
      ...(body.facilities !== undefined && { facilities: body.facilities }),
    },
  });
  return NextResponse.json(venue);
}
