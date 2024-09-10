'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Upload } from 'lucide-react'

interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    attachment_url?: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const router = useRouter()
    const supabase = createClientComponentClient()
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchMessages = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/signin')
                return
            }

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) console.error('Error fetching messages:', error)
            else setMessages(data as Message[])
        }

        fetchMessages()

        const channel = supabase
            .channel('realtime messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                setMessages((prevMessages) => [...prevMessages, payload.new as Message])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router])

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async () => {
        if (inputMessage.trim() !== '' || file) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let fileUrl = null
            if (file) {
                const { data, error } = await supabase.storage
                    .from('attachments')
                    .upload(`${user.id}/${Date.now()}_${file.name}`, file)

                if (error) console.error('Error uploading file:', error)
                else {
                    fileUrl = supabase.storage.from('attachments').getPublicUrl(data.path).data.publicUrl

                    // Delete previous file if exists
                    const { data: existingFiles } = await supabase.storage
                        .from('attachments')
                        .list(user.id)

                    if (existingFiles && existingFiles.length > 1) {
                        const oldestFile = existingFiles[0]
                        await supabase.storage
                            .from('attachments')
                            .remove([`${user.id}/${oldestFile.name}`])
                    }
                }
            }

            const { error } = await supabase
                .from('messages')
                .insert({
                    user_id: user.id,
                    content: inputMessage,
                    attachment_url: fileUrl,
                })

            if (error) console.error('Error inserting message:', error)
            else {
                setInputMessage('')
                setFile(null)
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null
        setFile(selectedFile)
    }

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
            <header className="bg-gray-800 text-white py-4 px-6">
                <h1 className="text-2xl font-bold">Simple Chat</h1>
            </header>

            <ScrollArea className="flex-1 p-6">
                <div ref={scrollAreaRef}>
                    {messages.map((message) => (
                        <div key={message.id} className="mb-4">
                            <div className="flex items-start">
                                <Avatar className="mr-2">
                                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.user_id}`} />
                                    <AvatarFallback>{message.user_id[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center">
                                        <span className="font-semibold mr-2">{message.user_id}</span>
                                        <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="mt-1 text-gray-700">{message.content}</p>
                                    {message.attachment_url && (
                                        <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            Attachment
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center">
                    <Input
                        type="text"
                        placeholder="メッセージを入力してください..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 mr-2"
                    />
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer mr-2">
                        <Upload className="h-6 w-6" />
                    </label>
                    <Button type="submit">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </form>
            </div>
        </div>
    )
}