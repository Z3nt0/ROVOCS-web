import bcrypt from 'bcryptjs'
import prisma from '../database/prisma'

export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return user
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

export async function validateUser(email: string, password: string): Promise<User | null> {
  try {
    console.log('Validating user with email:', email)
    
    const user = await getUserByEmail(email)
    console.log('User found:', !!user)
    
    if (!user) {
      console.log('User not found in database')
      return null
    }

    console.log('Verifying password...')
    const isValid = await verifyPassword(password, user.passwordHash)
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      console.log('Invalid password')
      return null
    }

    console.log('User validation successful')
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  } catch (error) {
    console.error('Error in validateUser:', error)
    return null
  }
}
