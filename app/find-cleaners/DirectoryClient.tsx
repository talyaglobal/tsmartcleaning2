/* eslint-disable @next/next/no-img-element */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type DirectoryCompany = {
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
  distanceMiles: number | null
}

export default function DirectoryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<DirectoryCompany[]>([])
  const [total, setTotal] = useState(0)

  // Basic filters
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [radius, setRadius] = useState<number>(Number(searchParams.get("radiusMi") || 25))
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get("minRating") || 0))
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(searchParams.get("verifiedOnly") === "true")
  const [sort, setSort] = useState<"distance" | "rating" | "featured">(
    (searchParams.get("sort") as any) || "distance"
  )
  const [locationText, setLocationText] = useState<string>("")

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (lat != null && lng != null) {
      params.set("lat", String(lat))
      params.set("lng", String(lng))
    }
    params.set("radiusMi", String(radius))
    params.set("minRating", String(minRating))
    params.set("verifiedOnly", String(verifiedOnly))
    params.set("sort", sort)
    params.set("limit", "24")
    return params.toString()
  }, [lat, lng, radius, minRating, verifiedOnly, sort])

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/companies/search?${queryString}`, { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Failed to load companies")
      }
      const j = await res.json()
      setCompanies(j.results)
      setTotal(j.total)
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Use browser geolocation
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLoading(false)
      },
      (err) => {
        setError(err.message || "Failed to acquire location")
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  // Simple location text -> placeholder action (in a full impl, use Places API)
  const applyLocationText = () => {
    if (!locationText.trim()) return
    const params = new URLSearchParams(queryString)
    params.set("q", locationText.trim())
    router.replace(`/find-cleaners?${params.toString()}`)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  placeholder="Find cleaning companies near you..."
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                />
                <Button variant="secondary" onClick={applyLocationText}>Search</Button>
                <Button onClick={useMyLocation}>Use My Location</Button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Distance</label>
                <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Within 5 miles</SelectItem>
                    <SelectItem value="10">Within 10 miles</SelectItem>
                    <SelectItem value="25">Within 25 miles</SelectItem>
                    <SelectItem value="50">Within 50 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Rating</label>
                <Select value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Min rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All ratings</SelectItem>
                    <SelectItem value="3">3.0+ stars</SelectItem>
                    <SelectItem value="4">4.0+ stars</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Sort</label>
                <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">📍 Closest to You</SelectItem>
                    <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                    <SelectItem value="featured">💎 Featured First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button
                className={`text-sm px-3 py-1 rounded-full border ${verifiedOnly ? 'bg-primary text-white border-primary' : 'bg-background'}`}
                onClick={() => setVerifiedOnly((v) => !v)}
              >
                Verified only
              </button>
              <div className="ml-auto text-sm text-muted-foreground">
                {loading ? 'Searching…' : `${total} companies found`}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}
        {!loading && companies.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-medium">No cleaning companies found</div>
            <div className="text-sm text-muted-foreground mt-1">Try expanding your radius or lowering minimum rating.</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="secondary" onClick={() => setRadius(50)}>Expand to 50 miles</Button>
              <Button variant="ghost" onClick={() => { setMinRating(0); setVerifiedOnly(false) }}>Clear filters</Button>
            </div>
          </Card>
        )}

        <section className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="aspect-[16/9] bg-muted relative">
                {c.coverImageUrl ? (
                  <img src={c.coverImageUrl} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
                {c.logoUrl && (
                  <img
                    src={c.logoUrl}
                    alt={`${c.name} logo`}
                    className="absolute left-3 bottom-3 w-12 h-12 rounded bg-white p-1 object-contain shadow"
                  />
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[c.city, c.state].filter(Boolean).join(", ")}
                      {c.distanceMiles != null ? ` • ${c.distanceMiles.toFixed(1)} mi` : ""}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    ⭐ {c.averageRating?.toFixed(1) ?? '—'} ({c.totalReviews ?? 0})
                  </div>
                </div>
                <div className="text-sm line-clamp-2">{c.description || 'Trusted cleaning service'}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.verified && <Badge variant="secondary">✓ Verified</Badge>}
                  {c.featured && <Badge>Featured</Badge>}
                  {c.priceRange && <Badge variant="outline">{c.priceRange}</Badge>}
                </div>
                <div className="pt-2 flex items-center gap-2">
                  {c.slug ? (
                    <Button variant="secondary" asChild>
                      <Link href={`/cleaners/${c.slug}`}>View Profile</Link>
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>View Profile</Button>
                  )}
                  <Button asChild>
                    <Link href={`/customer/book?companyId=${encodeURIComponent(c.id)}`}>Request Booking</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}


