import React from 'react'

export interface ScrollAreaProps {
    children: React.ReactNode
    className?: string
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className }) => {
    return <div className={`overflow-auto ${className}`}>{children}</div>
}