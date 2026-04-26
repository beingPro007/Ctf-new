'use client'

import { Server, Shield, Zap } from 'lucide-react'

export function LabStatusBanner({ hasMachines }: { hasMachines: boolean }) {
    if (!hasMachines) return (
        <div className="border border-[#1f1f1f] bg-[#0a0a0a] p-4 flex items-center gap-3">
            <div className="p-2 border border-[#1a1a1a] bg-[#111]">
                <Zap className="h-4 w-4 text-[#ffa500]" />
            </div>
            <div>
                <p className="text-[10px] font-mono text-[#444] uppercase tracking-widest font-bold">Lab Mode</p>
                <p className="text-xs font-mono text-[#888]">Static investigation. No live machine deployment required.</p>
            </div>
        </div>
    )

    return (
        <div className="border border-[#00ff66]/10 bg-[#00ff66]/5 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 border border-[#00ff66]/20 bg-[#00ff66]/5">
                    <Server className="h-4 w-4 text-[#00ff66]" />
                </div>
                <div>
                    <p className="text-[10px] font-mono text-[#00ff66] uppercase tracking-widest font-bold">Real Infrastructure</p>
                    <p className="text-xs font-mono text-[#00ff66]/60">This room supports live container deployment.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 border border-[#00ff66]/30 text-[10px] font-mono text-[#00ff66] uppercase font-bold">
                    <Shield className="h-3 w-3" />
                    Vulnerable Machine Ready
                </div>
            </div>
        </div>
    )
}
