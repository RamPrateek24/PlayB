import GoogleProvider from "next-auth/providers/google";
import NextAuth, { DefaultSession } from "next-auth";
import { prismaClient } from "@/app/lib/db";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
		} & DefaultSession["user"];
	}
}

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		}),
	],
	secret: process.env.NEXTAUTH_SECRET ?? "secret",
	callbacks: {
		async signIn({ user }) {
			if (!user.email) {
				console.error("Sign-in failed: No email returned from provider");
				return false;
			}

			try {
				const existingUser = await prismaClient.user.findUnique({
					where: { email: user.email },
				});

				if (existingUser) {
					return true;
				}

				await prismaClient.user.create({
					data: {
						email: user.email,
						provider: "Google",
					},
				});

				return true;
			} catch (error) {
				console.error("Sign-in error:", error);
				return false;
			}
		},

		async session({ session }) {
			try {
				const dbUser = await prismaClient.user.findUnique({
					where: {
						email: session.user.email as string,
					},
				});

				if (!dbUser) return session;

				return {
					...session,
					user: {
						...session.user,
						id: dbUser.id,
					},
				};
			} catch (error) {
				console.error("Session callback error:", error);
				return session;
			}
		},
	},
});

export { handler as GET, handler as POST };
