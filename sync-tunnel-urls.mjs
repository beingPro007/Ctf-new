import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Read environment from quick-tunnel.sh exports ────────
const URL_WEB1 = process.env.URL_WEB1 || null
const URL_WEB2 = process.env.URL_WEB2 || null
const URL_WEB3 = process.env.URL_WEB3 || null
const CONN_PWN = process.env.CONN_PWN || null
const CONN_CRYPTO = process.env.CONN_CRYPTO || null
const CONN_REV = process.env.CONN_REV || null
const CONN_SSH = process.env.CONN_SSH || null

// ── Challenge update definitions ──────────────────────────────────────────────
const updates = [
    {
        match: '[LIVE] Corp Login SQLi',
        table: 'challenges',
        connections: URL_WEB1 ? [URL_WEB1] : [],
        description: (conns) => `**Live SQL Injection Challenge**\n🌐 **Target:** \`${conns[0] ?? 'Run tunnel'}\``
    },
    {
        match: '[LIVE] TechBlog LFI',
        table: 'challenges',
        connections: URL_WEB2 ? [URL_WEB2] : [],
        description: (conns) => `**Live PHP LFI Challenge**\n🌐 **Target:** \`${conns[0] ?? 'Run tunnel'}\``
    },
    {
        match: '[LIVE] NetDiag Command Injection',
        table: 'challenges',
        connections: URL_WEB3 ? [URL_WEB3] : [],
        description: (conns) => `**Live OS Command Injection Challenge**\n🌐 **Target:** \`${conns[0] ?? 'Run tunnel'}\``
    },
    {
        match: '[LIVE] Stack Buffer Overflow',
        table: 'challenges',
        connections: CONN_PWN ? [`nc://${CONN_PWN.replace('nc ', '')}`] : [],
        description: (conns) => `**Live Binary Exploitation**\n🔌 **Connect:** \`${CONN_PWN || 'Run tunnel'}\``
    },
    {
        match: '[LIVE] Broken RSA Oracle',
        table: 'challenges',
        connections: CONN_CRYPTO ? [`nc://${CONN_CRYPTO.replace('nc ', '')}`] : [],
        description: (conns) => `**Live Crypto Challenge**\n🔌 **Connect:** \`${CONN_CRYPTO || 'Run tunnel'}\``
    },
    {
        match: '[LIVE] XOR Crackme',
        table: 'challenges',
        connections: CONN_REV ? [`nc://${CONN_REV.replace('nc ', '')}`] : [],
        description: (conns) => `**Live Reverse Engineering**\n🔌 **Connect:** \`${CONN_REV || 'Run tunnel'}\``
    },
    {
        match: '[LIVE] Linux Box Enumeration',
        table: 'challenges',
        connections: CONN_SSH ? [`ssh://${CONN_SSH.replace('ssh ctfuser@', '').replace(' -p ', ':')}`] : [],
        description: (conns) => `**Live Linux Box**\n🔌 **Connect:** \`${CONN_SSH || 'Run tunnel'}\`\nPassword: \`password123\``
    }
]

async function sync() {
    console.log('\n🔗 Syncing live infrastructure to database...\n')
    let ok = 0

    // 1. Sync Challenges
    for (const upd of updates) {
        if (!upd.connections.length) continue
        const { data } = await supabase
            .from('challenges')
            .update({ attachment_paths: upd.connections })
            .like('title', `%${upd.match}%`)
            .select('title')

        if (data?.length) {
            console.log(`   ✅ Challenge: ${data[0].title}`)
            console.log(`      → ${upd.connections[0]}`)
            ok++
        }
    }

    // 2. Sync Terminal Room Tasks to the SSH Box
    if (CONN_SSH) {
        const sshUrl = `ssh://${CONN_SSH.replace('ssh ctfuser@', '').replace(' -p ', ':')}`
        const { data: rooms } = await supabase.from('rooms').select('id, title').in('title', ['Introduction to Terminal', 'Linux Privilege Escalation'])

        for (const room of rooms || []) {
            const { data: tasks } = await supabase
                .from('tasks')
                .update({ attachment_paths: [sshUrl] })
                .eq('room_id', room.id)
                .select('title')

            if (tasks?.length) {
                console.log(`   ✅ Room Tasks: ${room.title} (${tasks.length} tasks synced)`)
                console.log(`      → ${sshUrl}`)
                ok++
            }
        }
    }

    console.log(`\n✅ Database sync complete! Updated records: ${ok}\n`)
}

sync().catch(err => console.error('❌ Sync error:', err))
