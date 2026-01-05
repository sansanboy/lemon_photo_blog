import { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authenticated = isAdmin();
  
  if (authenticated) {
    return Response.json({ authenticated: true });
  } else {
    return Response.json({ authenticated: false }, { status: 401 });
  }
}