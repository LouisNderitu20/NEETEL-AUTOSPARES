import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Zoho Domain Verification</title></head><body>23494688</body></html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
