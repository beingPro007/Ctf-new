'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Play, Square, RotateCcw, Terminal, Globe, Lock,
    Cpu, MemoryStick, Activity, Server, Zap, AlertCircle,
    CheckCircle2, XCircle, Loader2, RefreshCw, Power
} from 'lucide-react'

type Container = {
    id: string
    name: string
    image: string
    status: string
    state: string
    ports: string
    created: string
    cpu: string
    mem: string
    // Meta
    category?: string
    difficulty?: string
    description?: string
    connection?: string
    port?: string
}

const CATEGORY_COLORS: Record<string, string> = {
    Pwn: 'text-[#ff4444] border-[#ff4444]/30 bg-[#ff4444]/5',
    Web: 'text-[#39a0ff] border-[#39a0ff]/30 bg-[#39a0ff]/5',
    Crypto: 'text-[#ffa500] border-[#ffa500]/30 bg-[#ffa500]/5',
    Misc: 'text-[#00ff66] border-[#00ff66]/30 bg-[#00ff66]/5',
    Reverse: 'text-[#ff00ff] border-[#ff00ff]/30 bg-[#ff00ff]/5',
}

const DIFF_COLORS: Record<string, string> = {
    easy: 'text-[#00ff66]',
    medium: 'text-[#ffa500]',
    hard: 'text-[#ff4444]',
    insane: 'text-[#ff00ff]',
}

function StatusBadge({ state }: { state: string }) {
    if (state === 'running') return (
        <span className="flex items-center gap-1.5 text-[#00ff66] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
            RUNNING
        </span>
    )
    if (state === 'exited') return (
        <span className="flex items-center gap-1.5 text-[#ff4444] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#ff4444]" />
            STOPPED
        </span>
    )
    return (
        <span className="flex items-center gap-1.5 text-[#ffa500] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#ffa500]" />
            {state.toUpperCase()}
        </span>
    )
}

export default function InfrastructurePage() {
    const [containers, setContainers] = useState<Container[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<Record<string, string>>({})
    const [composeLoading, setComposeLoading] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    const fetchContainers = useCallback(async () => {
        try {
            const res = await fetch('/api/infrastructure')
            const data = await res.json()
            setContainers(data.containers || [])
            setLastRefresh(new Date())
        } catch {
            showToast('Failed to fetch container status', false)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchContainers()
        const interval = setInterval(fetchContainers, 10000)
        return () => clearInterval(interval)
    }, [fetchContainers])

    const containerAction = async (action: string, name: string) => {
        setActionLoading(prev => ({ ...prev, [name]: action }))
        try {
            const res = await fetch('/api/infrastructure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-action': document.cookie.match(/infra-key=([^;]+)/)?.[1] || '',
                },
                body: JSON.stringify({ action, container: name }),
            })
            const data = await res.json()
            if (data.error) {
                showToast(`Error: ${data.error}`, false)
            } else {
                showToast(data.message, true)
                setTimeout(fetchContainers, 1500)
            }
        } catch {
            showToast('Request failed', false)
        } finally {
            setActionLoading(prev => {
                const next = { ...prev }
                delete next[name]
                return next
            })
        }
    }

    const composeAction = async (action: string) => {
        const key = prompt('Enter admin key (last 8 chars of service role key):')
        if (!key) return
        setComposeLoading(action)
        try {
            const res = await fetch('/api/infrastructure', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-action': key,
                },
                body: JSON.stringify({ action }),
            })
            const data = await res.json()
            if (data.error) {
                showToast(`Error: ${data.error}`, false)
            } else {
                showToast(`Compose ${action} completed`, true)
                setTimeout(fetchContainers, 2000)
            }
        } catch {
            showToast('Request failed', false)
        } finally {
            setComposeLoading(null)
        }
    }

    const runningCount = containers.filter(c => c.state === 'running').length
    const stoppedCount = containers.filter(c => c.state !== 'running').length

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 border font-mono text-sm transition-all ${toast.ok ? 'border-[#00ff66]/40 bg-[#00ff66]/10 text-[#00ff66]' : 'border-[#ff4444]/40 bg-[#ff4444]/10 text-[#ff4444]'
                    }`}>
                    {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
                        <span className="text-[#ff00ff]">{'>'}</span> Infrastructure
                    </h1>
                    <p className="text-xs text-[#444] font-mono mt-1">
                        Live CTF challenge containers — updated {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={fetchContainers}
                    className="flex items-center gap-2 px-3 py-2 border border-[#222] text-xs font-mono text-[#666] hover:text-[#e6e6e6] hover:border-[#444] transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Total Containers', value: containers.length, icon: Server, color: 'text-[#39a0ff]' },
                    { label: 'Running', value: runningCount, icon: CheckCircle2, color: 'text-[#00ff66]' },
                    { label: 'Stopped', value: stoppedCount, icon: XCircle, color: 'text-[#ff4444]' },
                    { label: 'Health', value: `${Math.round((runningCount / Math.max(containers.length, 1)) * 100)}%`, icon: Activity, color: 'text-[#ffa500]' },
                ].map(stat => (
                    <div key={stat.label} className="border border-[#ff00ff]/10 bg-[#0f0f0f] p-4 flex items-center gap-3">
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <div>
                            <p className="text-[10px] text-[#444] font-mono tracking-widest">{stat.label.toUpperCase()}</p>
                            <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Compose actions */}
            <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Power className="w-4 h-4 text-[#ff00ff]" />
                        <span className="text-sm font-mono text-[#e6e6e6]">Docker Compose Controls</span>
                        <span className="text-xs font-mono text-[#444]">— all containers</span>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { action: 'up', label: 'Start All', icon: Play, color: 'hover:border-[#00ff66]/40 hover:text-[#00ff66]' },
                            { action: 'restart', label: 'Restart All', icon: RotateCcw, color: 'hover:border-[#ffa500]/40 hover:text-[#ffa500]' },
                            { action: 'down', label: 'Stop All', icon: Square, color: 'hover:border-[#ff4444]/40 hover:text-[#ff4444]' },
                        ].map(({ action, label, icon: Icon, color }) => (
                            <button
                                key={action}
                                onClick={() => composeAction(action)}
                                disabled={!!composeLoading}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border border-[#222] text-xs font-mono text-[#666] transition-colors disabled:opacity-40 ${color}`}
                            >
                                {composeLoading === action ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Icon className="w-3 h-3" />
                                )}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Container cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-[#444] font-mono gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading containers...
                </div>
            ) : containers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <AlertCircle className="w-8 h-8 text-[#444]" />
                    <p className="text-[#444] font-mono text-sm">No CTF containers found.</p>
                    <p className="text-[#333] font-mono text-xs">Run: cd ctf-infra && docker compose up -d</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {containers.map(container => {
                        const catColor = CATEGORY_COLORS[container.category || ''] || 'text-[#666] border-[#333]/30 bg-[#333]/5'
                        const diffColor = DIFF_COLORS[container.difficulty || ''] || 'text-[#666]'
                        const isLoading = !!actionLoading[container.name]
                        const isRunning = container.state === 'running'

                        return (
                            <div
                                key={container.name}
                                className={`border bg-[#0f0f0f] transition-colors ${isRunning ? 'border-[#1a2a1a]' : 'border-[#1f1f1f]'}`}
                            >
                                <div className="p-4 flex items-start justify-between gap-4">
                                    {/* Left info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-sm font-mono font-bold text-[#e6e6e6]">
                                                {container.name || 'unknown'}
                                            </span>
                                            {container.category && (
                                                <span className={`text-[10px] font-mono px-2 py-0.5 border ${catColor}`}>
                                                    {container.category.toUpperCase()}
                                                </span>
                                            )}
                                            {container.difficulty && (
                                                <span className={`text-[10px] font-mono ${diffColor}`}>
                                                    {container.difficulty}
                                                </span>
                                            )}
                                            <StatusBadge state={container.state} />
                                        </div>

                                        {container.description && (
                                            <p className="text-xs text-[#555] font-mono leading-relaxed max-w-xl">
                                                {container.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 flex-wrap">
                                            {container.connection && (
                                                <div className="flex items-center gap-1.5">
                                                    {container.connection.startsWith('http') ? (
                                                        <Globe className="w-3 h-3 text-[#39a0ff]" />
                                                    ) : container.connection.startsWith('ssh') ? (
                                                        <Lock className="w-3 h-3 text-[#ffa500]" />
                                                    ) : (
                                                        <Terminal className="w-3 h-3 text-[#00ff66]" />
                                                    )}
                                                    <code className="text-[11px] text-[#39a0ff] font-mono bg-[#0a0a0a] px-2 py-0.5 border border-[#1a1a1a]">
                                                        {container.connection}
                                                    </code>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 text-[10px] font-mono text-[#444]">
                                                <span className="flex items-center gap-1">
                                                    <Cpu className="w-3 h-3" />
                                                    {container.cpu || '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MemoryStick className="w-3 h-3" />
                                                    {container.mem?.split('/')[0]?.trim() || '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Port {container.port || container.ports?.split('->')[0]?.split(':').pop() || '?'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right actions */}
                                    <div className="flex flex-col gap-2 min-w-[120px]">
                                        {[
                                            { action: 'start', label: 'Start', icon: Play, color: 'hover:border-[#00ff66]/40 hover:text-[#00ff66]', disabled: isRunning },
                                            { action: 'restart', label: 'Restart', icon: RotateCcw, color: 'hover:border-[#ffa500]/40 hover:text-[#ffa500]', disabled: false },
                                            { action: 'stop', label: 'Stop', icon: Square, color: 'hover:border-[#ff4444]/40 hover:text-[#ff4444]', disabled: !isRunning },
                                        ].map(({ action, label, icon: Icon, color, disabled }) => (
                                            <button
                                                key={action}
                                                onClick={() => containerAction(action, container.name)}
                                                disabled={isLoading || disabled}
                                                className={`flex items-center justify-center gap-1.5 w-full px-3 py-1.5 border border-[#222] text-xs font-mono text-[#666] transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${!disabled ? color : ''}`}
                                            >
                                                {isLoading && actionLoading[container.name] === action ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Icon className="w-3 h-3" />
                                                )}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom status bar */}
                                <div className="border-t border-[#111] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-[#333]">
                                    <span>Image: {container.image}</span>
                                    <span>ID: {container.id?.slice(0, 12)}</span>
                                    <span className={isRunning ? 'text-[#1a3a1a]' : 'text-[#ff4444]/30'}>
                                        {container.status}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
