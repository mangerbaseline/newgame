import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

export async function POST(req) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    
    // Check existing
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: 'Email address is already in use' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: 'User created' }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 })
  }
}
