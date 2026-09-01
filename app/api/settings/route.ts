import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.garageSettings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();

    const existing = await prisma.garageSettings.findFirst();

    const payload = {
      garageName: data.garageName !== undefined ? data.garageName : undefined,
      address: data.address !== undefined ? data.address : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      email: data.email !== undefined ? data.email : undefined,
      website: data.website !== undefined ? data.website : undefined,
      currency: data.currency !== undefined ? data.currency : undefined,
      currencySymbol: data.currencySymbol !== undefined ? data.currencySymbol : undefined,
      taxName: data.taxName !== undefined ? data.taxName : undefined,
      taxRate: data.taxRate !== undefined && data.taxRate !== "" ? parseFloat(data.taxRate) : undefined,
      receiptFooter: data.receiptFooter !== undefined ? data.receiptFooter : undefined,
    };

    let settings;
    if (existing) {
      settings = await prisma.garageSettings.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      settings = await prisma.garageSettings.create({
        data: {
          garageName: data.garageName || "NEETEL AUTOSPARES",
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          currency: data.currency || "USD",
          currencySymbol: data.currencySymbol || "$",
          taxName: data.taxName || "Tax",
          taxRate: data.taxRate !== undefined && data.taxRate !== "" ? parseFloat(data.taxRate) : 0,
          receiptFooter: data.receiptFooter || null,
        },
      });
    }

    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          module: "Settings",
          description: "Updated system settings",
        },
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
