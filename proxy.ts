import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseConfiguration } from '@/lib/auth/config'
import { parsePortalPath, requestPortal, portalPath, validPortal, rolePortal, legacyPortal } from '@/lib/platform/portals.mjs'
import { requestOrigin } from '@/lib/platform/origin'

const workspaceRoutes = /^\/(dashboard|uploads|reports|verification|certificates|records|institutions|anomalies|cases|activity|notifications|integrations|admin|access|security|onboarding)(\/|$)/
export async function proxy(request: NextRequest) {
  const origin = requestOrigin(request)
  const visibleUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, origin)
  const portal = parsePortalPath(visibleUrl.pathname)
  const category = portal?.category || validPortal(visibleUrl.searchParams.get('__vidya_portal')) || requestPortal(visibleUrl.href, request.headers.get('referer')) || validPortal(visibleUrl.searchParams.get('portal')) || rolePortal(visibleUrl.searchParams.get('portal')||'') || legacyPortal(visibleUrl.pathname)
  const forwarded = new Headers(request.headers)
  forwarded.delete('x-vidya-portal')
  if (category) forwarded.set('x-vidya-portal', category)
  const target = new URL(visibleUrl)
  if (portal && portal.path !== '/') {target.pathname = portal.path;target.searchParams.set('__vidya_portal',portal.category)}
  const redirect = !portal && category && !visibleUrl.searchParams.has('__vidya_portal') && workspaceRoutes.test(visibleUrl.pathname)
  const createResponse = () => redirect
    ? NextResponse.redirect(new URL(portalPath(visibleUrl.pathname, category) + visibleUrl.search, origin))
    : portal && portal.path !== '/' ? NextResponse.rewrite(target, { request: { headers: forwarded } }) : NextResponse.next({ request: { headers: forwarded } })
  let response = createResponse()
  const { url, key } = supabaseConfiguration()
  const needsRefresh = !visibleUrl.pathname.startsWith('/api/') && (portal || workspaceRoutes.test(visibleUrl.pathname) || ['/login', '/signup'].includes(visibleUrl.pathname))
  if (url && key && needsRefresh && request.cookies.getAll().some(c => c.name.startsWith('sb-'))) {
    const client = createServerClient(url, key, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        const previous = response.cookies.getAll()
        values.forEach(({name,value}) => request.cookies.set(name,value))
        forwarded.set('cookie', request.headers.get('cookie') || '')
        response = createResponse()
        previous.forEach(cookie => response.cookies.set(cookie))
        values.forEach(({name,value,options}) => response.cookies.set(name,value,options))
      },
    } })
    try { await client.auth.getUser() } catch { /* The page verifies access and shows sign-in when required. */ }
  }
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$).*)'] }
