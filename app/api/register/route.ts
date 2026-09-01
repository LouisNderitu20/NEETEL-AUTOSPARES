import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { validateStrongPassword } from "@/lib/password-validator";

export async function POST() {
  return NextResponse.json(
    {
      error: "Public self-registration is disabled for this internal management system. Please contact your system Owner or Administrator to create your staff credentials.",
    },
    { status: 403 }
  );
}
