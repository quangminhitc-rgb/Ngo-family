/**
 * Admin Accounts - Quản lý tài khoản (chỉ Admin)
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Edit2, Trash2, X, Check, Shield, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Account {
  id: string
  username: string
  displayName: string
  role: string
  createdAt: string
  _count: { photos: number }
}

const emptyForm = {
  username: '',
  displayName: '',
  password: '',
  role: 'member',
}

export default function AdminAccountsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<Account | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session && session.user.role !== 'admin') {
      router.push('/admin/dashboard')
    } else {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingUser(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (user: Account) => {
    setForm({
      username: user.username,
      displayName: user.displayName,
      password: '',
      role: user.role,
    })
    setEditingUser(user)
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    setError('')
    if (!form.displayName.trim()) {
      setError('Vui lòng nhập tên hiển thị')
      return
    }
    if (!editingUser && (!form.username.trim() || !form.password.trim())) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    setSaving(true)
    try {
      const url = editingUser ? `/api/accounts/${editingUser.id}` : '/api/accounts'
      const method = editingUser ? 'PATCH' : 'POST'
      const body = editingUser
        ? { displayName: form.displayName, role: form.role, ...(form.password && { password: form.password }) }
        : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Lỗi server')
        return
      }

      setShowForm(false)
      fetchUsers()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: Account) => {
    if (user.id === session?.user.id) return
    if (!confirm(`Xóa tài khoản "${user.displayName}"?`)) return
    const res = await fetch(`/api/accounts/${user.id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== user.id))
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tài khoản</h1>
          <p className="text-[#666] text-sm mt-1">{users.length} thành viên</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] transition-all"
        >
          <Plus size={17} />
          Thêm tài khoản
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#222] transition-all group"
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                user.role === 'admin'
                  ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30'
                  : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]'
              }`}>
                {user.displayName[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{user.displayName}</p>
                  {user.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#c9a84c]/15 text-[#c9a84c] font-medium border border-[#c9a84c]/20">
                      Admin
                    </span>
                  )}
                  {user.id === session?.user.id && (
                    <span className="text-xs text-[#555]">(bạn)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-[#555]">@{user.username}</span>
                  <span className="text-xs text-[#555]">{user._count.photos} ảnh</span>
                  <span className="text-xs text-[#555]">Tham gia {formatDate(user.createdAt)}</span>
                </div>
              </div>

              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(user)}
                  className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                {user.id !== session?.user.id && (
                  <button
                    onClick={() => handleDelete(user)}
                    className="w-8 h-8 rounded-lg bg-[#e05252]/10 flex items-center justify-center text-[#e05252] hover:bg-[#e05252]/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-md shadow-modal animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
              <h3 className="font-semibold text-white">
                {editingUser ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Username (chỉ khi tạo mới) */}
              {!editingUser && (
                <div>
                  <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                    placeholder="VD: nguyen_van_a"
                    className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40"
                  />
                </div>
              )}

              {/* Display name */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Tên hiển thị *
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Mật khẩu {editingUser ? '(để trống nếu không đổi)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editingUser ? '••••••' : 'Tối thiểu 6 ký tự'}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs text-[#666] mb-2 font-medium uppercase tracking-wide">
                  Vai trò
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['member', 'admin'].map(role => (
                    <button
                      key={role}
                      onClick={() => setForm(f => ({ ...f, role }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                        form.role === role
                          ? 'border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]'
                          : 'border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#333]'
                      }`}
                    >
                      {role === 'admin' ? <Shield size={15} /> : <User size={15} />}
                      {role === 'admin' ? 'Admin' : 'Member'}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-xl bg-[#e05252]/10 border border-[#e05252]/30 text-[#e05252] text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#666] hover:text-white text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-[#0f0f0f]/50 border-t-[#0f0f0f] rounded-full animate-spin" />
                ) : <Check size={15} />}
                {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
