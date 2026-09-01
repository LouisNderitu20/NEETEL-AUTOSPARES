import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { validateStrongPassword } from "@/lib/password-validator";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, phone, role, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    
    
    let finalRole: UserRole = UserRole.RECEPTIONIST;
    if (["OWNER", "IT_ADMIN"].includes(session.user.role) && role) {
      if (role === "IT_ADMIN" && session.user.role !== "IT_ADMIN") {
        return NextResponse.json({ error: "Security Policy Violation: Only an IT Administrator can assign IT Admin privileges." }, { status: 403 });
      }
      finalRole = role as UserRole;
    }

    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered." }, { status: 400 });
    }

    
    const passwordValidation = validateStrongPassword(password, email);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);

    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        phone: phone || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Employee created successfully.",
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee." }, { status: 500 });
  }
}
