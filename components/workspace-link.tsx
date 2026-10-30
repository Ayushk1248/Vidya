'use client'
import {useLinkStatus} from 'next/link'
import {LocalizedLink,Label} from './language'
import type {ComponentPropsWithoutRef} from 'react'
function NavigationStatus(){const {pending}=useLinkStatus();return pending?<span className="workspace-navigation-progress" role="status"><span className="sr-only"><Label text="Loading workspace"/></span></span>:null}
export function WorkspaceLink({children,...props}:ComponentPropsWithoutRef<typeof LocalizedLink>){return <LocalizedLink {...props}>{children}<NavigationStatus/></LocalizedLink>}
