 'use client'
import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
export function PasswordInput(props:InputHTMLAttributes<HTMLInputElement>) {
 const [visible,setVisible]=useState(false)
 return <div className="password-field"><input {...props} type={visible?'text':'password'}/><button type="button" className="password-toggle" aria-label={visible?'Hide password':'Show password'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
}
