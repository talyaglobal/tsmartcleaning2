'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable, Column } from '@/components/admin/DataTable'
import { EmptyState } from '@/components/admin/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Search,
  Send,
  FileText,
  Plus,
  X,
  User,
  Mail,
  Phone,
  MessageCircle,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

type Conversation = {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message_at: string | null
  last_message_preview: string | null
  unread_count_participant_1: number
  unread_count_participant_2: number
  created_at: string
  participant_1?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  participant_2?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  sender?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  recipient?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

type MessageTemplate = {
  id: string
  name: string
  type: 'email' | 'sms' | 'whatsapp'
  subject: string | null
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
}

export function AdminMessages() {
  const [activeTab, setActiveTab] = useState<'conversations' | 'templates'>('conversations')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>('all')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'whatsapp',
    subject: '',
    content: '',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id, true)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'conversations') {
        const res = await fetch('/api/admin/messages?limit=100', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations || [])
        }
      } else if (activeTab === 'templates') {
        const res = await fetch('/api/admin/message-templates', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setTemplates(data.templates || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string, silent = false) => {
    if (!silent) setMessagesLoading(true)
    try {
      const res = await fetch(`/api/admin/messages/${conversationId}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        if (data.conversation) {
          setSelectedConversation(data.conversation)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (!silent) setMessagesLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchData()
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/messages?search=${encodeURIComponent(searchQuery)}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      // Determine sender and recipient (admin is typically participant_1)
      const senderId = selectedConversation.participant_1_id
      const recipientId = selectedConversation.participant_2_id

      const res = await fetch(`/api/admin/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: senderId,
          recipient_id: recipientId,
          content: newMessage,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...messages, data.message])
        setNewMessage('')
        fetchData() // Refresh conversations list
      } else {
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const saveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      alert('Name and content are required')
      return
    }

    try {
      const url = editingTemplate
        ? `/api/admin/message-templates/${editingTemplate.id}`
        : '/api/admin/message-templates'
      const method = editingTemplate ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate ? { ...newTemplate } : newTemplate),
      })

      if (res.ok) {
        setShowTemplateDialog(false)
        setEditingTemplate(null)
        setNewTemplate({ name: '', type: 'email', subject: '', content: '' })
        fetchData()
      } else {
        alert('Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const res = await fetch(`/api/admin/message-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchData()
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.participant_1?.full_name?.toLowerCase().includes(query) ||
        c.participant_1?.email?.toLowerCase().includes(query) ||
        c.participant_2?.full_name?.toLowerCase().includes(query) ||
        c.participant_2?.email?.toLowerCase().includes(query) ||
        c.last_message_preview?.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  const filteredTemplates = useMemo(() => {
    let filtered = templates

    if (templateSearch) {
      const query = templateSearch.toLowerCase()
      filtered = filtered.filter(
        (t) => t.name.toLowerCase().includes(query) || t.content.toLowerCase().includes(query)
      )
    }

    if (templateTypeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === templateTypeFilter)
    }

    return filtered
  }, [templates, templateSearch, templateTypeFilter])

  const getOtherParticipant = (conversation: Conversation) => {
    // Return the participant that's not the admin (assuming admin is participant_1)
    return conversation.participant_2 || conversation.participant_1
  }

  const conversationColumns: Column<Conversation>[] = [
    {
      key: 'participants',
      header: 'Participants',
      render: (conv) => {
        const other = getOtherParticipant(conv)
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <div className="font-medium">{other?.full_name || other?.email || 'Unknown'}</div>
              <div className="text-xs text-slate-500">{other?.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'last_message_preview',
      header: 'Last Message',
      render: (conv) => (
        <div className="max-w-md truncate text-sm text-slate-600">
          {conv.last_message_preview || 'No messages yet'}
        </div>
      ),
    },
    {
      key: 'last_message_at',
      header: 'Last Activity',
      render: (conv) =>
        conv.last_message_at
          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
          : '—',
    },
    {
      key: 'unread',
      header: 'Unread',
      render: (conv) => {
        const unreadCount = conv.unread_count_participant_1 + conv.unread_count_participant_2
        return unreadCount > 0 ? (
          <Badge variant="default">{unreadCount}</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (conv) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedConversation(conv)}
        >
          Open
        </Button>
      ),
    },
  ]

  const templateColumns: Column<MessageTemplate>[] = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'type',
      header: 'Type',
      render: (template) => {
        const icons = {
          email: Mail,
          sms: Phone,
          whatsapp: MessageCircle,
        }
        const Icon = icons[template.type] || FileText
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Icon className="h-3 w-3" />
            {template.type.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (template) => template.subject || '—',
    },
    {
      key: 'content',
      header: 'Content',
      render: (template) => (
        <div className="max-w-md truncate text-sm text-slate-600">{template.content}</div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (template) => (
        <Badge variant={template.is_active ? 'default' : 'secondary'}>
          {template.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingTemplate(template)
              setNewTemplate({
                name: template.name,
                type: template.type,
                subject: template.subject || '',
                content: template.content,
              })
              setShowTemplateDialog(true)
            }}
          >
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (selectedConversation) {
    const other = getOtherParticipant(selectedConversation)
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="font-medium">{other?.full_name || other?.email || 'Unknown'}</div>
              <div className="text-xs text-slate-500">{other?.email}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messagesLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Start the conversation by sending a message."
              icon={<MessageSquare className="h-8 w-8" />}
            />
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.sender_id === selectedConversation.participant_1_id
              return (
                <div
                  key={msg.id}
                  className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg p-3',
                      isAdmin
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-900'
                    )}
                  >
                    <div className="text-sm">{msg.content}</div>
                    <div
                      className={cn(
                        'mt-1 text-xs',
                        isAdmin ? 'text-blue-100' : 'text-slate-500'
                      )}
                    >
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      {msg.is_read && isAdmin && (
                        <CheckCircle2 className="ml-1 inline h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              rows={2}
              className="resize-none"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Manage conversations and message templates"
        withBorder
        tabs={
          <div className="flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('conversations')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'conversations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              Conversations
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              Templates
            </button>
          </div>
        }
        actions={
          activeTab === 'conversations' ? (
            <Button size="sm" onClick={() => setShowNewConversationDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShowTemplateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          )
        }
      />

      {activeTab === 'conversations' && (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
          </div>

          <DataTable
            columns={conversationColumns}
            data={filteredConversations}
            loading={loading}
            emptyState={
              <EmptyState
                title="No conversations found"
                description="Start a new conversation or search for existing ones."
                icon={<MessageSquare className="h-8 w-8" />}
                action={
                  <Button onClick={() => setShowNewConversationDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Conversation
                  </Button>
                }
              />
            }
          />
        </>
      )}

      {activeTab === 'templates' && (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
            </div>
            <Select value={templateTypeFilter} onValueChange={setTemplateTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={templateColumns}
            data={filteredTemplates}
            loading={loading}
            emptyState={
              <EmptyState
                title="No templates found"
                description="Create reusable message templates for common communications."
                icon={<FileText className="h-8 w-8" />}
                action={
                  <Button onClick={() => setShowTemplateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                }
              />
            }
          />
        </>
      )}

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a new conversation with a user. (Note: User selection UI would be implemented here)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User Email</label>
              <Input placeholder="user@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Initial Message</label>
              <Textarea placeholder="Type your message..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConversationDialog(false)}>
              Cancel
            </Button>
            <Button>Start Conversation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>
              Create a reusable message template with variables like {'{{name}}'}, {'{{email}}'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                placeholder="Welcome Email"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newTemplate.type}
                onValueChange={(value: 'email' | 'sms' | 'whatsapp') =>
                  setNewTemplate({ ...newTemplate, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newTemplate.type === 'email' && (
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Email subject line"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Hi {{name}}, welcome to our service..."
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                rows={8}
              />
              <p className="mt-1 text-xs text-slate-500">
                Available variables: {'{{name}}'}, {'{{email}}'}, {'{{loyalty_tier}}'}, {'{{last_booking_date}}'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTemplateDialog(false)
              setEditingTemplate(null)
              setNewTemplate({ name: '', type: 'email', subject: '', content: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

