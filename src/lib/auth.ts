/**
 * NextAuth.js Configuration
 * Xử lý xác thực người dùng bằng Credentials (username + password)
 */

import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  // Dùng JWT strategy (không cần database session)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  },

  pages: {
    signIn: '/admin/login',   // Trang đăng nhập custom
    error: '/admin/login',    // Trang lỗi
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Vui lòng nhập username và password')
        }

        // Tìm user trong database
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          throw new Error('Tài khoản không tồn tại')
        }

        // Kiểm tra password
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Mật khẩu không đúng')
        }

        // Trả về thông tin user (sẽ được encode vào JWT)
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    // Thêm thông tin vào JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.displayName = (user as any).displayName
        token.role = (user as any).role
      }
      return token
    },

    // Thêm thông tin vào session object
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.displayName = token.displayName as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}

/**
 * Helper: Lấy session hiện tại trong Server Components / API Routes
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Helper: Kiểm tra user đã đăng nhập chưa
 * Dùng trong API routes để bảo vệ endpoints
 */
export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Helper: Kiểm tra user có phải admin không
 */
export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden: Admin only')
  }
  return session
}
