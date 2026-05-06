/**
 * Mở rộng types của NextAuth để thêm các field custom
 */

import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      displayName: string
      role: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    username: string
    displayName: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    displayName: string
    role: string
  }
}
