'use client'

import { useState } from 'react'
import SignIn from './auth/signin/page'
import SignUp from './auth/signup/page'

export default function Home() {
  const [isSignIn, setIsSignIn] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignIn ? 'ログインページ' : '新規登録ページ'}
          </h2>
        </div>
        {isSignIn ? <SignIn /> : <SignUp />}
        <div className="text-center">
          <button
            onClick={() => setIsSignIn(!isSignIn)}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignIn ? '新規登録ページへ' : 'ログインページへ'}
          </button>
        </div>
      </div>
    </div>
  )
}
