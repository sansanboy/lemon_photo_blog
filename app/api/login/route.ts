import { NextRequest } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const success = await login(username, password);

    if (success) {
      return Response.json({ message: "Login successful" });
    } else {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
