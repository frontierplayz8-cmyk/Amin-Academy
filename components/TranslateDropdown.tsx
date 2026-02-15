"use client";

import { useState } from "react";
import { Check, Copy, Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TranslateDropdownProps {
    text: string;
    onTranslate?: (translatedText: string, language: string) => void;
}

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "ur", name: "Urdu (اردو)" },
    { code: "ar", name: "Arabic (العربية)" },
    { code: "fr", name: "French (Français)" },
    { code: "es", name: "Spanish (Español)" },
    { code: "de", name: "German (Deutsch)" },
    { code: "zh-CN", name: "Chinese (中文)" },
    { code: "ja", name: "Japanese (日本語)" },
    { code: "ko", name: "Korean (한국어)" },
    { code: "hi", name: "Hindi (हिन्दी)" },
    { code: "bn", name: "Bengali (বাংলা)" },
    { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
    { code: "fa", name: "Persian (فارسی)" },
    { code: "tr", name: "Turkish (Türkçe)" },
    { code: "ru", name: "Russian (Русский)" },
];

export default function TranslateDropdown({ text, onTranslate }: TranslateDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState("ur");
    const [translatedText, setTranslatedText] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleTranslate = async () => {
        if (!text.trim()) {
            toast.error("No text to translate");
            return;
        }

        setIsTranslating(true);
        try {
            const response = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text.trim(),
                    targetLang: selectedLang,
                }),
            });

            if (!response.ok) throw new Error("Translation failed");

            const data = await response.json();
            setTranslatedText(data.translatedText);
            toast.success(`Translated to ${LANGUAGES.find(l => l.code === selectedLang)?.name}`);
        } catch (error) {
            console.error("Translation error:", error);
            toast.error("Translation failed. Please try again.");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(translatedText);
            setCopied(true);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy");
        }
    };

    const handleReplace = () => {
        if (translatedText && onTranslate) {
            onTranslate(translatedText, selectedLang);
            toast.success("Text replaced with translation");
            setIsOpen(false);
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                title="Translate"
            >
                <Languages size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 p-4">
                    <div className="space-y-3">
                        {/* Language Selector */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Translate to:
                            </label>
                            <select
                                value={selectedLang}
                                onChange={(e) => setSelectedLang(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Translate Button */}
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Translating...
                                </>
                            ) : (
                                <>
                                    <Languages size={16} />
                                    Translate
                                </>
                            )}
                        </button>

                        {/* Translation Result */}
                        {translatedText && (
                            <div className="space-y-2">
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
                                    <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                                        {translatedText}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={14} />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    {onTranslate && (
                                        <button
                                            onClick={handleReplace}
                                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors"
                                        >
                                            Replace Text
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
