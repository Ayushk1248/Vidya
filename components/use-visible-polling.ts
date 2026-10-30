'use client'
import {useEffect} from 'react'
import {visiblePolling} from '@/lib/visible-polling.mjs'
export function useVisiblePolling(refresh:(signal?:AbortSignal)=>Promise<void>,interval:number){
 useEffect(()=>visiblePolling(refresh,()=>interval),[refresh,interval])
}
