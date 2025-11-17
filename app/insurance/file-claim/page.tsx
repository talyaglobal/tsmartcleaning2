"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createAnonSupabase } from '@/lib/supabase'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

export default function FileClaimPage() {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [incidentType, setIncidentType] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentTime, setIncidentTime] = useState('')
  const [description, setDescription] = useState('')
  const [amountClaimed, setAmountClaimed] = useState<number | ''>('')
  const [files, setFiles] = useState<File[]>([])
  const [contactPref, setContactPref] = useState<'email' | 'phone' | 'text' | ''>('')
  const [bestTime, setBestTime] = useState<'morning' | 'afternoon' | 'evening' | ''>('')
  const [policyId, setPolicyId] = useState<string>('')

  // Load current user and pick first active policy (MVP)
  useEffect(() => {
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUserId(data.user.id)
      fetch(`/api/insurance/policies?user_id=${encodeURIComponent(data?.user?.id || '')}`)
        .then(res => res.json())
        .then(d => {
          const active = (d.policies || []).find((p: any) => p.status === 'active' || p.status === 'pending_activation')
          if (active) setPolicyId(active.id)
        })
        .catch(() => {})
    })
  }, [])

  async function submitClaim() {
    setSubmitting(true)
    try {
      // Create claim
      const res = await fetch('/api/insurance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          policy_id: policyId,
          incident_type: incidentType,
          incident_date: incidentDate,
          incident_time: incidentTime || undefined,
          description,
          amount_claimed: amountClaimed || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to file claim')
      const claim = data.claim
      // Upload documents if any
      if (files.length > 0 && claim?.id) {
        const form = new FormData()
        files.forEach(f => form.append('files', f))
        await fetch(`/api/insurance/claims/${encodeURIComponent(claim.id)}/documents`, {
          method: 'POST',
          body: form,
        })
      }
      setSubmittedId(claim?.claim_code || 'Claim Submitted')
    } catch (e) {
      console.error(e)
      alert('Error submitting claim')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedId) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="p-6">
            <h1 className="text-2xl font-semibold">Claim filed</h1>
            <p className="text-sm text-muted-foreground mt-1">Your claim ID: {submittedId}</p>
            <div className="mt-4 flex gap-2">
              <Button asChild><Link href={`/insurance/claims/${submittedId}`}>View Status</Link></Button>
              <Button variant="outline" asChild><Link href="/customer/insurance">Back to Insurance</Link></Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">File a Claim</h1>
        <p className="text-muted-foreground mb-6">Provide details about what happened and upload evidence.</p>

        {/* Stepper */}
        <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
          {['Incident','When','Details','Value','Evidence','Contact','Review'].map((t, i) => (
            <div key={t} className="flex-1 flex items-center">
              <div className={`size-6 rounded-full flex items-center justify-center ${i+1 <= step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{i+1}</div>
              {i < 6 && <div className="h-0.5 flex-1 bg-muted-foreground/20 mx-2" />}
            </div>
          ))}
        </div>

        <Card className="p-6 space-y-4">
          {step === 1 && (
            <div>
              <label className="text-sm font-medium">Incident Type</label>
              <div className="grid sm:grid-cols-3 gap-2 mt-2 text-sm">
                {['Property Damage','Broken/Damaged Item','Theft or Missing Item','Lost Keys','Service No-Show','Other'].map((t) => (
                  <label key={t} className="inline-flex items-center gap-2 border rounded-md p-2">
                    <input type="radio" name="incidentType" className="accent-[var(--color-primary)]" checked={incidentType === t} onChange={() => setIncidentType(t)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Incident Date</label>
                <input value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} type="date" className="mt-1 w-full border rounded-md h-9 px-3 bg-background" required />
              </div>
              <div>
                <label className="text-sm font-medium">Approximate Time</label>
                <input value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} type="time" className="mt-1 w-full border rounded-md h-9 px-3 bg-background" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="text-sm font-medium">What happened?</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border rounded-md min-h-28 p-3 bg-background" placeholder="Describe the incident in detail" required />
            </div>
          )}

          {step === 4 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Estimated Value (USD)</label>
                <input value={amountClaimed} onChange={(e) => setAmountClaimed(e.target.value ? Number(e.target.value) : '')} type="number" className="mt-1 w-full border rounded-md h-9 px-3 bg-background" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Proof of Value</label>
                <select className="mt-1 w-full border rounded-md h-9 px-3 bg-background">
                  <option>—</option>
                  <option>Original receipt</option>
                  <option>Appraisal</option>
                  <option>Online comparable pricing</option>
                  <option>Estimate</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <label className="text-sm font-medium">Evidence Upload</label>
              <input onChange={(e) => setFiles(Array.from(e.target.files || []))} type="file" multiple className="mt-2 block" />
              <div className="text-xs text-muted-foreground mt-1">Accepted: JPG, PNG, PDF · Max 10 files</div>
            </div>
          )}

          {step === 6 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Preferred Contact</label>
                <select value={contactPref} onChange={(e) => setContactPref(e.target.value as any)} className="mt-1 w-full border rounded-md h-9 px-3 bg-background">
                  <option value="">—</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="text">Text message</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Best time to reach you</label>
                <select value={bestTime} onChange={(e) => setBestTime(e.target.value as any)} className="mt-1 w-full border rounded-md h-9 px-3 bg-background">
                  <option value="">—</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="text-sm">
              <div className="font-semibold mb-2">Review</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>Incident: {incidentType || '—'}</li>
                <li>Date/Time: {incidentDate || '—'} {incidentTime || ''}</li>
                <li>Description: {description ? `${description.slice(0, 80)}${description.length > 80 ? '…' : ''}` : '—'}</li>
                <li>Estimated value: {amountClaimed ? `$${amountClaimed}` : '—'}</li>
                <li>Files: {files.length}</li>
                <li>Contact: {contactPref || '—'} · {bestTime || '—'}</li>
              </ul>
            </div>
          )}
        </Card>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, (s - 1) as Step))} disabled={step === 1}>Back</Button>
          {step < 7 ? (
            <Button onClick={() => setStep((s) => Math.min(7, (s + 1) as Step))}>Continue</Button>
          ) : (
            <Button onClick={submitClaim} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Claim'}</Button>
          )}
        </div>

        <div className="mt-4">
          <Button variant="ghost" asChild><Link href="/customer/insurance">Cancel</Link></Button>
        </div>
      </div>
    </div>
  )
}

