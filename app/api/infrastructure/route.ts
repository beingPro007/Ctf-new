import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

const execAsync = promisify(exec)

// Detect if we're running on Vercel (serverless - Docker is unavailable)
const IS_VERCEL = !!process.env.VERCEL
const COMPOSE_DIR = path.resolve(process.cwd(), 'ctf-infra')

// The IP where Docker containers are running.
// Locally → localhost  |  VPS → set CTF_SERVER_IP=your.vps.ip in env
const CTF_SERVER_HOST = process.env.CTF_SERVER_IP || 'localhost'

// Challenge metadata for rich display
const CHALLENGE_META: Record<string, {
    name: string
    category: string
    difficulty: string
    description: string
    connection: string
    port: string
}> = {
    'ctf-pwn-001': {
        name: 'Stack Buffer Overflow',
        category: 'Pwn',
        difficulty: 'medium',
        description: 'Classic C binary with gets() vulnerability. Players overflow the buffer to hijack RIP.',
        connection: 'nc localhost 4001',
        port: '4001',
    },
    'ctf-web-001': {
        name: 'Corp Login SQLi',
        category: 'Web',
        difficulty: 'easy',
        description: 'Flask + SQLite app with raw SQL string concatenation. Classic login bypass + UNION injection.',
        connection: 'http://localhost:5001',
        port: '5001',
    },
    'ctf-web-002': {
        name: 'TechBlog LFI',
        category: 'Web',
        difficulty: 'easy',
        description: 'PHP app using include() on unsanitized ?page= param. Path traversal to /secret/flag.txt.',
        connection: 'http://localhost:5002',
        port: '5002',
    },
    'ctf-web-003': {
        name: 'NetDiag Cmd Injection',
        category: 'Web',
        difficulty: 'medium',
        description: 'Node.js ping tool that passes user input directly to exec(). OS command injection.',
        connection: 'http://localhost:5003',
        port: '5003',
    },
    'ctf-crypto-001': {
        name: 'Broken RSA Oracle',
        category: 'Crypto',
        difficulty: 'medium',
        description: 'RSA with e=3 and no padding. Cube root attack when m³ < n.',
        connection: 'nc localhost 4002',
        port: '4002',
    },
    'ctf-ssh-001': {
        name: 'Linux Enumeration Box',
        category: 'Misc',
        difficulty: 'easy',
        description: 'Real Debian SSH box with hidden flags, SUID binaries, and interesting file system artifacts.',
        connection: 'ssh ctfuser@localhost -p 2222',
        port: '2222',
    },
    'ctf-rev-001': {
        name: 'XOR Crackme',
        category: 'Reverse',
        difficulty: 'medium',
        description: 'Stripped C binary with XOR-encoded flag. Analyze with strings/ltrace/Ghidra.',
        connection: 'nc localhost 4003',
        port: '4003',
    },
}

async function getContainerStats() {
    try {
        const { stdout } = await execAsync(
            `docker ps -a --format '{{json .}}' --filter "name=ctf-"`,
            { timeout: 10000 }
        )

        const containers = stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => {
                const c = JSON.parse(line)
                const meta = CHALLENGE_META[c.Names] || {}
                return {
                    id: c.ID,
                    name: c.Names, // docker container name (e.g. ctf-pwn-001)
                    image: c.Image,
                    status: c.Status,
                    state: c.State,
                    ports: c.Ports,
                    created: c.CreatedAt,
                    displayName: meta.name,
                    category: meta.category,
                    difficulty: meta.difficulty,
                    description: meta.description,
                    connection: meta.connection,
                    port: meta.port,
                }
            })

        return containers
    } catch {
        return []
    }
}

async function requireAdminKey(req: NextRequest) {
    // Simple check: must have admin cookie (NextJS session)
    // In production, also verify with Supabase admin check
    const authHeader = req.headers.get('x-admin-action')
    return authHeader === process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-8)
}

export async function GET(req: NextRequest) {
    if (IS_VERCEL) {
        return NextResponse.json({
            containers: [],
            vercel: true,
            message: 'Docker infrastructure is not available on Vercel. Run containers on a dedicated VPS and set CTF_SERVER_IP env var.',
        })
    }
    const containers = await getContainerStats()

    // Get CPU/memory stats for running containers
    let stats: Record<string, { cpu: string; mem: string }> = {}
    try {
        const { stdout } = await execAsync(
            `docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}}' $(docker ps -q --filter "name=ctf-") 2>/dev/null`,
            { timeout: 10000 }
        )
        stdout.trim().split('\n').filter(Boolean).forEach((line) => {
            const [name, cpu, mem] = line.split(',')
            stats[name] = { cpu, mem }
        })
    } catch { /* no running containers */ }

    const enriched = containers.map((c) => ({
        ...c,
        cpu: stats[c.name]?.cpu || '0%',
        mem: stats[c.name]?.mem || '0B / 0B',
    }))

    return NextResponse.json({ containers: enriched })
}

export async function POST(req: NextRequest) {
    if (IS_VERCEL) return NextResponse.json({ error: 'Docker not available on Vercel. Use a VPS.' }, { status: 503 })
    const isAdmin = await requireAdminKey(req)
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, container } = await req.json()

    if (!action || !container) {
        return NextResponse.json({ error: 'Missing action or container' }, { status: 400 })
    }

    // Validate container name to prevent injection
    if (!/^ctf-[a-z0-9-]+$/.test(container)) {
        return NextResponse.json({ error: 'Invalid container name' }, { status: 400 })
    }

    const allowedActions = ['start', 'stop', 'restart']
    if (!allowedActions.includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    try {
        await execAsync(`docker ${action} ${container}`, { timeout: 30000 })
        return NextResponse.json({ success: true, message: `Container ${container} ${action}ed.` })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

// Compose-level actions
export async function PUT(req: NextRequest) {
    if (IS_VERCEL) return NextResponse.json({ error: 'Docker Compose not available on Vercel. Use a VPS.' }, { status: 503 })
    const isAdmin = await requireAdminKey(req)
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    const allowedActions: Record<string, string> = {
        'up': `docker compose -f ${COMPOSE_DIR}/docker-compose.yml up -d`,
        'down': `docker compose -f ${COMPOSE_DIR}/docker-compose.yml down`,
        'restart': `docker compose -f ${COMPOSE_DIR}/docker-compose.yml restart`,
    }

    if (!allowedActions[action]) {
        return NextResponse.json({ error: 'Invalid compose action' }, { status: 400 })
    }

    try {
        const { stdout } = await execAsync(allowedActions[action], { timeout: 60000 })
        return NextResponse.json({ success: true, output: stdout })
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
