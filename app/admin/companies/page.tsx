'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Star, MapPin, ShieldCheck } from 'lucide-react'

type CompanySearchItem = {
  id: string
  name: string
  slug?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  averageRating?: number | null
  totalReviews?: number
  verified: boolean
  priceRange?: string | null
  description?: string | null
  logoUrl?: string | null
  coverImageUrl?: string | null
  featured: boolean
  distanceMiles?: number | null
}

export default function AdminCompaniesPage() {
  const [q, setQ] = useState('')
  const [minRating, setMinRating] = useState<number>(0)
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false)
  const [sort, setSort] = useState<'distance' | 'rating' | 'featured'>('rating')
  const [results, setResults] = useState<CompanySearchItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const params = useMemo(() => {
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (minRating > 0) sp.set('minRating', String(minRating))
    if (verifiedOnly) sp.set('verifiedOnly', 'true')
    sp.set('sort', sort)
    sp.set('limit', String(limit))
    sp.set('offset', String(offset))
    return sp.toString()
  }, [q, minRating, verifiedOnly, sort, offset])

  useEffect(() => {
    let canceled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/companies/search?${params}`, { cache: 'no-store' })
        const json = await res.json()
        if (!canceled) {
          setResults(json.results || [])
          setTotal(json.total || 0)
        }
      } catch {
        if (!canceled) {
          setResults([])
          setTotal(0)
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    run()
    return () => {
      canceled = true
    }
  }, [params])

  const canPrev = offset > 0
  const canNext = offset + limit < total

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="admin" userName="Admin User" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1">Companies</h1>
            <p className="text-muted-foreground">Search and manage registered companies</p>
          </div>
        </div>

        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, city, domain..."
                className="pl-9"
                value={q}
                onChange={(e) => {
                  setOffset(0)
                  setQ(e.target.value)
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Min rating</label>
              <Input
                type="number"
                step="0.5"
                min={0}
                max={5}
                value={minRating}
                onChange={(e) => {
                  setOffset(0)
                  setMinRating(Number(e.target.value))
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => {
                    setOffset(0)
                    setVerifiedOnly(e.target.checked)
                  }}
                />
                Verified only
              </label>
              <Select
                value={sort}
                onValueChange={(v: any) => setSort(v)}
              >
                <option value="rating">Top rated</option>
                <option value="featured">Featured</option>
                <option value="distance">Nearest</option>
              </Select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mt-4" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.logoUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No logo</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{c.name}</h3>
                        {c.verified && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </Badge>
                        )}
                        {c.featured && <Badge>Featured</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        {(c.city || c.state || c.country) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[c.city, c.state, c.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {typeof c.distanceMiles === 'number' && (
                          <span>{c.distanceMiles.toFixed(1)} mi</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          {(c.averageRating ?? 0).toFixed(1)}{' '}
                          <span className="text-muted-foreground">({c.totalReviews ?? 0})</span>
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="secondary" size="sm" asChild>
                      <a href={`/companies/${c.slug || c.id}`} target="_blank" rel="noreferrer">
                        View profile
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {results.length} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!canPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!canNext}
                  onClick={() => setOffset((o) => o + limit)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


