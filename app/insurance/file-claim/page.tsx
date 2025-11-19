"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
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
  const [filePreviews, setFilePreviews] = useState<Array<{ file: File; preview: string; error?: string }>>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contactPref, setContactPref] = useState<'email' | 'phone' | 'text' | ''>('')
  const [bestTime, setBestTime] = useState<'morning' | 'afternoon' | 'evening' | ''>('')
  const [policyId, setPolicyId] = useState<string>('')

  // File validation constants
  const MAX_FILES = 10
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

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

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(({ preview }) => {
        if (preview.startsWith('blob:') || preview.startsWith('data:')) {
          // Data URLs don't need cleanup, but blob URLs do
          if (preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview)
          }
        }
      })
    }
  }, [filePreviews])

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(fileExtension)) {
      return `File type not supported. Accepted: JPG, PNG, PDF`
    }
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    }
    return null
  }

  // Generate preview for image files
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve('')
        reader.readAsDataURL(file)
      } else {
        resolve('')
      }
    })
  }

  // Handle file selection
  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const newFiles: File[] = []
    const errors: string[] = []
    const newPreviews: Array<{ file: File; preview: string; error?: string }> = []

    // Check total file count
    if (files.length + fileList.length > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} files allowed. You already have ${files.length} file(s).`)
      setUploadErrors(errors)
      return
    }

    // Process each file
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const error = validateFile(file)
      
      if (error) {
        errors.push(`${file.name}: ${error}`)
        newPreviews.push({ file, preview: '', error })
      } else {
        newFiles.push(file)
        const preview = await generatePreview(file)
        newPreviews.push({ file, preview })
      }
    }

    if (errors.length > 0) {
      setUploadErrors(errors)
    } else {
      setUploadErrors([])
    }

    setFiles(prev => [...prev, ...newFiles])
    setFilePreviews(prev => [...prev, ...newPreviews])
  }, [files])

  // Remove file
  const removeFile = (index: number) => {
    const preview = filePreviews[index]
    // Data URLs are automatically garbage collected, but blob URLs need manual cleanup
    if (preview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview.preview)
    }
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
    setUploadErrors([])
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  async function submitClaim() {
    setSubmitting(true)
    setUploadProgress(0)
    setUploadErrors([])
    
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
        setUploadProgress(10)
        const form = new FormData()
        files.forEach(f => form.append('files', f))
        
        const uploadRes = await fetch(`/api/insurance/claims/${encodeURIComponent(claim.id)}/documents`, {
          method: 'POST',
          body: form,
        })
        
        setUploadProgress(90)
        
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json()
          throw new Error(uploadData?.error || 'Failed to upload documents')
        }
        
        setUploadProgress(100)
      }
      
      setSubmittedId(claim?.claim_code || 'Claim Submitted')
    } catch (e: any) {
      console.error(e)
      setUploadErrors([e.message || 'Error submitting claim'])
      alert(e.message || 'Error submitting claim')
    } finally {
      setSubmitting(false)
      setTimeout(() => setUploadProgress(0), 2000)
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
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Evidence Upload</label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Accepted: JPG, PNG, PDF · Max {MAX_FILES} files · {MAX_FILE_SIZE / (1024 * 1024)}MB per file
                </p>
                
                {/* Drag and drop area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                    ${files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
                  `}
                  onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    disabled={files.length >= MAX_FILES}
                  />
                  <div className="space-y-2">
                    <div className="text-4xl">📎</div>
                    <div className="text-sm font-medium">
                      {isDragging ? 'Drop files here' : 'Drag and drop files here, or click to select'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {files.length} of {MAX_FILES} files selected
                    </div>
                  </div>
                </div>

                {/* Error messages */}
                {uploadErrors.length > 0 && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm font-medium text-destructive mb-1">Upload Errors:</div>
                    <ul className="text-xs text-destructive/80 space-y-1">
                      {uploadErrors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* File previews */}
                {filePreviews.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-medium">Selected Files ({filePreviews.length})</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filePreviews.map((item, index) => (
                        <div
                          key={index}
                          className={`
                            relative border rounded-lg overflow-hidden
                            ${item.error ? 'border-destructive' : 'border-border'}
                          `}
                        >
                          {/* Preview */}
                          {item.preview ? (
                            <div className="aspect-square bg-muted flex items-center justify-center">
                              <img
                                src={item.preview}
                                alt={item.file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : item.file.type === 'application/pdf' ? (
                            <div className="aspect-square bg-muted flex items-center justify-center">
                              <div className="text-center p-4">
                                <div className="text-3xl mb-2">📄</div>
                                <div className="text-xs text-muted-foreground">PDF</div>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square bg-muted flex items-center justify-center">
                              <div className="text-2xl">📎</div>
                            </div>
                          )}
                          
                          {/* File info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                            <div className="text-xs truncate" title={item.file.name}>
                              {item.file.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(item.file.size / 1024).toFixed(1)} KB
                            </div>
                            {item.error && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                Error
                              </Badge>
                            )}
                          </div>
                          
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                            className="absolute top-2 right-2 size-6 rounded-full bg-destructive text-white flex items-center justify-center text-xs hover:bg-destructive/90"
                            aria-label="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload progress */}
                {submitting && uploadProgress > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Uploading documents...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>
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
                <li>Files: {files.length} {files.length > 0 && `(${filePreviews.filter(f => !f.error).length} valid)`}</li>
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

