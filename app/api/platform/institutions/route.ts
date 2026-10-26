import { sessionActor, apiError } from '@/lib/platform/session'
import { institutions } from '@/lib/platform/repository.mjs'
export const runtime = 'nodejs'
export async function GET() {
  try { return Response.json({ institutions: institutions(await sessionActor()) }) } catch (e) { return apiError(e) }
}
