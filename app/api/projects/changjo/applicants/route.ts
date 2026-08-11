import { NextResponse } from 'next/server'
import {
  loadApplicants,
  saveApplicants,
  normalizeApplicant,
  validateApplicants,
  APPLICANT_DEFAULTS,
} from '@/lib/changjo/applicants'
import type { ChangjoApplicantData } from '@/types/changjo'

export async function GET() {
  return NextResponse.json({ ...loadApplicants(), defaults: APPLICANT_DEFAULTS })
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChangjoApplicantData>
    if (!Array.isArray(body.applicants)) {
      return NextResponse.json({ error: 'applicants 배열이 필요합니다' }, { status: 400 })
    }

    const applicants = body.applicants.map(normalizeApplicant)
    const problem = validateApplicants(applicants)
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })

    saveApplicants({ applicants })
    return NextResponse.json({ ok: true, applicants })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
