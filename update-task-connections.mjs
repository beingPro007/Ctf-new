import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateTasks() {
    console.log('🚀 Updating task connection info...')

    // Get all rooms to identify which need SSH/Web info
    const { data: rooms } = await supabase.from('rooms').select('id, title')

    if (!rooms) return

    for (const room of rooms) {
        if (room.title.toLowerCase().includes('terminal') || room.title.toLowerCase().includes('linux')) {
            console.log(`Updating tasks for room: ${room.title}`)
            const { error } = await supabase
                .from('tasks')
                .update({
                    attachment_paths: ['ssh://ctfuser@localhost -p 2222'],
                    description: `This task requires access to a real Linux machine.\n\n**Mission:** Connect to the terminal box and follow the instructions to find the flag.\n\n**Credentials:**\n- User: ctfuser\n- Pass: password123`
                })
                .eq('room_id', room.id)
            if (error) console.error(error)
        }

        if (room.title.toLowerCase().includes('web') || room.title.toLowerCase().includes('fundamental')) {
            // Find existing tasks for this room
            const { data: tasks } = await supabase.from('tasks').select('id, description').eq('room_id', room.id)
            if (tasks) {
                for (const task of tasks) {
                    // If it's a web fundamental room, maybe it doesn't need a machine yet, 
                    // but let's assume we want to give them a "dummy" web target for practice if it's there.
                    // For now, let's skip unless we have a specific container.
                }
            }
        }
    }

    console.log('✅ Update complete!')
}

updateTasks()
