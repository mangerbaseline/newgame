import CredentialsProvider from "next-auth/providers/credentials"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password")
        }
        
        const client = await clientPromise
        const db = client.db()
        const user = await db.collection("users").findOne({ email: credentials.email })
        
        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }
        
        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials")
        }
        
        return { id: user._id.toString(), email: user.email, name: user.name }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: '/' },
  secret: process.env.NEXTAUTH_SECRET,
}
