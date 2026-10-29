'use client'
import {Label,LocalizedSelect,LocalizedButton,LocalizedInput,LocalizedLink,LocalizedAnchor} from '@/components/language'


import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Lightbulb, Building2, X } from 'lucide-react'
import type { ReportFilterOptions } from '@/lib/platform/reports.mjs'

const keys = ['type', 'year', 'region', 'state', 'institution', 'program', 'level', 'institution_type', 'category'] as const
type Key = typeof keys[number]
const unique = (values: string[]) => [...new Set(values)].sort()
const normal = (value: string) => value.toLocaleLowerCase().trim()

export function ReportFilters({ options, initial, types, summary }: { options: ReportFilterOptions; initial: Record<string, string>; types: Record<string, string>; summary: string }) {
  const router = useRouter()
  const defaults = Object.fromEntries(keys.map(key => [key, initial[key]?.trim() || (key === 'type' ? 'intake' : key === 'year' ? '2026' : '')])) as Record<Key, string>
  const originalCollege = options.institutions.find(i => normal(i.id) === normal(defaults.institution))
  if (originalCollege) defaults.institution = originalCollege.id
  const [fields, setFields] = useState(defaults)
  const [college, setCollege] = useState(originalCollege?.name || defaults.institution)
  const [collegeId, setCollegeId] = useState(originalCollege?.id || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const institution = collegeId || college.trim()
  const draft = { ...fields, institution }
  const dirty = keys.some(key => draft[key] !== defaults[key])
  const params = new URLSearchParams(keys.filter(key => draft[key]).map(key => [key, draft[key]]))
  const availableColleges = options.institutions.filter(i => (!fields.region || i.region === fields.region) && (!fields.state || i.state === fields.state) && (!fields.institution_type || i.institution_type === fields.institution_type))
  const words = normal(college).split(/\s+/).filter(Boolean)
  const matches = availableColleges.filter(i => words.every(word => normal(i.name + ' ' + i.id + ' ' + i.state).includes(word)))
  const programs = options.programs.filter(p => availableColleges.some(i => i.id === p.institution_id) && (!collegeId || p.institution_id === collegeId))

  function change(key: Key, value: string) {
    setFields(previous => ({ ...previous, [key]: value, ...(key === 'region' ? { state: '', program: '' } : ['state', 'institution_type'].includes(key) ? { program: '' } : {}) }))
    if (['region', 'state', 'institution_type'].includes(key)) { setCollege(''); setCollegeId('') }
  }
  function selectCollege(id: string) {
    const selected = options.institutions.find(i => i.id === id)
    if (!selected) return
    setCollege(selected.name); setCollegeId(id); setFields(previous => ({ ...previous, program: '' })); setShowSuggestions(false)
  }
  function select(label: string, key: Key, choices: string[]) {
    return <label><Label text={label}/><LocalizedSelect name={key} value={fields[key]} onChange={e => change(key, e.target.value)}><option value=""><Label text={"All in your scope"}/></option>{fields[key] && !choices.includes(fields[key]) && <option value={fields[key]}><Label text={fields[key]}/></option>}{choices.map(value => <option key={value} value={value}><Label text={value}/></option>)}</LocalizedSelect></label>
  }
  return <section className="card upload-panel report-search-panel">
    <form action="/reports" method="get" onSubmit={event => { event.preventDefault(); router.push('/reports?' + params.toString()) }}>
      <div className="report-college-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setShowSuggestions(false) }}>
        <div className="report-search-heading"><div><h2><Building2 size={21}/><Label text={"Find a college"}/></h2><p><Label text={"Search by college name, city or institution ID, then choose a suggestion for one college."}/></p></div><LocalizedButton type="button" className="button secondary" aria-expanded={showSuggestions} aria-controls="college-suggestions" onClick={() => { setShowSuggestions(true); input.current?.focus() }}><Lightbulb size={16}/><Label text={"Suggestions"}/></LocalizedButton></div>
        <label htmlFor="report-college-query" className="sr-only"><Label text={"Search college name or ID"}/></label><div className="college-search-input"><Search size={19}/><LocalizedInput ref={input} id="report-college-query" name="institution" value={college} maxLength={120} autoComplete="off" placeholder="e.g. New Delhi, Pune or INST001" aria-controls="college-suggestions" onFocus={() => setShowSuggestions(true)} onChange={event => { setCollege(event.target.value); setCollegeId(''); setFields(previous => ({ ...previous, program: '' })); setShowSuggestions(true) }} onKeyDown={event => { if (event.key === 'Escape') setShowSuggestions(false) }}/>{college && <LocalizedButton type="button" aria-label="Clear college search" onClick={() => { setCollege(''); setCollegeId(''); setFields(previous => ({ ...previous, program: '' })); input.current?.focus() }}><X size={17}/></LocalizedButton>}</div>
        {showSuggestions && <div id="college-suggestions" className="college-suggestions"><div className="college-suggestion-count" role="status"><Label text={matches.length}/><Label text={"matching colleges in your scope"}/><Label text={matches.length > 12 ? ' · Showing 12; refine your search' : ''}/></div><ul>{matches.slice(0, 12).map(i => <li key={i.id}><LocalizedButton type="button" onClick={() => selectCollege(i.id)}><strong><Label text={i.name}/></strong><span><Label text={i.id}/> · <Label text={i.state}/> · <Label text={i.region}/></span></LocalizedButton></li>)}</ul>{!matches.length && <p><Label text={"No matching college. Try a shorter name or clear the region/state filters."}/></p>}</div>}
        {collegeId && <p className="college-selected"><Building2 size={14}/><Label text={"Selected college: "}/><strong><Label text={college}/></strong> · <Label text={collegeId}/></p>}
      </div>
      <div className="report-filters">
        <label><Label text={"Report"}/><LocalizedSelect name="type" value={fields.type} onChange={e => change('type', e.target.value)}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}><Label text={label}/></option>)}</LocalizedSelect></label>
        <label><Label text={"Academic year"}/><LocalizedSelect name="year" value={fields.year} onChange={e => change('year', e.target.value)}>{[2026, 2025, 2024, 2023].map(year => <option key={year} value={year}><Label text={year}/></option>)}</LocalizedSelect></label>
        <Label text={select('Region', 'region', unique(options.institutions.map(i => i.region)))}/>
        <Label text={select('State', 'state', unique(options.institutions.filter(i => !fields.region || i.region === fields.region).map(i => i.state)))}/>
        <label><Label text={"Program"}/><LocalizedSelect name="program" value={fields.program} onChange={e => change('program', e.target.value)}><option value=""><Label text={"All programs"}/></option>{fields.program && !programs.some(p => p.id === fields.program) && <option value={fields.program}><Label text={fields.program}/></option>}{programs.map(p => <option key={p.id} value={p.id}><Label text={p.name}/> · <Label text={p.id}/></option>)}</LocalizedSelect></label>
        <Label text={select('Level', 'level', unique(programs.map(p => p.level)))}/>
        <Label text={select('Institution type', 'institution_type', unique(options.institutions.map(i => i.institution_type)))}/>
        <Label text={select('Admission category', 'category', options.categories)}/>
      </div>
      <div className="actions report-search-actions"><LocalizedButton type="submit" className="button"><Search size={16}/><Label text={"Apply filters"}/></LocalizedButton><LocalizedLink className="text-button" href={'/reports?type=' + fields.type + '&year=' + fields.year}><Label text={"Clear filters"}/></LocalizedLink></div>
    </form>
    <div className="report-export-summary" role="status"><strong><Label text={dirty ? 'Apply filters to update the preview and enable downloads.' : 'Showing: ' + summary}/></strong><p><Label text={dirty ? 'Your search has changed. Downloads become available after applying it.' : 'Preview and downloads use the same college and filters. CSV and Excel include all matching rows. PDF includes up to 1,000 rows with its limit stated in the file.'}/></p></div>
    {['compliance', 'anomalies', 'enrolment', 'validation', 'anomaly', 'capacity'].includes(fields.type) && <p className="small muted"><Label text={"This report shows institution-level metrics. Program and category filters select the matching colleges."}/></p>}
    <div className="actions report-downloads">{['csv', 'xlsx', 'pdf'].map(format => { const download = new URLSearchParams(params); download.set('format', format); return dirty ? <LocalizedButton key={format} className="button secondary" disabled><Label text={"Download "}/><Label text={format.toUpperCase()}/></LocalizedButton> : <LocalizedAnchor key={format} className="button secondary" href={'/api/platform/report?' + download}><Label text={"Download "}/><Label text={format.toUpperCase()}/></LocalizedAnchor> })}</div>
  </section>
}
