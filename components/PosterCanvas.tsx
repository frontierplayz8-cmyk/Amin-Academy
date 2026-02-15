'use client';

import { useRef, useEffect } from 'react';

interface PosterCanvasProps {
    title: string;
    subtitle?: string;
    content: string;
    style: 'modern' | 'classic' | 'minimal' | 'vibrant';
    colorPalette: string;
    aspectRatio: '16:9' | '1:1' | '9:16' | '4:3';
    onGenerate: (imageData: string) => void;
}

interface CanvasDimensions {
    width: number;
    height: number;
}

export function PosterCanvas({
    title,
    subtitle,
    content,
    style,
    colorPalette,
    aspectRatio,
    onGenerate
}: PosterCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        generatePoster();
    }, [title, subtitle, content, style, colorPalette, aspectRatio]);

    const getCanvasDimensions = (ratio: string): CanvasDimensions => {
        const baseWidth = 1920; // High quality base
        const ratios: Record<string, CanvasDimensions> = {
            '16:9': { width: baseWidth, height: 1080 },
            '1:1': { width: 1080, height: 1080 },
            '9:16': { width: 1080, height: 1920 },
            '4:3': { width: 1440, height: 1080 },
        };
        return ratios[ratio] || ratios['16:9'];
    };

    const getColorScheme = (palette: string) => {
        const schemes: Record<string, { primary: string; secondary: string; accent: string; text: string; background: string }> = {
            blue: {
                primary: '#1e40af',
                secondary: '#3b82f6',
                accent: '#60a5fa',
                text: '#ffffff',
                background: '#0f172a'
            },
            green: {
                primary: '#065f46',
                secondary: '#059669',
                accent: '#34d399',
                text: '#ffffff',
                background: '#064e3b'
            },
            purple: {
                primary: '#6b21a8',
                secondary: '#9333ea',
                accent: '#c084fc',
                text: '#ffffff',
                background: '#581c87'
            },
            orange: {
                primary: '#c2410c',
                secondary: '#ea580c',
                accent: '#fb923c',
                text: '#ffffff',
                background: '#7c2d12'
            },
            red: {
                primary: '#991b1b',
                secondary: '#dc2626',
                accent: '#f87171',
                text: '#ffffff',
                background: '#7f1d1d'
            },
            teal: {
                primary: '#0f766e',
                secondary: '#14b8a6',
                accent: '#5eead4',
                text: '#ffffff',
                background: '#134e4a'
            }
        };
        return schemes[palette.toLowerCase()] || schemes.blue;
    };

    const generatePoster = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dimensions = getCanvasDimensions(aspectRatio);
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const colors = getColorScheme(colorPalette);

        // Clear canvas
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        // Apply style-specific rendering
        switch (style) {
            case 'modern':
                renderModernStyle(ctx, dimensions, colors);
                break;
            case 'classic':
                renderClassicStyle(ctx, dimensions, colors);
                break;
            case 'minimal':
                renderMinimalStyle(ctx, dimensions, colors);
                break;
            case 'vibrant':
                renderVibrantStyle(ctx, dimensions, colors);
                break;
        }

        // Draw content
        drawContent(ctx, dimensions, colors);

        // Export as image
        const imageData = canvas.toDataURL('image/png', 1.0);
        onGenerate(imageData);
    };

    const renderModernStyle = (ctx: CanvasRenderingContext2D, dim: CanvasDimensions, colors: any) => {
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, dim.width, dim.height);
        gradient.addColorStop(0, colors.background);
        gradient.addColorStop(1, colors.primary);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dim.width, dim.height);

        // Geometric shapes
        ctx.fillStyle = colors.accent + '20';
        ctx.beginPath();
        ctx.arc(dim.width * 0.8, dim.height * 0.2, 200, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.secondary + '15';
        ctx.fillRect(0, dim.height * 0.7, dim.width * 0.3, dim.height * 0.3);
    };

    const renderClassicStyle = (ctx: CanvasRenderingContext2D, dim: CanvasDimensions, colors: any) => {
        // Solid background
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, dim.width, dim.height);

        // Border frame
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 20;
        ctx.strokeRect(40, 40, dim.width - 80, dim.height - 80);

        // Inner decorative lines
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 60, dim.width - 120, dim.height - 120);
    };

    const renderMinimalStyle = (ctx: CanvasRenderingContext2D, dim: CanvasDimensions, colors: any) => {
        // Clean white/light background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, dim.width, dim.height);

        // Simple accent line
        ctx.fillStyle = colors.primary;
        ctx.fillRect(0, dim.height * 0.1, dim.width, 8);
    };

    const renderVibrantStyle = (ctx: CanvasRenderingContext2D, dim: CanvasDimensions, colors: any) => {
        // Multi-color gradient
        const gradient = ctx.createRadialGradient(
            dim.width / 2, dim.height / 2, 0,
            dim.width / 2, dim.height / 2, dim.width / 2
        );
        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(0.5, colors.primary);
        gradient.addColorStop(1, colors.background);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dim.width, dim.height);

        // Colorful circles
        const circles = [
            { x: 0.2, y: 0.3, r: 150, color: colors.accent + '40' },
            { x: 0.8, y: 0.7, r: 200, color: colors.secondary + '30' },
            { x: 0.5, y: 0.5, r: 100, color: colors.primary + '20' },
        ];

        circles.forEach(circle => {
            ctx.fillStyle = circle.color;
            ctx.beginPath();
            ctx.arc(dim.width * circle.x, dim.height * circle.y, circle.r, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    const drawContent = (ctx: CanvasRenderingContext2D, dim: CanvasDimensions, colors: any) => {
        const centerX = dim.width / 2;
        const centerY = dim.height / 2;

        // Amin Academy branding
        ctx.fillStyle = style === 'minimal' ? colors.primary : colors.text;
        ctx.font = `bold ${dim.width * 0.03}px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('AMIN ACADEMY', centerX, dim.height * 0.08);

        // Main title
        ctx.fillStyle = style === 'minimal' ? '#000000' : colors.text;
        const titleSize = dim.width * 0.06;
        ctx.font = `bold ${titleSize}px Inter, Arial, sans-serif`;

        // Word wrap for title
        const maxWidth = dim.width * 0.8;
        const titleLines = wrapText(ctx, title, maxWidth);
        const titleY = subtitle ? centerY - 100 : centerY - 50;

        titleLines.forEach((line, index) => {
            ctx.fillText(line, centerX, titleY + (index * titleSize * 1.2));
        });

        // Subtitle
        if (subtitle) {
            ctx.font = `${dim.width * 0.03}px Inter, Arial, sans-serif`;
            ctx.fillStyle = style === 'minimal' ? '#666666' : colors.accent;
            ctx.fillText(subtitle, centerX, centerY + 20);
        }

        // Content
        ctx.font = `${dim.width * 0.022}px Inter, Arial, sans-serif`;
        ctx.fillStyle = style === 'minimal' ? '#333333' : colors.text;
        const contentLines = wrapText(ctx, content, maxWidth);
        const contentY = centerY + (subtitle ? 100 : 80);

        contentLines.slice(0, 5).forEach((line, index) => {
            ctx.fillText(line, centerX, contentY + (index * dim.width * 0.03));
        });

        // Footer decoration
        if (style !== 'minimal') {
            ctx.fillStyle = colors.accent;
            ctx.fillRect(centerX - 100, dim.height * 0.92, 200, 4);
        }
    };

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    };

    return (
        <canvas
            ref={canvasRef}
            className="hidden"
            aria-label="Poster generation canvas"
        />
    );
}
