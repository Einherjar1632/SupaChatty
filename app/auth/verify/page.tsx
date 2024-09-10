'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Verify() {
    const router = useRouter()

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/chat')
        }, 5000)

        return () => clearTimeout(timer)
    }, [router])

    return <div>Eメールの認証が完了しました、5秒後にチャットページに遷移します。</div>
}