import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const cookiesToClear = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "authjs.csrf-token",
      "__Host-authjs.csrf-token",
      "next-auth.csrf-token",
      "__Host-next-auth.csrf-token",
      "authjs.callback-url",
      "__Secure-authjs.callback-url",
    ];

    for (const cookieName of cookiesToClear) {
      try {
        cookieStore.delete(cookieName);
        cookieStore.set(cookieName, "", {
          maxAge: 0,
          expires: new Date(0),
          path: "/",
        });
      } catch (e) {
        // ignore individual cookie clear errors
      }
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout cookie clear error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
