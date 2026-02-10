import React from 'react'
import {
    BringToFront, SendToBack,
    Trash2, Copy, Lock, Unlock,
    Layers, Scissors, Eraser, Star,
    Clipboard, Group, Ungroup
} from 'lucide-react'
import {
    ContextMenu as UIContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface CustomContextMenuProps {
    children: React.ReactNode
    onBringToFront: () => void
    onSendToBack: () => void
    onBringForward: () => void
    onSendBackward: () => void
    onDelete: () => void
    onDuplicate: () => void
    onLock: () => void
    onUnlock: () => void
    isLocked: boolean
    onRemoveBackground?: () => void
    zIndex: number
    onZIndexChange: (val: number) => void
    onSaveToAssets?: () => void
    onCopy?: () => void
    onPaste?: () => void
    onGroup?: () => void
    onUngroup?: () => void
}

export function CustomContextMenu({
    children,
    onBringToFront,
    onSendToBack,
    onBringForward,
    onSendBackward,
    onDelete,
    onDuplicate,
    onLock,
    onUnlock,
    isLocked,
    onRemoveBackground,
    zIndex,
    onZIndexChange,
    onSaveToAssets,
    onCopy,
    onPaste,
    onGroup,
    onUngroup
}: CustomContextMenuProps) {
    return (
        <UIContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 bg-[#2d2d2d] border-black/40 text-white shadow-2xl rounded-xl p-1">
                <ContextMenuItem inset onClick={onBringToFront} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                    <BringToFront className="mr-2 h-4 w-4" />
                    Bring to Front
                    <ContextMenuShortcut>⇧⌘]</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset onClick={onSendToBack} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                    <SendToBack className="mr-2 h-4 w-4" />
                    Send to Back
                    <ContextMenuShortcut>⇧⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                        <Layers className="mr-2 h-4 w-4" />
                        Arrange
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48 bg-[#2d2d2d] border-black/40 text-white shadow-xl rounded-xl p-1">
                        <ContextMenuItem onClick={onBringForward} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                            Bring Forward
                            <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={onSendBackward} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                            Send Backward
                            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-white/10" />
                        <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs text-zinc-400 font-medium">Z-Index</span>
                            <input
                                type="number"
                                value={zIndex}
                                onChange={(e) => onZIndexChange(parseInt(e.target.value))}
                                className="w-16 h-6 bg-black/40 border border-white/10 rounded px-1 text-xs text-white focus:border-blue-500/50 outline-none text-right"
                            />
                        </div>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSeparator className="bg-white/10" />

                {onRemoveBackground && (
                    <ContextMenuItem inset onClick={onRemoveBackground} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                        <Eraser className="mr-2 h-4 w-4" />
                        Remove Background
                    </ContextMenuItem>
                )}
                {onSaveToAssets && (
                    <ContextMenuItem inset onClick={onSaveToAssets} className="hover:bg-emerald-600/20 focus:bg-emerald-600/20 focus:text-emerald-400 cursor-pointer rounded-lg">
                        <Star className="mr-2 h-4 w-4" />
                        Save to Assets
                    </ContextMenuItem>
                )}
                <ContextMenuItem inset onClick={onDuplicate} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                    <ContextMenuShortcut>⌘D</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem inset onClick={onCopy} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                    <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem inset onClick={onPaste} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                    <Clipboard className="mr-2 h-4 w-4" />
                    Paste
                    <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator className="bg-white/10" />

                <ContextMenuItem inset onClick={onGroup} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                    <Group className="mr-2 h-4 w-4" />
                    Group
                    <ContextMenuShortcut>⌘G</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem inset onClick={onUngroup} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                    <Ungroup className="mr-2 h-4 w-4" />
                    Ungroup
                    <ContextMenuShortcut>⇧⌘G</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator className="bg-white/10" />

                {isLocked ? (
                    <ContextMenuItem inset onClick={onUnlock} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                        <Unlock className="mr-2 h-4 w-4" />
                        Unlock
                        <ContextMenuShortcut>⌘L</ContextMenuShortcut>
                    </ContextMenuItem>
                ) : (
                    <ContextMenuItem inset onClick={onLock} className="hover:bg-blue-600/20 focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer rounded-lg">
                        <Lock className="mr-2 h-4 w-4" />
                        Lock
                        <ContextMenuShortcut>⌘L</ContextMenuShortcut>
                    </ContextMenuItem>
                )}

                <ContextMenuItem inset onClick={onDelete} className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                    <ContextMenuShortcut>⌫</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </UIContextMenu>
    )
}
