"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Phone, Video, MoreVertical, Paperclip, MessageSquare, Loader2, Plus, X, FileText, Image as ImageIcon, User, Mail, Copy } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function MessagesPage() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [messages, setMessages] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [messageInput, setMessageInput] = useState("")
    const [staff, setStaff] = useState<any[]>([])
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
    const [pendingAttachments, setPendingAttachments] = useState<Array<{ url: string; name: string; size?: number }>>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [fetchError, setFetchError] = useState<string | null>(null)

    const fetchMessages = async () => {
        try {
            setFetchError(null)
            const res = await fetch("/api/messages")
            if (res.ok) {
                const data = await res.json()
                setMessages(Array.isArray(data) ? data : [])
            } else {
                const err = await res.json().catch(() => ({}))
                setMessages([])
                setFetchError(err.error || "Failed to load messages")
            }
        } catch (error) {
            console.error("Error fetching messages:", error)
            setMessages([])
            setFetchError("Failed to load messages")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages()

        async function fetchStaffList() {
            try {
                const [onShiftRes, staffRes] = await Promise.all([
                    fetch("/api/staff/on-shift"),
                    fetch("/api/staff"),
                ])
                const onShift = onShiftRes.ok ? await onShiftRes.json() : []
                const allStaff = staffRes.ok ? await staffRes.json() : []
                const staffWithShift = Array.isArray(onShift) && onShift.length > 0
                    ? onShift
                    : (Array.isArray(allStaff) ? allStaff.map((s: any) => ({ ...s, isOnShift: false })) : [])
                setStaff(staffWithShift.filter((s: any) => s.id !== user?.id))
            } catch (error) {
                console.error("Error fetching staff:", error)
                setStaff([])
            }
        }
        fetchStaffList()

        const interval = setInterval(fetchMessages, 10000)
        return () => clearInterval(interval)
    }, [user?.id])

    // Group messages into conversations (by other participant)
    const conversations = (messages ?? []).reduce((acc: any[], msg) => {
        const otherId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id
        const otherPerson = msg.sender_id === user?.id ? msg.receiver : msg.sender

        if (!otherId) return acc

        const staffMember = staff.find((s: any) => s.id === otherId)
        const name = otherPerson
            ? [otherPerson.first_name, otherPerson.last_name].filter(Boolean).join(" ") || "Unknown"
            : "Unknown User"
        const text = (msg.message ?? msg.content ?? "").trim()
        const attCount = msg.attachments?.length ?? 0
        const lastMessage = text || (attCount > 0 ? `📎 ${attCount} file${attCount > 1 ? "s" : ""}` : "")
        const ts = new Date(msg.created_at).getTime()
        const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

        const existing = acc.find((c: any) => c.personId === otherId)
        if (!existing) {
            acc.push({
                personId: otherId,
                name,
                lastMessage,
                time: timeStr,
                timestamp: ts,
                unread: 0,
                isOnShift: staffMember?.isOnShift ?? false,
            })
        } else if (ts > existing.timestamp) {
            existing.lastMessage = lastMessage
            existing.time = timeStr
            existing.timestamp = ts
            existing.isOnShift = staffMember?.isOnShift ?? false
        }
        return acc
    }, []).sort((a, b) => b.timestamp - a.timestamp)

    // All staff with last-message preview (so you can pick anyone and reply)
    const allStaffWithPreview = staff.map((s: any) => {
        const conv = conversations.find((c: any) => c.personId === s.id)
        const name = [s.first_name, s.last_name].filter(Boolean).join(" ") || "Staff"
        return {
            ...s,
            personId: s.id,
            name,
            lastMessage: conv?.lastMessage ?? null,
            time: conv?.time ?? "",
            timestamp: conv?.timestamp ?? 0,
            isOnShift: s.isOnShift ?? false,
        }
    }).sort((a: any, b: any) => {
        if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp
        return (a.name || "").localeCompare(b.name || "")
    })

    const filteredSidebarList = allStaffWithPreview.filter((s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const [selectedConvId, setSelectedConvId] = useState<string | null>(null)

    const selectedConversation = (() => {
        if (selectedConvId) {
            const fromList = conversations.find((c: any) => c.personId === selectedConvId)
            if (fromList) return fromList
            const fromStaff = staff.find((s: any) => s.id === selectedConvId)
            if (fromStaff)
                return {
                    personId: fromStaff.id,
                    name: [fromStaff.first_name, fromStaff.last_name].filter(Boolean).join(" ") || "Staff",
                    lastMessage: "",
                    time: "",
                    timestamp: 0,
                    unread: 0,
                    isOnShift: fromStaff.isOnShift ?? false,
                }
            return null
        }
        return conversations.length > 0 ? conversations[0] : null
    })()

    // Mark messages as read when opening a conversation (current user is receiver)
    useEffect(() => {
        if (!selectedConvId || !user?.id) return
        const toMark = (messages ?? []).filter(
            (m: any) => m.receiver_id === user.id && m.sender_id === selectedConvId && !m.is_read
        )
        if (toMark.length === 0) return
        fetch("/api/messages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message_ids: toMark.map((m: any) => m.id) }),
        }).then(() => fetchMessages())
    }, [selectedConvId, user?.id])

    const handleSendMessage = async () => {
        const content = messageInput.trim()
        const hasAttachments = pendingAttachments.length > 0
        if ((!content && !hasAttachments) || !selectedConversation) return

        setMessageInput("")
        const attachmentsToSend = [...pendingAttachments]
        setPendingAttachments([])

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiver_id: selectedConversation.personId,
                    content: content || " ",
                    attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
                }),
            })

            if (res.ok) {
                const newMessage = await res.json()
                setMessages((prev) => (Array.isArray(prev) ? [newMessage, ...prev] : [newMessage]))
            } else {
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || "Failed to send message")
                setMessageInput(content)
                setPendingAttachments(attachmentsToSend)
            }
        } catch (error) {
            toast.error("Error sending message")
            setMessageInput(content)
            setPendingAttachments(attachmentsToSend)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files?.length || uploading) return
        setUploading(true)
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`${file.name} is too large (max 10MB)`)
                    continue
                }
                const form = new FormData()
                form.append("file", file)
                const res = await fetch("/api/messages/upload", { method: "POST", body: form })
                if (res.ok) {
                    const data = await res.json()
                    setPendingAttachments((prev) => [...prev, { url: data.url, name: data.name, size: data.size }])
                } else {
                    const err = await res.json().catch(() => ({}))
                    toast.error(err.error || `Failed to upload ${file.name}`)
                }
            }
        } finally {
            setUploading(false)
            e.target.value = ""
        }
    }

    if (isLoading && (messages.length === 0 && !fetchError)) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Messages</h2>
                    <p className="text-slate-500 mt-1">Communicate with your practice clinic members</p>
                </div>
                <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                            <Plus className="mr-2 h-4 w-4" />
                            New Message
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Start a conversation</DialogTitle>
                            <DialogDescription>
                                Choose a staff member to message. Everyone in your clinic is listed below.
                            </DialogDescription>
                        </DialogHeader>
                        <Command className="rounded-lg border shadow-md">
                            <CommandInput placeholder="Search by name or role..." />
                            <CommandList>
                                <CommandEmpty>No staff found.</CommandEmpty>
                                <CommandGroup heading="All staff">
                                    {staff.map((person: any) => (
                                        <CommandItem
                                            key={person.id}
                                            onSelect={() => {
                                                setSelectedConvId(person.id)
                                                setIsNewMessageOpen(false)
                                            }}
                                            className="flex items-center gap-3 p-2 cursor-pointer"
                                        >
                                            <div className="relative shrink-0">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-teal-100 text-teal-700">
                                                        {(person.first_name?.[0] ?? "")}{(person.last_name?.[0] ?? "")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {person.isOnShift && (
                                                    <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium truncate">{person.first_name} {person.last_name}</span>
                                                <span className="text-xs text-slate-500 capitalize">{person.role?.replace("_", " ") ?? ""}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-sm h-[calc(100vh-7rem)] sm:h-[calc(100vh-6rem)] max-h-[700px] md:max-h-none md:h-[650px] overflow-hidden border-slate-200 min-w-0 w-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
                    {/* Conversations List */}
                    <div className="md:col-span-4 border-r border-slate-200 bg-white min-w-0 flex flex-col min-h-0 overflow-hidden">
                        {fetchError && (
                            <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2">
                                <span className="text-sm text-amber-800">{fetchError}</span>
                                <Button variant="outline" size="sm" onClick={() => { setIsLoading(true); fetchMessages(); }} className="shrink-0">
                                    Retry
                                </Button>
                            </div>
                        )}
                        <div className="p-4 border-b border-slate-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-slate-50 border-none"
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-2">
                                {filteredSidebarList.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm italic">No staff found</div>
                                ) : (
                                    filteredSidebarList.map((s: any, index: number) => (
                                        <div
                                            key={s.personId}
                                            onClick={() => setSelectedConvId(s.personId)}
                                            className={cn(
                                                "p-4 rounded-xl cursor-pointer transition-all mb-2",
                                                selectedConvId === s.personId || (selectedConvId === null && index === 0)
                                                    ? "bg-teal-50 border border-teal-100 shadow-sm"
                                                    : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm font-semibold">
                                                        <AvatarFallback className="bg-teal-100 text-teal-700">
                                                            {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {s.isOnShift && (
                                                        <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <h4 className="font-semibold text-sm text-slate-900 truncate">{s.name}</h4>
                                                        {s.time && <span className="text-[10px] text-slate-400 shrink-0">{s.time}</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                                        {s.lastMessage || "Start conversation"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    <div className="md:col-span-8 flex flex-col bg-slate-50/30 min-w-0 min-h-0 overflow-hidden">
                        {selectedConversation ? (
                            <>
                                <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-100 font-semibold">
                                            <AvatarFallback className="bg-teal-500 text-white">
                                                {selectedConversation.name.split(' ').map((n: string) => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{selectedConversation.name}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn("h-1.5 w-1.5 rounded-full", selectedConversation.isOnShift ? "bg-emerald-500" : "bg-slate-300")} />
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    {selectedConversation.isOnShift ? "On Shift" : "Offline / Off Shift"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const selectedStaff = staff.find((s: any) => s.id === selectedConversation.personId)
                                            const phone = selectedStaff?.phone?.trim()
                                            const email = selectedStaff?.email?.trim()
                                            const handleCall = () => {
                                                if (phone) {
                                                    window.location.href = `tel:${phone}`
                                                } else {
                                                    toast.error("No phone number available for this contact")
                                                }
                                            }
                                            const handleVideo = () => {
                                                if (email) {
                                                    const mailto = `mailto:${email}?subject=Quick video call - ${encodeURIComponent(selectedConversation.name)}`
                                                    window.location.href = mailto
                                                    toast.success("Opening email to arrange a video call")
                                                } else {
                                                    toast.error("No email available for this contact")
                                                }
                                            }
                                            const copyEmail = () => {
                                                if (email) {
                                                    navigator.clipboard.writeText(email)
                                                    toast.success("Email copied to clipboard")
                                                } else {
                                                    toast.error("No email available")
                                                }
                                            }
                                            const copyPhone = () => {
                                                if (phone) {
                                                    navigator.clipboard.writeText(phone)
                                                    toast.success("Phone number copied to clipboard")
                                                } else {
                                                    toast.error("No phone number available")
                                                }
                                            }
                                            return (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-teal-600"
                                                        onClick={handleCall}
                                                        title="Call"
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-slate-400 hover:text-teal-600"
                                                        onClick={handleVideo}
                                                        title="Email to arrange video call"
                                                    >
                                                        <Video className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-400 hover:text-teal-600"
                                                                title="More options"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/staff/${selectedConversation.personId}`} className="flex items-center gap-2 cursor-pointer">
                                                                    <User className="h-4 w-4" />
                                                                    View profile
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={handleCall} className="cursor-pointer flex items-center gap-2">
                                                                <Phone className="h-4 w-4" />
                                                                Call
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={handleVideo} className="cursor-pointer flex items-center gap-2">
                                                                <Mail className="h-4 w-4" />
                                                                Email / Video call
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={copyEmail} className="cursor-pointer flex items-center gap-2">
                                                                <Copy className="h-4 w-4" />
                                                                Copy email
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={copyPhone} className="cursor-pointer flex items-center gap-2">
                                                                <Copy className="h-4 w-4" />
                                                                Copy phone
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 min-h-0 p-6">
                                    <div className="space-y-6">
                                        {(messages ?? [])
                                            .filter((m: any) => m.sender_id === selectedConversation.personId || m.receiver_id === selectedConversation.personId)
                                            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                            .map((message: any) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex gap-3 ${message.sender_id === user?.id ? "flex-row-reverse" : ""}`}
                                                >
                                                    <Avatar className="h-8 w-8 shadow-sm">
                                                        <AvatarFallback className={message.sender_id === user?.id ? "bg-teal-600 text-white" : "bg-slate-200"}>
                                                            {message.sender?.first_name?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={`flex flex-col max-w-[75%] ${message.sender_id === user?.id ? "items-end" : ""}`}>
                                                        <div
                                                            className={cn(
                                                                "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                                                message.sender_id === user?.id ? "bg-teal-600 text-white" : "bg-white text-slate-800 border border-slate-100"
                                                            )}
                                                        >
                                                            {(message.message ?? message.content)?.trim() && (
                                                                <p className="whitespace-pre-wrap break-words">{message.message ?? message.content}</p>
                                                            )}
                                                            {message.attachments?.length > 0 && (
                                                                <div className="mt-2 space-y-1.5">
                                                                    {message.attachments.map((att: any, i: number) => (
                                                                        <a
                                                                            key={i}
                                                                            href={att.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={cn(
                                                                                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-opacity hover:opacity-90",
                                                                                message.sender_id === user?.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                                                                            )}
                                                                        >
                                                                            {att.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                                                <ImageIcon className="h-4 w-4 shrink-0" />
                                                                            ) : (
                                                                                <FileText className="h-4 w-4 shrink-0" />
                                                                            )}
                                                                            <span className="truncate">{att.name || "Attachment"}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 mt-1.5 px-1">
                                                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </ScrollArea>

                                <div className="shrink-0 p-4 bg-white border-t border-slate-200">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    {pendingAttachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {pendingAttachments.map((att, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                                                >
                                                    {att.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                                    <span className="max-w-[120px] truncate">{att.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingAttachments((p) => p.filter((_, j) => j !== i))}
                                                        className="rounded-full p-0.5 hover:bg-slate-200"
                                                        aria-label="Remove"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors min-h-[52px] sm:min-h-[44px]">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-slate-500 hover:text-teal-600 h-9 w-9 shrink-0"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                                        </Button>
                                        <textarea
                                            placeholder="Type a message..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleSendMessage()
                                                }
                                            }}
                                            rows={1}
                                            className="flex-1 min-h-[44px] sm:min-h-[36px] max-h-32 resize-none border-none bg-transparent px-2 py-2 text-sm focus-visible:ring-0 focus-visible:outline-none placeholder:text-slate-400"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleSendMessage}
                                            className="bg-teal-600 hover:bg-teal-700 rounded-full h-9 w-9 p-0 flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line · Attach files with the clip</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                                    <MessageSquare className="h-8 w-8 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-600">No conversation selected</h3>
                                    <p className="text-xs">Select a contact from the list to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
