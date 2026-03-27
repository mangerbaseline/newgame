import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from '@/lib/mongodb'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const client = await clientPromise
  const db = client.db()
  const user = await db.collection('users').findOne({ email: session.user.email })

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  const today = new Date().toDateString()
  const lastPlayed = user.lastPlayed || ""
  let attemptsLeft = user.attemptsLeft ?? 3

  // Reset if new day
  if (lastPlayed !== today) {
    attemptsLeft = 3
    await db.collection('users').updateOne(
      { email: session.user.email },
      { $set: { lastPlayed: today, attemptsLeft: 3 } }
    )
  }

  return NextResponse.json({ attemptsLeft, totalScore: user.totalScore || 0 })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { score, updateAttempt } = await req.json()
  const client = await clientPromise
  const db = client.db()
  const today = new Date().toDateString()

  const user = await db.collection('users').findOne({ email: session.user.email })
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  const update = { $set: { lastPlayed: today } }
  
  if (updateAttempt) {
    update.$set.attemptsLeft = Math.max(0, (user.attemptsLeft ?? 3) - 1)
  }
  
  if (score !== undefined) {
    update.$set.totalScore = (user.totalScore || 0) + score
    // Also log the score in the scores collection for leaderboard
    await db.collection('scores').insertOne({
        userId: user._id,
        userName: user.name,
        score: score,
        createdAt: new Date()
    })
  }

  await db.collection('users').updateOne({ email: session.user.email }, update)
  const updatedUser = await db.collection('users').findOne({ email: session.user.email })

  return NextResponse.json({ attemptsLeft: updatedUser.attemptsLeft, totalScore: updatedUser.totalScore })
}
