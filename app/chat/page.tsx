'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    attachment_url?: string;
    attachment_type?: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [file, setFile] = useState<{ url: string; type: string } | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
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

    const uploadFile = async (file: File) => {
        console.log('uploadFile called with:', file.name); // 追加
        setIsUploading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error('ユーザーが認証されていません')
            setIsUploading(false)
            return null
        }

        // Delete previous file if exists
        const { data: existingFiles } = await supabase.storage
            .from('attachments')
            .list(user.id)

        if (existingFiles && existingFiles.length > 0) {
            await supabase.storage
                .from('attachments')
                .remove([`${user.id}/${existingFiles[0].name}`])
        }

        // Upload new file
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(`${user.id}/${Date.now()}_${file.name}`, file)

        if (error) {
            console.error('Error uploading file:', error)
            toast.error('ファイルのアップロードに失敗しました')
            setIsUploading(false)
            return null
        }

        const fileUrl = supabase.storage.from('attachments').getPublicUrl(data.path).data.publicUrl
        setIsUploading(false)
        toast.success('ファイルのアップロードに成功しました')
        return { url: fileUrl, type: file.type }
    }

    const handleSendMessage = async () => {
        if (inputMessage.trim() !== '' || file) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('messages')
                .insert({
                    user_id: user.id,
                    content: inputMessage,
                    attachment_url: file ? file.url : null,
                    attachment_type: file ? file.type : null,
                })

            if (error) console.error('Error inserting message:', error)
            else {
                setInputMessage('')
                setFile(null)
                setPreviewUrl(null)
            }
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('handleFileChange called'); // 追加
        const selectedFile = e.target.files?.[0] || null
        console.log('Selected file:', selectedFile?.name); // 追加
        if (selectedFile) {
            const reader = new FileReader()
            reader.onloadend = () => {
                console.log('FileReader onloadend'); // 追加
                setPreviewUrl(reader.result as string)
            }
            reader.readAsDataURL(selectedFile)

            const uploadedFile = await uploadFile(selectedFile)
            console.log('Uploaded file:', uploadedFile); // 追加
            if (uploadedFile) {
                setFile(uploadedFile)
            }
        } else {
            setFile(null)
            setPreviewUrl(null)
        }
    }

    const renderAttachment = (url: string, type: string) => {
        if (type.startsWith('image/')) {
            return <img src={url} alt="Attachment" className="max-w-xs max-h-32 object-contain" />
        } else if (type.startsWith('video/')) {
            return <video src={url} controls className="max-w-xs max-h-32" />
        } else {
            return <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Attachment</a>
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
                                    <p className="mt-1 text-gray-700">{message.content}</p>
                                    {message.attachment_url && message.attachment_type && (
                                        <div className="mt-2">
                                            {renderAttachment(message.attachment_url, message.attachment_type)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex flex-col">
                    <div className="flex items-center mb-2">
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
                            onClick={() => console.log('File input clicked')} // 追加
                            className="hidden"
                            id="file-upload"
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className={`cursor-pointer mr-2 ${isUploading ? 'opacity-50' : ''}`}
                            onClick={() => console.log('File upload label clicked')} // 追加
                        >
                            <Upload className="h-6 w-6" />
                        </label>
                        <Button type="submit" disabled={isUploading}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send message</span>
                        </Button>
                    </div>
                    {isUploading && <p className="text-sm text-gray-500">アップロード中...</p>}
                    {previewUrl && (
                        <div className="mt-2">
                            <img src={previewUrl} alt="Preview" className="max-w-xs max-h-32 object-contain" />
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}