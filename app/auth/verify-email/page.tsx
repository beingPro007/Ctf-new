import Link from 'next/link'
import { CheckCircle2, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Terminal className="h-6 w-6 text-[#00ff66]" />
          <span className="text-[#00ff66] text-2xl font-bold tracking-widest">CTF</span>
        </div>

        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-8 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-[#00ff66] mx-auto" />
          <h1 className="text-lg font-mono text-[#e6e6e6]">Check Your Email</h1>
          <p className="text-xs text-[#666] font-mono">
            We sent a verification link to your email address. Click the link to verify your
            account and get started.
          </p>
          <p className="text-[10px] text-[#444] font-mono">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
