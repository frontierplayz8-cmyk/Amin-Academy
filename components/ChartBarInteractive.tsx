"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { useAuthenticatedFetch } from "@/lib/useAuthenticatedFetch"

export const description = "An interactive bar chart"

const chartConfig = {
    views: {
        label: "Metrics",
    },
    exams: {
        label: "Exams Generated",
        color: "#f59e0b",
    },
    users: {
        label: "New Users",
        color: "#10b981",
    },
} satisfies ChartConfig

export function ChartBarInteractive() {
    const { authFetch, user, loading: authLoading } = useAuthenticatedFetch()
    const [activeChart, setActiveChart] =
        React.useState<keyof typeof chartConfig>("exams")
    const [chartData, setChartData] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchMetrics = async () => {
        try {
            const res = await authFetch('/api/admin/metrics')
            const data = await res.json()
            if (data.success && data.chartData) {
                setChartData(data.chartData)
            }
        } catch (error) {
            console.error("Failed to fetch live metrics")
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        if (!authLoading && user) {
            fetchMetrics()
            // Refresh every minute to keep it reasonably up to date without overloading
            const interval = setInterval(fetchMetrics, 60000)
            return () => clearInterval(interval)
        }
    }, [authLoading, user])

    const total = React.useMemo(
        () => ({
            exams: chartData.reduce((acc, curr) => acc + (curr.exams || 0), 0),
            users: chartData.reduce((acc, curr) => acc + (curr.users || 0), 0),
        }),
        [chartData]
    )

    return (
        <Card className="bg-zinc-900/40 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-col items-stretch border-b border-white/5 p-0! sm:flex-row bg-[#0a0a0a]">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6!">
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter">System Traffic Analysis</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">
                        Live telemetry for the last 30 operational cycles
                    </CardDescription>
                </div>
                <div className="flex">
                    {["exams", "users"].map((key) => {
                        const chart = key as keyof typeof chartConfig
                        return (
                            <button
                                key={chart}
                                data-active={activeChart === chart}
                                className="data-[active=true]:bg-white/5 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-white/5 px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                                onClick={() => setActiveChart(chart)}
                            >
                                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                    {chartConfig[chart].label}
                                </span>
                                <span className="text-2xl leading-none font-black tabular-nums italic">
                                    {total[key as keyof typeof total].toLocaleString()}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-6 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[300px] w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeOpacity={0.1} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                            className="text-[10px] font-mono font-bold text-zinc-600"
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[180px] bg-zinc-950 border-white/10"
                                    nameKey="views"
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    }}
                                />
                            }
                        />
                        <Bar
                            dataKey={activeChart}
                            fill={activeChart === 'exams' ? '#f59e0b' : '#10b981'}
                            radius={[4, 4, 0, 0]}
                            className="opacity-80 hover:opacity-100"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
