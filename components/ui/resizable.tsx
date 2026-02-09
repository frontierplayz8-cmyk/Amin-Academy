"use client"

import { GripVertical } from "lucide-react"
import {
    Group,
    Panel,
    Separator as PanelSeparator,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
    className,
    ...props
}: React.ComponentProps<typeof Group>) => (
    <Group
        className={cn(
            "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
            className
        )}
        {...props}
    />
)

const ResizablePanel = Panel

const ResizableHandle = ({
    withHandle,
    className,
    ...props
}: React.ComponentProps<typeof PanelSeparator> & {
    withHandle?: boolean
}) => (
    <PanelSeparator
        className={cn(
            "relative flex w-px items-center justify-center bg-black/40 transition-all after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 hover:bg-blue-600/50 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:translate-y-1/2",
            className
        )}
        {...props}
    >
        {withHandle && (
            <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-[#2d2d2d] border-white/10">
                <GripVertical className="h-2.5 w-2.5 text-zinc-500" />
            </div>
        )}
    </PanelSeparator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
