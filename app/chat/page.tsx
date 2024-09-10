'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface ChatMessage {
    id: number;
    created_at: string;
    user_id: string;
    chat_text: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const router = useRouter()
    const supabase = createClientComponentClient()
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchMessages()

        const channel = supabase
            .channel('realtime chat')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat' },
                (payload) => {
                    const newMessage = payload.new as ChatMessage
                    setMessages((prevMessages) => {
                        // 既に同じIDのメッセージがある場合は追加しない
                        if (prevMessages.some(msg => msg.id === newMessage.id)) {
                            return prevMessages;
                        }
                        const updatedMessages = [...prevMessages, newMessage];

                        // 自動メッセージを追加
                        const reversedText = newMessage.chat_text.split('').reverse().join('')
                        const autoMessage: ChatMessage = {
                            id: Date.now(),
                            created_at: new Date().toISOString(),
                            user_id: 'auto',
                            chat_text: reversedText
                        }
                        return [...updatedMessages, autoMessage];
                    })
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Subscribed to realtime changes')
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [messages])

    const fetchMessages = async () => {
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
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (inputMessage.trim() !== '') {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('chat')
                .insert({
                    user_id: user.id,
                    chat_text: inputMessage,
                })

            if (error) {
                console.error('メッセージ送信エラー:', error)
            } else {
                setInputMessage('')
                // 即座の表示処理を削除（リアルタイムイベントで処理される）
            }
        }
    }

    const getInitials = (userId: string) => {
        return userId === 'auto' ? '自動' : userId.slice(0, 2).toUpperCase()
    }

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
            <header className="bg-gray-800 text-white py-4 px-6">
                <h1 className="text-2xl font-bold">チャットページ</h1>
            </header>

            <div className="flex-1 p-6 overflow-y-auto" ref={scrollAreaRef}>
                {messages.map((message) => (
                    <div key={message.id} className="mb-4">
                        <div className="flex items-start">
                            <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-2 ${message.user_id === 'auto' ? 'bg-yellow-300' : 'bg-gray-300'}`}>
                                <span className={`font-bold ${message.user_id === 'auto' ? 'text-yellow-800' : 'text-gray-700'}`}>{getInitials(message.user_id)}</span>
                            </div>
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

            <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex">
                    <input
                        type="text"
                        placeholder="メッセージを入力してください..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 mr-2 p-2 border rounded"
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                        送信
                    </button>
                </form>
            </div>
        </div>
    )
}