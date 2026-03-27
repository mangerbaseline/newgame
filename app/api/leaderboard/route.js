import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'daily' // daily, weekly, monthly

  const client = await clientPromise
  const db = client.db()
  
  const now = new Date()
  let startDate

  if (period === 'daily') {
    startDate = new Date(now.setHours(0, 0, 0, 0))
  } else if (period === 'weekly') {
    const day = now.getDay()
    startDate = new Date(now.setDate(now.getDate() - day))
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const scores = await db.collection('scores')
    .aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$userId", userName: { $first: "$userName" }, maxScore: { $max: "$score" } } },
      { $sort: { maxScore: -1 } },
      { $limit: 10 }
    ]).toArray()

  return NextResponse.json(scores)
}
