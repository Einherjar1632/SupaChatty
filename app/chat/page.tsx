'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from 'lucide-react'

interface ChatMessage {
    id: number;
    created_at: string;
    user_id: string;
    chat_text: string;  // 'text' から 'chat_text' に変更
}

export default function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [isUploading, setIsUploading] = useState(false)  // この行を追加
    const router = useRouter()
    const supabase = createClientComponentClient()
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const fetchMessages = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/signin')
            return
        }

        const { data, error } = await supabase
            .from('chat')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) console.error('チャットメッセージの取得エラー:', error)
        else setMessages(data as ChatMessage[])
    }, [supabase, router])

    useEffect(() => {
        fetchMessages()

        const channel = supabase
            .channel('realtime chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat' }, (payload) => {
                const newMessage = payload.new as ChatMessage
                setMessages((prevMessages) => [...prevMessages, newMessage])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router, fetchMessages])

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages])

    const handleSendMessage = async () => {
        console.log('handleSendMessage called'); // デバッグ用ログ
        if (inputMessage.trim() !== '') {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            console.log('Sending message:', inputMessage); // デバッグ用ログ

            const { error } = await supabase
                .from('chat')
                .insert({
                    user_id: user.id,
                    chat_text: inputMessage,  // 'text' から 'chat_text' に変更
                })

            if (error) {
                console.error('メッセージ送信エラー:', error)
            } else {
                console.log('Message sent successfully'); // デバッグ用ログ
                setInputMessage('')
                await fetchMessages()  // メッセージ送信後に再取得
            }
        }
    }

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
            <header className="bg-gray-800 text-white py-4 px-6">
                <h1 className="text-2xl font-bold">チャットページ</h1>
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
                                    <p className="mt-1 text-gray-700">{message.chat_text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                        console.log('Form submitted'); // デバッグ用ログ
                    }}
                    className="flex"
                >
                    <Input
                        type="text"
                        placeholder="メッセージを入力してください..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 mr-2"
                    />
                    <Button type="submit">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">メッセージを送信</span>
                    </Button>
                </form>
            </div>
        </div>
    )
}