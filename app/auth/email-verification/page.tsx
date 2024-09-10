export default function EmailVerification() {
    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">メール認証待ち</h1>
            <p className="mb-4">
                登録いただきありがとうございます。認証用のメールを送信しました。
            </p>
            <p className="mb-4">
                メールに記載されているリンクをクリックして、アカウントを有効化してください。
            </p>
            <p className="text-sm text-gray-600">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
        </div>
    )
}