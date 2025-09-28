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
  const user = await getUserByEmail(email)
  
  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  
  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
