"use client"

import React, { useState, useEffect, useRef } from 'react'
import { cn } from "@/lib/utils"

interface EditableTextProps {
    value: string
    onSave: (newValue: string) => void
    isEditing: boolean
    className?: string
    dir?: "ltr" | "rtl"
    tagName?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3'
    style?: React.CSSProperties
    onClick?: (e: React.MouseEvent) => void
    id?: string
}

export function EditableText({
    value,
    onSave,
    isEditing,
    className,
    dir = "ltr",
    tagName = 'span',
    style,
    onClick,
    id
}: EditableTextProps) {
    const [text, setText] = useState(value)
    const elementRef = useRef<HTMLElement>(null)

    useEffect(() => {
        setText(value)
    }, [value])

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        const newText = e.currentTarget.textContent || ""
        if (newText !== value) {
            onSave(newText)
        }
    }

    const Tag = tagName

    return (
        <Tag
            id={id}
            contentEditable={isEditing}
            suppressContentEditableWarning
            className={cn(
                "outline-none min-w-[5px] inline-block transition-all",
                isEditing && "hover:bg-emerald-500/5 cursor-text rounded-sm px-0.5",
                className
            )}
            style={style}
            dir={dir}
            onBlur={handleBlur}
            onInput={(e) => setText(e.currentTarget.textContent || "")}
            onClick={onClick}
        >
            {value}
        </Tag>
    )
}
