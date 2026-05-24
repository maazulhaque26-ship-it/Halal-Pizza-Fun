import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

// next-auth v4 returns a handler that is directly compatible with the
// Next.js App Router. Simply export it as GET and POST — next-auth
// resolves params internally. Wrapping it in async functions and calling
// handler(req, {params}) breaks it because that call signature is invalid.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

