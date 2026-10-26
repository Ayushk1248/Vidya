import { sessionActor, apiError } from '@/lib/platform/session'
import { enrolment } from '@/lib/platform/repository.mjs'
export const runtime = 'nodejs'
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json(enrolment(await sessionActor(),(await context.params).id,Number(new URL(request.url).searchParams.get('year') || 2026))) }
  catch (e) { return apiError(e) }
}
