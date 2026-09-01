import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  phone2: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  company: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
  creditLimit: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        jobCards: {
          orderBy: { createdAt: "desc" },
          include: {
            vehicle: true,
            mechanic: { select: { name: true } },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["IT_ADMIN", "OWNER", "MANAGER", "RECEPTIONIST", "CASHIER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        phone2: data.phone2 || null,
        email: data.email || null,
        address: data.address || null,
        company: data.company || null,
        idNumber: data.idNumber || null,
        notes: data.notes || null,
        creditLimit: data.creditLimit || 0,
        isActive: typeof data.isActive === "boolean" ? data.isActive : true,
      },
    });

    
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "Customer",
        description: `Updated customer: ${updatedCustomer.name}`,
        referenceId: updatedCustomer.id,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["IT_ADMIN", "OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    
    const jobCount = await prisma.jobCard.count({ where: { customerId: id } });
    if (jobCount > 0) {
      
      const customer = await prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Customer has job card history. Account deactivated successfully.",
        deactivated: true,
      });
    }

    await prisma.customer.delete({ where: { id } });

    
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "Customer",
        description: `Deleted customer ID: ${id}`,
      },
    });

    return NextResponse.json({ message: "Customer deleted successfully", deleted: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
