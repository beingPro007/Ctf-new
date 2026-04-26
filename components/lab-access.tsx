'use client'

import { useState } from 'react'
import { Terminal, Globe, Lock, Cpu, Power, Loader2, Link as LinkIcon, ExternalLink, Copy, Check } from 'lucide-react'

interface LabAccessProps {
    connections: string[]
    type: 'task' | 'challenge'
}

export function LabAccess({ connections, type }: LabAccessProps) {
    const [isDeploying, setIsDeploying] = useState(false)
    const [isDeployed, setIsDeployed] = useState(connections.length > 0)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    const handleDeploy = () => {
        setIsDeploying(true)
        setTimeout(() => {
            setIsDeploying(false)
            setIsDeployed(true)
        }, 2000)
    }

    const copyToClipboard = (text: string, index: number) => {
        let copyText = text;
        if (text.startsWith('ssh://')) copyText = `ssh ${text.replace('ssh://', '')}`;
        if (text.startsWith('nc://')) {
            const parts = text.replace('nc://', '').split(':');
            copyText = `nc ${parts[0]} ${parts[1]}`;
        }

        navigator.clipboard.writeText(copyText);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    }

    if (connections.length === 0 && !isDeploying && !isDeployed) {
        return (
            <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6 text-center space-y-4">
                <div className="flex justify-center">
                    <Terminal className="h-10 w-10 text-[#151515]" />
                </div>
                <div>
                    <h3 className="text-sm font-mono text-[#444]">Static Environment</h3>
                    <p className="text-[10px] font-mono text-[#333] mt-1 uppercase tracking-tighter">No dedicated machine required for this task.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] divide-y divide-[#111]">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#00ff66]" />
                    <h3 className="text-xs font-mono font-bold text-[#e6e6e6] tracking-widest uppercase">Target Machine</h3>
                </div>
                {!isDeployed ? (
                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff66] text-[#000] text-[10px] font-mono font-bold hover:bg-[#00dd55] transition-colors disabled:opacity-50"
                    >
                        {isDeploying ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                BOOTING...
                            </>
                        ) : (
                            <>
                                <Power className="h-3 w-3" />
                                START LAB
                            </>
                        )
                        }
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[#00ff66] text-[10px] font-mono font-bold uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
                            Environment Ready
                        </span>
                    </div>
                )}
            </div>

            {isDeployed && (
                <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="grid grid-cols-1 gap-2">
                        {connections.map((conn, i) => {
                            const isUrl = conn.startsWith('http')
                            const isSsh = conn.startsWith('ssh')
                            const isNc = conn.startsWith('nc')

                            return (
                                <div key={i} className="group relative border border-[#1a1a1a] bg-[#0a0a0a] p-3 flex items-center justify-between gap-4 hover:border-[#222] transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 border border-[#1a1a1a] bg-[#0d0d0d]">
                                            {isUrl ? <Globe className="h-3.5 w-3.5 text-[#39a0ff]" /> :
                                                isSsh ? <Lock className="h-3.5 w-3.5 text-[#ffa500]" /> :
                                                    <Terminal className="h-3.5 w-3.5 text-[#00ff66]" />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[9px] font-mono text-[#333] uppercase tracking-widest font-bold">
                                                {isUrl ? 'HTTP HOST' : isSsh ? 'SSH PROTOCOL' : isNc ? 'TCP SOCKET' : 'ENDPOINT'}
                                            </p>
                                            <p className="text-xs font-mono text-[#888] truncate">
                                                {conn.replace('ssh://', '').replace('nc://', '').replace('http://', '').replace('https://', '')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(isUrl || conn.startsWith('http')) && (
                                            <a
                                                href={conn}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 border border-[#1a1a1a] text-[#444] hover:text-[#39a0ff] hover:border-[#39a0ff]/20 transition-colors"
                                                title="Open in Browser"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => copyToClipboard(conn, i)}
                                            className="p-1.5 border border-[#1a1a1a] text-[#444] hover:text-[#00ff66] hover:border-[#00ff66]/20 transition-colors flex items-center gap-2"
                                            title="Copy Connection Command"
                                        >
                                            {copiedIndex === i ? <Check className="h-3 w-3 text-[#00ff66]" /> : <Copy className="h-3 w-3" />}
                                            <span className="text-[9px] uppercase font-bold hidden group-hover:inline transition-all duration-300">Copy</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="bg-[#00ff66]/5 border border-[#00ff66]/10 p-3 space-y-2">
                        <p className="text-[9px] font-mono text-[#00ff66]/60 leading-relaxed uppercase tracking-widest font-bold">
                            Connection Manual
                        </p>
                        <div className="text-[10px] font-mono text-[#444] space-y-1">
                            <p>• <span className="text-[#666]">HTTP:</span> Open provided URL in target browser.</p>
                            <p>• <span className="text-[#666]">SSH:</span> Copy command and execute in your terminal.</p>
                            <p>• <span className="text-[#666]">RAW:</span> Connect via Netcat/Socat using provided port.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
