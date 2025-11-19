"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createAnonSupabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Download, Shield, AlertCircle, Upload, X, Eye, Trash2, Image as ImageIcon, File } from 'lucide-react'

interface InsurancePolicy {
  policy_number?: string
  effective_date?: string
  status?: string
  insurance_plans?: {
    name?: string
    code?: string
  }
}

interface ClaimDocument {
  id: string
  file_name: string
  storage_path: string
  content_type: string | null
  size_bytes: number | null
  created_at: string
}

interface TimelineItem {
  status: string
  label: string
  done: boolean
  timestamp?: string
}

interface InsuranceClaim {
  id: string
  claim_code?: string
  user_id: string
  status: string
  incident_type?: string
  incident_date?: string
  incident_time?: string
  amount_claimed?: number | string
  amount_paid?: number | string | null
  description?: string
  created_at: string
  updated_at: string
  timeline?: TimelineItem[]
  insurance_claim_documents?: ClaimDocument[]
  insurance_policies?: InsurancePolicy | null
}

export default function ClaimStatusPage({ params }: { params: { claimId: string } }) {
  const claimId = params.claimId
  const [userId, setUserId] = useState<string | null>(null)
  const [claim, setClaim] = useState<InsuranceClaim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<ClaimDocument | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchClaim = useCallback(async () => {
    try {
      const res = await fetch(`/api/insurance/claims/${encodeURIComponent(claimId)}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch claim')
      }
      
      setClaim(data.claim)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('Error fetching claim:', error)
      setError(error.message || 'Failed to load claim')
    }
  }, [claimId])

  useEffect(() => {
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id || null
      setUserId(uid)
      
      if (!uid) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/insurance/claims/${encodeURIComponent(claimId)}`)
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to fetch claim')
        }
        
        setClaim(data.claim)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('Error fetching claim:', error)
        setError(error.message || 'Failed to load claim')
      } finally {
        setLoading(false)
      }
    })
  }, [claimId])

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return

    // Validate files before upload
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']

    const validationErrors: string[] = []
    const validFiles: File[] = []

    Array.from(files).forEach((file) => {
      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
        validationErrors.push(`Invalid file type: ${file.name}. Allowed types: JPG, PNG, GIF, WEBP, PDF`)
        return
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`File too large: ${file.name}. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
        return
      }

      // Check if file is empty
      if (file.size === 0) {
        validationErrors.push(`File is empty: ${file.name}`)
        return
      }

      validFiles.push(file)
    })

    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'))
      return
    }

    if (validFiles.length === 0) {
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      validFiles.forEach((file) => {
        formData.append('files', file)
      })

      const res = await fetch(`/api/insurance/claims/${encodeURIComponent(claimId)}/documents`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMessage = data?.details 
          ? `${data.error}\n${Array.isArray(data.details) ? data.details.join('\n') : data.details}`
          : data?.error || 'Failed to upload documents'
        throw new Error(errorMessage)
      }

      // Show success message if some files were uploaded
      if (data.uploaded && data.uploaded.length > 0) {
        const successMsg = `${data.uploaded.length} document(s) uploaded successfully.`
        interface UploadError {
          file_name: string
          error: string
        }
        const errorMsg = data.errors && Array.isArray(data.errors) && data.errors.length > 0
          ? `\n\nSome files failed:\n${data.errors.map((e: UploadError) => `- ${e.file_name}: ${e.error}`).join('\n')}`
          : ''
        if (errorMsg) {
          alert(successMsg + errorMsg)
        }
      }

      // Refresh claim data to show new documents
      await fetchClaim()
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('Error uploading files:', error)
      alert(error.message || 'Failed to upload documents')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return

    setDeletingDocId(docId)
    try {
      const res = await fetch(
        `/api/insurance/claims/${encodeURIComponent(claimId)}/documents?documentId=${encodeURIComponent(docId)}`,
        { method: 'DELETE' }
      )

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete document')
      }

      // Refresh claim data
      await fetchClaim()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('Error deleting document:', error)
      alert(error.message || 'Failed to delete document')
    } finally {
      setDeletingDocId(null)
    }
  }

  function getDocumentIcon(contentType: string | null | undefined) {
    if (!contentType) return <File className="h-5 w-5 text-muted-foreground" />
    if (contentType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-muted-foreground" />
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />
  }

  function canPreview(contentType: string | null | undefined) {
    if (!contentType) return false
    return contentType.startsWith('image/') || contentType === 'application/pdf'
  }

  function getDocumentUrl(doc: ClaimDocument) {
    return `/api/insurance/claims/${encodeURIComponent(claimId)}/documents?documentId=${encodeURIComponent(doc.id)}`
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      filed: { label: 'Filed', variant: 'default' },
      under_review: { label: 'Under Review', variant: 'secondary' },
      adjuster_assigned: { label: 'Adjuster Assigned', variant: 'secondary' },
      approved: { label: 'Approved', variant: 'default' },
      denied: { label: 'Denied', variant: 'destructive' },
      paid: { label: 'Paid', variant: 'default' },
    }
    const statusInfo = statusMap[status?.toLowerCase()] || { label: status || 'Unknown', variant: 'outline' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatDateTime(dateString: string | null | undefined) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function formatCurrency(amount: number | string | null | undefined) {
    if (amount === null || amount === undefined) return '—'
    return `$${Number(amount).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/insurance/claims">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Claims
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">Claim Details</h1>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Loading claim details...</div>
          </Card>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/insurance/claims">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Claims
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">Claim Details</h1>
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Please sign in to view claim details.</p>
              <div className="flex gap-2 justify-center">
                <Button asChild><Link href="/login">Sign In</Link></Button>
                <Button variant="outline" asChild><Link href="/signup">Create Account</Link></Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/insurance/claims">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Claims
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">Claim Details</h1>
          <Card className="p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Unable to load claim</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {error || 'Claim not found or you do not have permission to view it.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/insurance/claims">Back to Claims</Link>
                </Button>
                <Button asChild>
                  <Link href="/insurance/file-claim">File New Claim</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const timeline = claim.timeline || []
  const documents = claim.insurance_claim_documents || []
  const policy = claim.insurance_policies

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/insurance/claims">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Claims
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Claim #{claim.claim_code || claim.id}</h1>
            <p className="text-muted-foreground">Filed {formatDate(claim.created_at)}</p>
          </div>
          {getStatusBadge(claim.status)}
        </div>

        {/* Status Timeline */}
        <Card className="p-6 mb-6">
          <div className="font-semibold mb-4">Status Timeline</div>
          <div className="mt-4 flex items-center justify-between">
            {timeline.map((t, idx: number) => (
              <div key={t.status} className="flex-1 flex items-center">
                <div className={`size-3 rounded-full ${t.done ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                {idx < timeline.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${t.done ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {timeline.map((t) => (
              <div key={t.status} className="text-center flex-1">
                <div>{t.label}</div>
                {t.timestamp && (
                  <div className="text-[10px] mt-1 opacity-75">
                    {new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Claim Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Claim Information
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Incident Type</div>
                <div className="font-medium">{claim.incident_type || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Incident Date</div>
                <div className="font-medium">{formatDate(claim.incident_date)}</div>
              </div>
              {claim.incident_time && (
                <div>
                  <div className="text-muted-foreground mb-1">Incident Time</div>
                  <div className="font-medium">{claim.incident_time}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground mb-1">Amount Claimed</div>
                <div className="font-medium text-lg">{formatCurrency(claim.amount_claimed)}</div>
              </div>
              {claim.amount_paid !== null && claim.amount_paid !== undefined && (
                <div>
                  <div className="text-muted-foreground mb-1">Amount Paid</div>
                  <div className="font-medium text-lg text-primary">{formatCurrency(claim.amount_paid)}</div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Policy Information
            </h3>
            <div className="space-y-4 text-sm">
              {policy && (
                <>
                  <div>
                    <div className="text-muted-foreground mb-1">Policy Number</div>
                    <div className="font-medium">{policy.policy_number || '—'}</div>
                  </div>
                  {policy.insurance_plans && (
                    <div>
                      <div className="text-muted-foreground mb-1">Plan</div>
                      <div className="font-medium">{policy.insurance_plans.name || policy.insurance_plans.code || '—'}</div>
                    </div>
                  )}
                  {policy.effective_date && (
                    <div>
                      <div className="text-muted-foreground mb-1">Effective Date</div>
                      <div className="font-medium">{formatDate(policy.effective_date)}</div>
                    </div>
                  )}
                  {policy.status && (
                    <div>
                      <div className="text-muted-foreground mb-1">Policy Status</div>
                      <Badge variant={policy.status === 'active' ? 'default' : 'outline'}>
                        {policy.status}
                      </Badge>
                    </div>
                  )}
                </>
              )}
              {!policy && (
                <div className="text-muted-foreground">No policy information available</div>
              )}
            </div>
          </Card>
        </div>

        {/* Description */}
        {claim.description && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{claim.description}</p>
          </Card>
        )}

        {/* Documents Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Supporting Documents
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet.</p>
              <p className="text-xs mt-1">Upload photos, receipts, or other supporting documents.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {getDocumentIcon(doc.content_type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={doc.file_name}>
                        {doc.file_name}
                      </div>
                      {doc.size_bytes && (
                        <div className="text-xs text-muted-foreground">
                          {(doc.size_bytes / 1024).toFixed(1)} KB
                        </div>
                      )}
                      {doc.created_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canPreview(doc.content_type) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a
                        href={getDocumentUrl(doc)}
                        download={doc.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deletingDocId === doc.id}
                    >
                      {deletingDocId === doc.id ? (
                        <div className="h-3 w-3 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="bg-background rounded-lg max-w-4xl max-h-[90vh] w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold truncate flex-1 mr-4">{previewDoc.file_name}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={getDocumentUrl(previewDoc)}
                      download={previewDoc.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewDoc(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {previewDoc.content_type?.startsWith('image/') ? (
                  <img
                    src={getDocumentUrl(previewDoc)}
                    alt={previewDoc.file_name}
                    className="max-w-full h-auto mx-auto"
                  />
                ) : previewDoc.content_type === 'application/pdf' ? (
                  <iframe
                    src={getDocumentUrl(previewDoc)}
                    className="w-full h-[calc(90vh-120px)] border-0"
                    title={previewDoc.file_name}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Preview not available for this file type.
                    <div className="mt-4">
                      <Button asChild>
                        <a
                          href={getDocumentUrl(previewDoc)}
                          download={previewDoc.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download to View
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4">Additional Details</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Claim ID</div>
              <div className="font-mono text-xs">{claim.id}</div>
            </div>
            {claim.claim_code && (
              <div>
                <div className="text-muted-foreground mb-1">Claim Code</div>
                <div className="font-mono text-xs">{claim.claim_code}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground mb-1">Created</div>
              <div className="font-medium">{formatDateTime(claim.created_at)}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Last Updated</div>
              <div className="font-medium">{formatDateTime(claim.updated_at)}</div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/insurance/file-claim">File New Claim</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/insurance/claims">View All Claims</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/insurance">Learn About Coverage</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
