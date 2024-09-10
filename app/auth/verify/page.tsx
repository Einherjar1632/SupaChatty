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

    return <div>Verifying your email... You will be redirected to the chat in 5 seconds.</div>
}