import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          )

          if (!res.ok) return null

          const tokens = await res.json()

          const meRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/me`,
            {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
          )

          if (!meRes.ok) return null

          const teacher = await meRes.json()

          return {
            id: teacher.id,
            email: teacher.email,
            name: teacher.full_name,
            image: teacher.avatar_url,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          }
        } catch {
          return null
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as unknown as Record<string, unknown>).accessToken
        token.refreshToken = (user as unknown as Record<string, unknown>).refreshToken
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.id
        ;(session as unknown as Record<string, unknown>).accessToken = token.accessToken
        ;(session as unknown as Record<string, unknown>).refreshToken = token.refreshToken
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
