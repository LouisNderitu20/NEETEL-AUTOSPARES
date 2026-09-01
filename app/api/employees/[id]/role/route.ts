import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized. Only the owner can allocate roles." }, { status: 403 });
    }

    const { id } = await params;
    const { role } = await req.json();

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "OWNER" && role !== "OWNER") {
      const ownerCount = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: "Cannot downgrade the sole remaining Owner account." }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole },
    });

    return NextResponse.json({
      message: "Role updated successfully",
      user: { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role },
    });
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
