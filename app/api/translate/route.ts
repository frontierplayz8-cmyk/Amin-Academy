import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/app/actions/translate';

export async function POST(request: NextRequest) {
    try {
        const { text, sourceLang = 'auto', targetLang } = await request.json();

        if (!text || !targetLang) {
            return NextResponse.json(
                { error: 'Text and target language are required' },
                { status: 400 }
            );
        }

        const translatedText = await translateText(text, targetLang, sourceLang);

        return NextResponse.json({
            originalText: text,
            translatedText: translatedText,
            targetLanguage: targetLang,
            sourceLanguage: sourceLang
        });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed. Please try again.' },
            { status: 500 }
        );
    }
}
