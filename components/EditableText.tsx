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
    id,
    renderValue // New prop: function to render text when not active
}: EditableTextProps & { renderValue?: (val: string) => React.ReactNode }) {
    const [text, setText] = useState(value)
    const [isFocused, setIsFocused] = useState(false)
    const elementRef = useRef<HTMLElement>(null)

    useEffect(() => {
        setText(value)
    }, [value])

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        setIsFocused(false)
        const newText = e.currentTarget.textContent || ""
        if (newText !== value) {
            onSave(newText)
        }
    }

    const Tag = tagName

    return (
        <Tag
            id={id}
            ref={elementRef as any}
            contentEditable={isEditing}
            suppressContentEditableWarning
            className={cn(
                "outline-none min-w-[5px] inline-block transition-all",
                isEditing && "hover:bg-emerald-500/5 cursor-text rounded-sm px-0.5",
                isEditing && isFocused && "ring-2 ring-emerald-500/50 bg-white shadow-sm",
                className
            )}
            style={style}
            dir={dir}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            onInput={(e) => setText(e.currentTarget.textContent || "")}
            onClick={(e) => {
                if (isEditing) {
                    setIsFocused(true)
                }
                onClick?.(e)
            }}
        >
            {isEditing && isFocused ? value : (renderValue ? renderValue(value) : value)}
        </Tag>
    )
}
