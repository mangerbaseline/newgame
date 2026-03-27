import ReactionGame from '@/components/ReactionGame'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AuthScreen from '@/components/AuthScreen'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <AuthScreen />
  }

  // The ReactionGame component holds all the client-side logic we wrote earlier
  return (
    <main className="w-full h-screen overflow-hidden bg-black text-white m-0 p-0">
      <ReactionGame />
    </main>
  )
}
