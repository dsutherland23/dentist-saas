"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Phone, Video, MoreVertical, Paperclip, Smile, MessageSquare, Users, Clock, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [messages, setMessages] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [messageInput, setMessageInput] = useState("")
    const [staff, setStaff] = useState<any[]>([])
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/messages')
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (error) {
            console.error("Error fetching messages:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages()

        async function fetchStaff() {
            try {
                const res = await fetch('/api/staff/on-shift')
                if (res.ok) {
                    const data = await res.json()
                    setStaff(data.filter((s: any) => s.id !== user?.id))
                }
            } catch (error) {
                console.error("Error fetching staff:", error)
            }
        }
        fetchStaff()

        const interval = setInterval(fetchMessages, 10000)
        return () => clearInterval(interval)
    }, [user?.id])

    // Simple conversation grouping for display
    const conversations = messages.reduce((acc: any[], msg) => {
        const otherPerson = msg.sender_id === user?.id ? msg.receiver : msg.sender
        const otherId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id

        if (!otherId) return acc

        // Find if this person is in our staff list with shift info
        const staffMember = staff.find(s => s.id === otherId)

        const existing = acc.find(c => c.personId === otherId)
        if (!existing) {
            acc.push({
                personId: otherId,
                name: otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name}` : "Unknown User",
                lastMessage: msg.message ?? msg.content,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(msg.created_at).getTime(),
                unread: 0,
                status: "online",
                isOnShift: staffMember?.isOnShift || false
            })
        } else if (new Date(msg.created_at).getTime() > existing.timestamp) {
            existing.lastMessage = msg.message ?? msg.content
            existing.time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            existing.timestamp = new Date(msg.created_at).getTime()
            existing.isOnShift = staffMember?.isOnShift || false
        }
        return acc
    }, []).sort((a, b) => b.timestamp - a.timestamp)

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
    const selectedConversation = conversations.find(c => c.personId === selectedConvId) || conversations[0]

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation) return

        const content = messageInput
        setMessageInput("")

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver_id: selectedConversation.personId,
                    content
                })
            })

            if (res.ok) {
                const newMessage = await res.json()
                setMessages(prev => [newMessage, ...prev])
            } else {
                toast.error("Failed to send message")
            }
        } catch (error) {
            toast.error("Error sending message")
        }
    }

    if (isLoading) {
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
                            <DialogTitle>New Conversation</DialogTitle>
                            <DialogDescription>
                                Select a staff member to start a new conversation.
                            </DialogDescription>
                        </DialogHeader>
                        <Command className="rounded-lg border shadow-md">
                            <CommandInput placeholder="Search staff..." />
                            <CommandList>
                                <CommandEmpty>No staff found.</CommandEmpty>
                                <CommandGroup heading="On Shift">
                                    {staff.filter((s: any) => s.isOnShift).map((person) => (
                                        <CommandItem
                                            key={person.id}
                                            onSelect={() => {
                                                setSelectedConvId(person.id)
                                                setIsNewMessageOpen(false)
                                            }}
                                            className="flex items-center gap-3 p-2 cursor-pointer"
                                        >
                                            <div className="relative">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-teal-100 text-teal-700">
                                                        {person.first_name[0]}{person.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{person.first_name} {person.last_name}</span>
                                                <span className="text-xs text-slate-500 capitalize">{person.role.replace('_', ' ')}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                    {staff.filter((s: any) => s.isOnShift).length === 0 && (
                                        <div className="p-2 text-xs text-slate-400 italic">No staff currently on shift</div>
                                    )}
                                </CommandGroup>
                                <CommandGroup heading="All Staff">
                                    {staff.filter((s: any) => !s.isOnShift).map((person) => (
                                        <CommandItem
                                            key={person.id}
                                            onSelect={() => {
                                                setSelectedConvId(person.id)
                                                setIsNewMessageOpen(false)
                                            }}
                                            className="flex items-center gap-3 p-2 cursor-pointer opacity-70"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-slate-100 text-slate-700">
                                                    {person.first_name[0]}{person.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{person.first_name} {person.last_name}</span>
                                                <span className="text-xs text-slate-500 capitalize">{person.role.replace('_', ' ')}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-sm h-[650px] overflow-hidden border-slate-200 min-w-0 w-full">
                <div className="grid grid-cols-1 md:grid-cols-12 h-full min-w-0">
                    {/* Conversations List */}
                    <div className="md:col-span-4 border-r border-slate-200 bg-white min-w-0 flex flex-col">
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
                        <ScrollArea className="h-[calc(650px-80px)]">
                            <div className="p-2">
                                {filteredConversations.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm italic">No conversations found</div>
                                ) : (
                                    filteredConversations.map((conv, index) => (
                                        <div
                                            key={conv.personId}
                                            onClick={() => setSelectedConvId(conv.personId)}
                                            className={`p-4 rounded-xl cursor-pointer transition-all mb-2 ${selectedConvId === conv.personId || (selectedConvId === null && index === 0)
                                                ? "bg-teal-50 border-teal-100 shadow-sm"
                                                : "hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm font-semibold">
                                                        <AvatarFallback className="bg-teal-100 text-teal-700">
                                                            {conv.name.split(' ').map((n: string) => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {conv.isOnShift && (
                                                        <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-sm text-slate-900 truncate">{conv.name}</h4>
                                                        <span className="text-[10px] text-slate-400">{conv.time}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    <div className="md:col-span-8 flex flex-col bg-slate-50/30 min-w-0">
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
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-teal-600">
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-teal-600">
                                            <Video className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-teal-600">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 p-6">
                                    <div className="space-y-6">
                                        {messages
                                            .filter(m => m.sender_id === selectedConversation.personId || m.receiver_id === selectedConversation.personId)
                                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                            .map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex gap-3 ${message.sender_id === user?.id ? "flex-row-reverse" : ""}`}
                                                >
                                                    <Avatar className="h-8 w-8 shadow-sm">
                                                        <AvatarFallback className={message.sender_id === user?.id ? "bg-teal-600 text-white" : "bg-slate-200"}>
                                                            {message.sender?.first_name?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={`flex flex-col max-w-[70%] ${message.sender_id === user?.id ? "items-end" : ""}`}>
                                                        <div
                                                            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${message.sender_id === user?.id
                                                                ? "bg-teal-600 text-white"
                                                                : "bg-white text-slate-800 border border-slate-100"
                                                                }`}
                                                        >
                                                            {message.message ?? message.content}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 mt-1.5 px-1">
                                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </ScrollArea>

                                <div className="p-4 bg-white border-t border-slate-200">
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100 hover:border-slate-200 transition-colors">
                                        <Button variant="ghost" size="icon" className="rounded-full text-slate-400 h-9 w-9">
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            placeholder="Type message..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-sm shadow-none h-9"
                                        />
                                        <Button variant="ghost" size="icon" className="rounded-full text-slate-400 h-9 w-9">
                                            <Smile className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={handleSendMessage}
                                            className="bg-teal-600 hover:bg-teal-700 rounded-full h-9 w-9 p-0 flex items-center justify-center shadow-md shadow-teal-500/20"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
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
