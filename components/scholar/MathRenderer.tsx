import React, { useEffect, useRef } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

interface MathRendererProps {
    equation: string
    block?: boolean
    className?: string
}

export function MathRenderer({ equation, block = false, className = "" }: MathRendererProps) {
    const containerRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (containerRef.current) {
            try {
                katex.render(equation, containerRef.current, {
                    throwOnError: false,
                    displayMode: block
                })
            } catch (error) {
                containerRef.current.innerText = equation
            }
        }
    }, [equation, block])

    return <span ref={containerRef} className={className} />
}
