import { sessionActor, apiError } from '@/lib/platform/session'
import { institution, programs, enrolments } from '@/lib/platform/repository.mjs'
export const runtime = 'nodejs'
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await sessionActor(); const {id} = await context.params
    const query = new URL(request.url).searchParams
    const year = Number(query.get('year') || 2026)
    return Response.json({ institution: institution(actor,id), programs: programs(actor,id,year),
      enrolments: enrolments(actor,{institutionId:id,year,page:query.get('page')}) })
  } catch (e) { return apiError(e) }
}
