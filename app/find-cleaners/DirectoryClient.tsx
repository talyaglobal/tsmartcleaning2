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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { MapPin, Filter, Save, X, List, Map as MapIcon, Star, TrendingUp, Clock, DollarSign } from "lucide-react"

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

type SavedSearch = {
  id: string
  name: string
  filters: {
    locationText?: string
    lat?: number | null
    lng?: number | null
    radius?: number
    minRating?: number
    verifiedOnly?: boolean
    priceRange?: string[]
    sort?: string
  }
  createdAt: number
}

const STORAGE_KEY = "find-cleaners-saved-searches"
const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"]
const SORT_OPTIONS = [
  { value: "distance", label: "📍 Closest to You", icon: MapPin },
  { value: "rating", label: "⭐ Highest Rated", icon: Star },
  { value: "featured", label: "💎 Featured First", icon: TrendingUp },
  { value: "reviews", label: "💬 Most Reviews", icon: Star },
  { value: "newest", label: "🆕 Newest First", icon: Clock },
]

export default function DirectoryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<DirectoryCompany[]>([])
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)

  // Basic filters
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [radius, setRadius] = useState<number>(Number(searchParams.get("radiusMi") || 10))
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get("minRating") || 0))
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(searchParams.get("verifiedOnly") === "true")
  const [sort, setSort] = useState<string>((searchParams.get("sort") as any) || "distance")
  const [locationText, setLocationText] = useState<string>(searchParams.get("q") || "")

  // Advanced filters
  const [priceRanges, setPriceRanges] = useState<string[]>([])
  const [minReviews, setMinReviews] = useState<number>(0)

  // Saved searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [saveSearchName, setSaveSearchName] = useState("")

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setSavedSearches(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load saved searches", e)
    }
  }, [])

  // Load filters from URL params
  useEffect(() => {
    const urlLat = searchParams.get("lat")
    const urlLng = searchParams.get("lng")
    if (urlLat && urlLng) {
      setLat(parseFloat(urlLat))
      setLng(parseFloat(urlLng))
    }
    const urlPriceRanges = searchParams.get("priceRanges")
    if (urlPriceRanges) {
      setPriceRanges(urlPriceRanges.split(",").filter(Boolean))
    }
  }, [searchParams])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (lat != null && lng != null) {
      params.set("lat", String(lat))
      params.set("lng", String(lng))
    }
    if (locationText.trim()) {
      params.set("q", locationText.trim())
    }
    params.set("radiusMi", String(radius))
    params.set("minRating", String(minRating))
    params.set("verifiedOnly", String(verifiedOnly))
    params.set("sort", sort)
    params.set("limit", "24")
    return params.toString()
  }, [lat, lng, locationText, radius, minRating, verifiedOnly, sort])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (lat != null && lng != null) {
      params.set("lat", String(lat))
      params.set("lng", String(lng))
    }
    if (locationText.trim()) {
      params.set("q", locationText.trim())
    }
    params.set("radiusMi", String(radius))
    params.set("minRating", String(minRating))
    params.set("verifiedOnly", String(verifiedOnly))
    params.set("sort", sort)
    if (priceRanges.length > 0) {
      params.set("priceRanges", priceRanges.join(","))
    }
    router.replace(`/find-cleaners?${params.toString()}`, { scroll: false })
  }, [lat, lng, locationText, radius, minRating, verifiedOnly, sort, priceRanges, router])

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
      let results = j.results || []

      // Client-side filtering for price ranges
      if (priceRanges.length > 0) {
        results = results.filter((c: DirectoryCompany) => 
          c.priceRange && priceRanges.includes(c.priceRange)
        )
      }

      // Client-side filtering for minimum reviews
      if (minReviews > 0) {
        results = results.filter((c: DirectoryCompany) => 
          (c.totalReviews || 0) >= minReviews
        )
      }

      // Client-side sorting for additional options
      if (sort === "reviews") {
        results.sort((a: DirectoryCompany, b: DirectoryCompany) => 
          (b.totalReviews || 0) - (a.totalReviews || 0)
        )
      } else if (sort === "newest") {
        // Note: This would require a createdAt field in the API response
        // For now, we'll sort by featured first as a proxy
        results.sort((a: DirectoryCompany, b: DirectoryCompany) => 
          Number(b.featured) - Number(a.featured)
        )
      }

      setCompanies(results)
      setTotal(results.length)
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [queryString, priceRanges, minReviews, sort])

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
        setLocationText("")
        setLoading(false)
      },
      (err) => {
        setError(err.message || "Failed to acquire location")
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  // Enhanced location search with geocoding
  const applyLocationText = async () => {
    if (!locationText.trim()) {
      setLat(null)
      setLng(null)
      return
    }

    // Try to geocode the location using a free geocoding service
    // In production, you'd use Google Maps Geocoding API or similar
    try {
      setLoading(true)
      // Using Nominatim (OpenStreetMap) as a free alternative
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=1`,
        {
          headers: {
            'User-Agent': 'tSmartCleaning/1.0'
          }
        }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat))
        setLng(parseFloat(data[0].lon))
        setError(null)
      } else {
        setError("Location not found. Please try a different search term.")
      }
    } catch (e: any) {
      // Fallback: just use text search without geocoding
      setLat(null)
      setLng(null)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  // Save current search
  const saveCurrentSearch = () => {
    if (!saveSearchName.trim()) return

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName.trim(),
      filters: {
        locationText: locationText || undefined,
        lat,
        lng,
        radius,
        minRating,
        verifiedOnly,
        priceRange: priceRanges.length > 0 ? priceRanges : undefined,
        sort,
      },
      createdAt: Date.now(),
    }

    const updated = [newSearch, ...savedSearches].slice(0, 10) // Keep max 10
    setSavedSearches(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error("Failed to save search", e)
    }
    setSaveSearchName("")
    setShowSavedSearches(false)
  }

  // Load saved search
  const loadSavedSearch = (search: SavedSearch) => {
    const filters = search.filters
    if (filters.locationText) setLocationText(filters.locationText)
    if (filters.lat !== undefined) setLat(filters.lat)
    if (filters.lng !== undefined) setLng(filters.lng)
    if (filters.radius !== undefined) setRadius(filters.radius)
    if (filters.minRating !== undefined) setMinRating(filters.minRating)
    if (filters.verifiedOnly !== undefined) setVerifiedOnly(filters.verifiedOnly)
    if (filters.priceRange) setPriceRanges(filters.priceRange)
    if (filters.sort) setSort(filters.sort)
    setShowSavedSearches(false)
  }

  // Delete saved search
  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error("Failed to delete search", e)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setLocationText("")
    setLat(null)
    setLng(null)
    setRadius(10)
    setMinRating(0)
    setVerifiedOnly(false)
    setPriceRanges([])
    setMinReviews(0)
    setSort("distance")
  }

  // Generate map URL with markers using OpenStreetMap
  const getMapUrl = () => {
    if (companies.length === 0) return null
    const companiesWithCoords = companies.filter(c => c.latitude != null && c.longitude != null)
    if (companiesWithCoords.length === 0) return null
    
    // Use center point (user location or first company)
    const centerLat = lat || companiesWithCoords[0].latitude!
    const centerLng = lng || companiesWithCoords[0].longitude!
    
    // Create markers for all companies
    const markers = companiesWithCoords
      .map(c => `marker=${c.latitude},${c.longitude}`)
      .join("&")
    
    // Use OpenStreetMap with Leaflet (free, no API key needed)
    // We'll use a simple static map or embed
    return `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.1},${centerLat - 0.1},${centerLng + 0.1},${centerLat + 0.1}&layer=mapnik&marker=${centerLat},${centerLng}`
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (minRating > 0) count++
    if (verifiedOnly) count++
    if (priceRanges.length > 0) count++
    if (minReviews > 0) count++
    return count
  }, [minRating, verifiedOnly, priceRanges.length, minReviews])

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Location Search */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  placeholder="Enter city, address, or ZIP code..."
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyLocationText()}
                />
                <Button variant="secondary" onClick={applyLocationText} disabled={loading}>
                  Search
                </Button>
                <Button onClick={useMyLocation} variant="outline" disabled={loading}>
                  <MapPin className="h-4 w-4 mr-1" />
                  My Location
                </Button>
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="paragraph_small text-muted-foreground whitespace-nowrap">Distance</label>
                  <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Within 1 mile</SelectItem>
                      <SelectItem value="3">Within 3 miles</SelectItem>
                      <SelectItem value="5">Within 5 miles</SelectItem>
                      <SelectItem value="10">Within 10 miles</SelectItem>
                      <SelectItem value="1000">More than 10 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="paragraph_small text-muted-foreground whitespace-nowrap">Rating</label>
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
                  <label className="paragraph_small text-muted-foreground whitespace-nowrap">Sort</label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {opt.label.replace(/^[^\s]+\s/, "")}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  className={`paragraph_small px-3 py-1.5 rounded-full border transition-colors ${
                    verifiedOnly
                      ? "bg-primary text-white border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                  onClick={() => setVerifiedOnly((v) => !v)}
                >
                  ✓ Verified only
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Filter className="h-4 w-4 mr-1" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <div className="p-2 space-y-4">
                      <div>
                        <label className="paragraph_small font-medium mb-2 block">Price Range</label>
                        <div className="space-y-2">
                          {PRICE_RANGES.map((range) => (
                            <div key={range} className="flex items-center space-x-2">
                              <Checkbox
                                id={`price-${range}`}
                                checked={priceRanges.includes(range)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setPriceRanges([...priceRanges, range])
                                  } else {
                                    setPriceRanges(priceRanges.filter((r) => r !== range))
                                  }
                                }}
                              />
                              <label
                                htmlFor={`price-${range}`}
                                className="paragraph_small cursor-pointer flex-1"
                              >
                                {range.repeat(parseInt(range.replace("$", "")))}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="paragraph_small font-medium mb-2 block">
                          Minimum Reviews: {minReviews}
                        </label>
                        <Slider
                          value={[minReviews]}
                          onValueChange={([value]) => setMinReviews(value)}
                          max={100}
                          step={10}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={clearFilters}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={showSavedSearches} onOpenChange={setShowSavedSearches}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-1" />
                      Saved
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Saved Searches</DialogTitle>
                      <DialogDescription>
                        Save your favorite search filters for quick access
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {savedSearches.length === 0 ? (
                        <p className="paragraph_small text-muted-foreground text-center py-4">
                          No saved searches yet
                        </p>
                      ) : (
                        savedSearches.map((search) => (
                          <div
                            key={search.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                          >
                            <button
                              onClick={() => loadSavedSearch(search)}
                              className="flex-1 text-left"
                            >
                              <div className="font-medium">{search.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {search.filters.locationText || "Current location"}
                                {search.filters.radius && ` • ${search.filters.radius}mi`}
                              </div>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSavedSearch(search.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Name this search..."
                        value={saveSearchName}
                        onChange={(e) => setSaveSearchName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveCurrentSearch()}
                      />
                      <Button onClick={saveCurrentSearch} className="w-full" disabled={!saveSearchName.trim()}>
                        Save Current Search
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "map")}>
                  <TabsList>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4 mr-1" />
                      List
                    </TabsTrigger>
                    <TabsTrigger value="map">
                      <MapIcon className="h-4 w-4 mr-1" />
                      Map
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="paragraph_small text-muted-foreground whitespace-nowrap">
                  {loading ? "Searching…" : `${total} companies found`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg paragraph_small">
            {error}
          </div>
        )}

        {!loading && companies.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-medium">No cleaning companies found</div>
            <div className="paragraph_small text-muted-foreground mt-1">
              Try expanding your radius or adjusting your filters.
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="secondary" onClick={() => setRadius(1000)}>
                Show all (&gt;10 miles)
              </Button>
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </Card>
        )}

        {viewMode === "list" ? (
          <section className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Card key={c.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[16/9] bg-muted relative">
                  {c.coverImageUrl ? (
                    <img
                      src={c.coverImageUrl}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
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
                      ⭐ {c.averageRating?.toFixed(1) ?? "—"} ({c.totalReviews ?? 0})
                    </div>
                  </div>
                  <div className="paragraph_small line-clamp-2">
                    {c.description || "Trusted cleaning service"}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.verified && (
                      <Badge variant="secondary">✓ Verified</Badge>
                    )}
                    {c.featured && <Badge>Featured</Badge>}
                    {c.priceRange && (
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {c.priceRange}
                      </Badge>
                    )}
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    {c.slug ? (
                      <Button variant="secondary" asChild className="flex-1">
                        <Link href={`/cleaners/${c.slug}`}>View Profile</Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" disabled className="flex-1">
                        View Profile
                      </Button>
                    )}
                    <Button asChild className="flex-1">
                      <Link href={`/customer/book?companyId=${encodeURIComponent(c.id)}`}>
                        Request Booking
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <div className="w-full h-[600px] rounded-lg overflow-hidden border">
            {getMapUrl() ? (
              <div className="relative w-full h-full">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={getMapUrl()}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                  <div className="paragraph_small font-medium mb-1">Companies on Map</div>
                  <div className="text-xs text-muted-foreground space-y-1 max-h-[200px] overflow-y-auto">
                    {companies
                      .filter(c => c.latitude != null && c.longitude != null)
                      .slice(0, 10)
                      .map(c => (
                        <div key={c.id} className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <Link
                            href={c.slug ? `/cleaners/${c.slug}` : `#`}
                            className="hover:underline truncate"
                          >
                            {c.name}
                          </Link>
                          {c.distanceMiles != null && (
                            <span className="text-muted-foreground">
                              {c.distanceMiles.toFixed(1)}mi
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <MapIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No companies to display on map</p>
                  <p className="text-xs text-muted-foreground">
                    Try searching with a location or using "My Location"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
