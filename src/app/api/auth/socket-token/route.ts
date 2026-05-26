import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

// Returns a short-lived JWT for socket.io authentication.
// The socket server verifies this with the same NEXTAUTH_SECRET.
// Needed because the NextAuth session cookie is SameSite=Lax and won't
// cross-origin to the Render socket server.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = jwt.sign(
    {
      id: session.user.id,
      role: session.user.role,
      branchId: session.user.branchId ?? null,
    },
    env.NEXTAUTH_SECRET,
    { expiresIn: "2h" }
  );

  return NextResponse.json({ token });
}
