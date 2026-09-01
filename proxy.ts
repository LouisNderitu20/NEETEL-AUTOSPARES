import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_DASHBOARDS } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  
  const publicRoutes = ["/login", "/api/auth"];
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    
    if (session && pathname === "/login") {
      const role = session.user?.role as UserRole;
      const dashboardPath = ROLE_DASHBOARDS[role] || "/dashboard/overview";
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }
    return NextResponse.next();
  }

  
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  
  if (pathname === "/") {
    if (session) {
      const role = session.user?.role as UserRole;
      const dashboardPath = ROLE_DASHBOARDS[role] || "/dashboard/overview";
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
