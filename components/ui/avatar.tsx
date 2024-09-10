import React from 'react'

export interface AvatarProps {
    children: React.ReactNode
    className?: string
}

export const Avatar: React.FC<AvatarProps> = ({ children, className }) => {
    return <div className={`w-10 h-10 rounded-full overflow-hidden ${className}`}>{children}</div>
}

export const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
    return <img className="w-full h-full object-cover" {...props} />
}

export const AvatarFallback: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600" {...props}>
            {children}
        </div>
    )
}