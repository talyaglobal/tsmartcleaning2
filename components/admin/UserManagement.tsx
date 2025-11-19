'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  MoreVertical, 
  Mail, 
  MessageSquare, 
  History, 
  UserCog,
  CheckSquare,
  X,
  Filter,
  RefreshCw
} from 'lucide-react'
import { UserRole } from '@/lib/auth/roles'

type User = {
  id: string
  email: string
  full_name?: string
  role: string
  phone?: string
  created_at?: string
  is_active?: boolean
  total_bookings?: number
  total_spent?: number
}

type Provider = {
  id: string
  business_name: string
  owner_name?: string
  contact_email?: string
  created_at?: string
  is_verified?: boolean
  total_bookings?: number
  rating?: number
}

type ActivityLog = {
  id: string
  action: string
  resource: string
  metadata: Record<string, any>
  created_at: string
  ip?: string
  user_agent?: string
}

interface UserManagementProps {
  initialCustomers: User[]
  initialProviders: Provider[]
  customersTotal?: number
  providersTotal?: number
}

export function UserManagement({
  initialCustomers,
  initialProviders,
  customersTotal = 0,
  providersTotal = 0,
}: UserManagementProps) {
  const [customers, setCustomers] = useState<User[]>(initialCustomers)
  const [providers, setProviders] = useState<Provider[]>(initialProviders)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('customers')
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [messageType, setMessageType] = useState<'email' | 'whatsapp'>('email')
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab === 'customers') {
        params.set('role', 'customer')
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      params.set('limit', '50')

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const res = await fetch(`${baseUrl}/api/admin/users?${params}`)
      const data = await res.json()

      if (activeTab === 'customers') {
        setCustomers(data.users || [])
      } else {
        // For providers, we'd need a separate endpoint or modify the existing one
        // For now, keep using the initial providers
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, searchQuery, statusFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [fetchUsers])

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = () => {
    const currentUsers = activeTab === 'customers' ? customers : providers
    if (selectedUsers.size === currentUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(currentUsers.map(u => u.id)))
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) return

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      if (action === 'activate' || action === 'deactivate') {
        const res = await fetch(`${baseUrl}/api/admin/users`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds: Array.from(selectedUsers),
            isActive: action === 'activate',
          }),
        })
        if (res.ok) {
          await fetchUsers()
          setSelectedUsers(new Set())
        } else {
          const errorData = await res.json()
          console.error('Bulk action error:', errorData)
          alert(`Failed to ${action} users: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
      alert(`Failed to ${action} users. Please try again.`)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        await fetchUsers()
        setRoleDialogOpen(false)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Role update failed:', error)
    }
  }

  const handleViewActivity = async (user: User) => {
    setSelectedUser(user)
    setActivityDialogOpen(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const res = await fetch(`${baseUrl}/api/admin/users/${user.id}/activity`)
      const data = await res.json()
      setActivityLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedUser || !messageBody) return

    setSendingMessage(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const res = await fetch(`${baseUrl}/api/admin/users/${selectedUser.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: messageType,
          subject: messageSubject,
          message: messageBody,
        }),
      })
      if (res.ok) {
        setMessageDialogOpen(false)
        setMessageBody('')
        setMessageSubject('')
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setRoleDialogOpen(true)
  }

  const openMessageDialog = (user: User) => {
    setSelectedUser(user)
    setMessageDialogOpen(true)
  }

  const currentUsers = activeTab === 'customers' ? customers : providers
  const allSelected = currentUsers.length > 0 && selectedUsers.size === currentUsers.length

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="customers">
              Customers <Badge className="ml-2" variant="secondary">{customersTotal}</Badge>
            </TabsTrigger>
            <TabsTrigger value="providers">
              Providers <Badge className="ml-2" variant="secondary">{providersTotal}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {activeTab === 'customers' && (
              <>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.values(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {selectedUsers.size > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        )}

        <TabsContent value="customers">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Bookings</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Total Spent</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedUsers.has(customer.id)}
                          onCheckedChange={() => handleSelectUser(customer.id)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {customer.full_name || customer.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant="outline">
                          {customer.role?.replace(/_/g, ' ') || 'customer'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">{customer.total_bookings ?? 0}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        ${customer.total_spent?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={customer.is_active !== false ? 'secondary' : 'outline'}>
                          {customer.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openRoleDialog(customer)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewActivity(customer)}>
                              <History className="h-4 w-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openMessageDialog(customer)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            {customer.phone && (
                              <DropdownMenuItem onClick={() => {
                                setMessageType('whatsapp')
                                openMessageDialog(customer)
                              }}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send WhatsApp
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Business Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Owner</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Jobs</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Rating</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm font-medium">{provider.business_name}</td>
                      <td className="px-6 py-4 text-sm">{provider.owner_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {provider.contact_email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {provider.created_at
                          ? new Date(provider.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">{provider.total_bookings ?? 0}</td>
                      <td className="px-6 py-4 text-sm">
                        {provider.rating && provider.rating > 0
                          ? provider.rating.toFixed(1)
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          variant={provider.is_verified ? 'secondary' : 'outline'}
                          className={
                            !provider.is_verified
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : ''
                          }
                        >
                          {provider.is_verified ? 'verified' : 'pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {!provider.is_verified ? (
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Management Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedUser?.role || ''}
                onValueChange={(value) => {
                  if (selectedUser) {
                    handleRoleChange(selectedUser.id, value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Logs Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Activity Logs</DialogTitle>
            <DialogDescription>
              Activity history for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity logs found
              </p>
            ) : (
              <div className="space-y-2">
                {activityLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.resource}
                          </span>
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send {messageType === 'email' ? 'Email' : 'WhatsApp'} Message
            </DialogTitle>
            <DialogDescription>
              Send a message to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={(v: 'email' | 'whatsapp') => setMessageType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {messageType === 'email' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Message subject"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Enter your message..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!messageBody || sendingMessage}>
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

