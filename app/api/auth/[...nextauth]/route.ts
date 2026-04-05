import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/admin/auth/authOptions";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
