import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { validateStrongPassword } from "@/lib/password-validator";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "MANAGER", "IT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch employee." }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "MANAGER", "IT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { name, email, phone, role, password, isActive } = await req.json();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (targetUser.role === "IT_ADMIN" && session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Security Policy Violation: IT Administrator accounts cannot be modified by Garage Owners or Managers." }, { status: 403 });
    }

    if (targetUser.role === "OWNER" && !["OWNER", "IT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Security Policy Violation: Only Owners or IT Administrators can modify Owner accounts." }, { status: 403 });
    }

    let finalRole = targetUser.role;
    if (role && role !== targetUser.role) {
      if (!["OWNER", "IT_ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Only the Owner or IT Admin can change or allocate roles." }, { status: 403 });
      }
      if (role === "IT_ADMIN" && session.user.role !== "IT_ADMIN") {
        return NextResponse.json({ error: "Security Policy Violation: Only an IT Administrator can assign IT Admin privileges." }, { status: 403 });
      }
      if (targetUser.role === "OWNER" && role !== "OWNER" && session.user.role !== "IT_ADMIN") {
        const ownerCount = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
        if (ownerCount <= 1) {
          return NextResponse.json({ error: "Cannot downgrade the sole remaining active Owner account in the system." }, { status: 400 });
        }
      }
      finalRole = role as UserRole;
    }

    const requestedActiveState = typeof isActive === "boolean" ? isActive : targetUser.isActive;
    if (targetUser.id === session.user.id && !requestedActiveState) {
      return NextResponse.json({ error: "You cannot deactivate your own active session account." }, { status: 400 });
    }

    const updateData: any = {
      name: name || targetUser.name,
      email: email || targetUser.email,
      phone: phone !== undefined ? (phone || null) : targetUser.phone,
      role: finalRole,
      isActive: requestedActiveState,
    };

    if (password && password.trim() !== "") {
      if (session.user.role !== "IT_ADMIN" && session.user.id !== targetUser.id) {
        return NextResponse.json(
          { error: "Security Policy Violation: Password modifications for employees can strictly only be performed by the IT Administrator." },
          { status: 403 }
        );
      }
      const passwordValidation = validateStrongPassword(password, email || targetUser.email);
      if (!passwordValidation.isValid) {
        return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      if (
        (targetUser.role === "OWNER" && targetUser.isActive && !requestedActiveState) ||
        (targetUser.role === "OWNER" && finalRole !== "OWNER")
      ) {
        if (session.user.role !== "IT_ADMIN") {
          const activeOwners = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM users WHERE role = 'OWNER'::"UserRole" AND "isActive" = true FOR UPDATE
          `;
          if (activeOwners.length <= 1) {
            throw new Error("Cannot deactivate or downgrade the sole remaining active Owner account in the system.");
          }
        }
      }

      return await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
        },
      });
    });

    return NextResponse.json({
      message: "Employee updated successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: error.message || "Failed to update employee." }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "IT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized. Only the owner or IT Admin can delete employees." }, { status: 403 });
    }

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (targetUser.role === "IT_ADMIN" && session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Security Policy Violation: IT Administrator accounts cannot be deleted by Garage Owners." }, { status: 403 });
    }

    if (targetUser.id === session.user.id || targetUser.email === session.user.email) {
      return NextResponse.json({ error: "You cannot delete your own logged-in account." }, { status: 400 });
    }

    if (targetUser.role === "OWNER" && session.user.role !== "IT_ADMIN") {
      const ownerCount = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the sole remaining Owner account in the system." }, { status: 400 });
      }
    }

    const [jobsCreated, jobsAssigned, stockMoved, POsCreated] = await Promise.all([
      prisma.jobCard.count({ where: { createdById: id } }),
      prisma.jobCard.count({ where: { mechanicId: id } }),
      prisma.stockMovement.count({ where: { userId: id } }),
      prisma.purchaseOrder.count({ where: { createdById: id } }),
    ]);

    const hasLinkedRecords = jobsCreated > 0 || jobsAssigned > 0 || stockMoved > 0 || POsCreated > 0;

    if (hasLinkedRecords) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Employee has active history. Account has been deactivated to preserve garage records.",
        deactivated: true,
      });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      message: "Employee deleted successfully from the system.",
      deleted: true,
    });
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee." }, { status: 500 });
  }
}
