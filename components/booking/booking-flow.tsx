'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, CheckCircle2, Home, Building2, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createAnonSupabase } from '@/lib/supabase'
import { calculateSalesTax } from '@/lib/usa-compliance'

export function BookingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)
  const [pointsBalance, setPointsBalance] = useState(0)
  const [redemptionPoints, setRedemptionPoints] = useState(0)
  const [appliedCredit, setAppliedCredit] = useState(0)
  const [serviceType, setServiceType] = useState<'residential' | 'commercial' | ''>('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('') // stores 24h HH:MM from availability API
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [addOns, setAddOns] = useState<Array<{ id: string, name: string, base_price: number, category?: string }>>([])
  const [stateCode, setStateCode] = useState('')
  const [city, setCity] = useState('')
  const [selectedInsurance, setSelectedInsurance] = useState<'none' | 'basic' | 'premium' | 'ultimate'>('none')
  const [addressId, setAddressId] = useState('') // required by API
  const [notes, setNotes] = useState('')
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string, availableProviders: number }>>([])
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  // Services fetched from DB
  const [services, setServices] = useState<Array<{ id: string, name: string, base_price: number, description?: string }>>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)
  useEffect(() => {
    if (!serviceType) {
      setServices([])
      setSelectedService('') // Clear selected service when service type is cleared
      return
    }
    const controller = new AbortController()
    const { signal } = controller
    setServicesLoading(true)
    setServicesError(null)
    setSelectedService('') // Clear selected service when service type changes
    fetch(`/api/services?category=${encodeURIComponent(serviceType)}`, { signal })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to load services')
        }
        return res.json()
      })
      .then((data) => {
        if (!signal.aborted) {
          const list = Array.isArray(data?.services) ? data.services : []
          setServices(
            list.map((s: any) => ({
              id: s.id,
              name: s.name || 'Service',
              base_price: Number(s.base_price) || 0,
              description: s.description || undefined,
            }))
          )
        }
      })
      .catch((err: any) => {
        if (!signal.aborted) setServicesError(err?.message || 'Failed to load services')
      })
      .finally(() => {
        if (!signal.aborted) setServicesLoading(false)
      })
    return () => controller.abort()
  }, [serviceType])

  const formatTimeDisplay = (t: string) => {
    // t is "HH:MM"
    const [hhStr, mmStr] = t.split(':')
    let hh = parseInt(hhStr, 10)
    const mm = parseInt(mmStr, 10)
    const ampm = hh >= 12 ? 'PM' : 'AM'
    hh = hh % 12
    if (hh === 0) hh = 12
    return `${hh}:${String(isNaN(mm) ? 0 : mm).padStart(2, '0')} ${ampm}`
  }

  const selectedServiceObj = services.find(s => s.id === selectedService)
  const baseServicePrice = selectedServiceObj ? selectedServiceObj.base_price : 0

  useEffect(() => {
    // Fetch active add-ons from DB
    const supabase = createAnonSupabase()
    supabase
      .from('add_ons')
      .select('id, name, base_price, category, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setAddOns(
            data.map((d: any) => ({
              id: d.id,
              name: d.name,
              base_price: Number(d.base_price) || 0,
              category: d.category || undefined,
            }))
          )
        }
      })
  }, [])

  useEffect(() => {
    // Load availability when date changes with abortable fetch + retry/backoff for transient/429 errors
    const controller = new AbortController()
    const { signal } = controller
    ;(async () => {
      if (!selectedDate) {
        setAvailableSlots([])
        setSelectedTime('')
        return
      }
      setAvailabilityLoading(true)
      setAvailabilityError(null)
      setSelectedTime('')
      const fetchWithRetry = async (url: string, init: RequestInit & { signal: AbortSignal }, attempts = 3): Promise<any> => {
        let delay = 300
        for (let i = 0; i < attempts; i++) {
          try {
            const res = await fetch(url, init)
            if (res.ok) return res.json()
            // If rate limited or transient server error, retry
            if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
              const retryAfter = Number(res.headers.get('retry-after')) || 0
              const backoff = retryAfter > 0 ? retryAfter * 1000 : delay
              await new Promise(r => setTimeout(r, backoff))
              delay = Math.min(delay * 2, 2000)
              continue
            }
            // Non-retriable
            let message = 'Failed to load availability'
            try {
              const data = await res.json()
              message = data?.error || message
            } catch {}
            throw new Error(message)
          } catch (e: any) {
            if (init.signal.aborted) throw e
            if (i === attempts - 1) throw e
            await new Promise(r => setTimeout(r, delay))
            delay = Math.min(delay * 2, 2000)
          }
        }
      }
      try {
        const data = await fetchWithRetry(`/api/availability?date=${encodeURIComponent(selectedDate)}`, { signal }, 3)
        if (!signal.aborted) {
          setAvailableSlots(Array.isArray(data?.slots) ? data.slots : [])
        }
      } catch (err: any) {
        if (signal.aborted) return
        setAvailableSlots([])
        setAvailabilityError(err?.message || 'Failed to load availability')
      } finally {
        if (!signal.aborted) setAvailabilityLoading(false)
      }
    })()
    return () => controller.abort()
  }, [selectedDate])

  const addOnsSubtotal = selectedAddOns.reduce((sum, id) => {
    const addOn = addOns.find(a => a.id === id)
    return sum + (addOn?.base_price || 0)
  }, 0)

  const ADD_ONS_COMMISSION_PERCENT = 18
  const addOnsCommission = Math.round((addOnsSubtotal * (ADD_ONS_COMMISSION_PERCENT / 100)) * 100) / 100
  const insuranceAnnualPriceMap: Record<'none' | 'basic' | 'premium' | 'ultimate', number> = {
    none: 0,
    basic: 95.90,     // annual w/ 20% savings
    premium: 191.90,  // annual w/ 20% savings
    ultimate: 335.90, // annual w/ 20% savings
  }
  const insuranceSelectedAnnual = insuranceAnnualPriceMap[selectedInsurance]
  const [includeTSmartCard, setIncludeTSmartCard] = useState(false)
  const tSmartCardPrice = 99
  const eligibleForDiscount = baseServicePrice + addOnsSubtotal
  const tSmartInstantSavings = Math.round((eligibleForDiscount * 0.10) * 100) / 100
  const subtotalBeforeCard = baseServicePrice + addOnsSubtotal + addOnsCommission + insuranceSelectedAnnual
  const subtotalBeforeTax = includeTSmartCard
    ? Math.max(0, subtotalBeforeCard - tSmartInstantSavings) + tSmartCardPrice
    : subtotalBeforeCard
  const subtotalAfterCredit = Math.max(0, subtotalBeforeTax - appliedCredit)
  const tax = stateCode ? calculateSalesTax(subtotalAfterCredit, stateCode, city) : 0
  const total = subtotalAfterCredit + tax

  useEffect(() => {
    // Fetch current user from Supabase auth
    const supabase = createAnonSupabase()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUserId(data.user.id)
    })
  }, [])

  // Saved addresses for picker
  const [addresses, setAddresses] = useState<Array<{ id: string, label: string }>>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [addressesError, setAddressesError] = useState<string | null>(null)
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)
  const [newAddr, setNewAddr] = useState({
    street_address: '',
    apt_suite: '',
    city: '',
    state: '',
    zip_code: '',
  })
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false)
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const resetNewAddr = () => setNewAddr({ street_address: '', apt_suite: '', city: '', state: '', zip_code: '' })
  const validateUSState = (s: string) => /^[A-Z]{2}$/.test(s)
  const validateUSZip = (z: string) => /^\d{5}(-\d{4})?$/.test(z)

  const loadAddresses = async (signal?: AbortSignal) => {
    if (!userId) return
    const supabase = createAnonSupabase()
    const { data, error } = await supabase
      .from('addresses')
      .select('id, street_address, apt_suite, city, state, zip_code, is_default')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
    if (signal?.aborted) return
    if (error) {
      setAddressesError('Failed to load addresses')
      setAddresses([])
      return
    }
    const list = (data || []).map((a: any) => ({
      id: a.id as string,
      label: `${a.street_address}${a.apt_suite ? ' ' + a.apt_suite : ''}, ${a.city}, ${a.state} ${a.zip_code}${a.is_default ? ' (default)' : ''}`,
    }))
    setAddresses(list)
    if (!addressId && list.length > 0) {
      const def = list.find(l => l.label.endsWith('(default)'))
      setAddressId((def?.id || list[0].id) as string)
    }
  }

  useEffect(() => {
    if (!userId || step !== 2) return
    const controller = new AbortController()
    const { signal } = controller
    setAddressesLoading(true)
    setAddressesError(null)
    loadAddresses(signal).finally(() => {
      if (!signal.aborted) setAddressesLoading(false)
    })
    return () => controller.abort()
  }, [userId, step])

  // Persist selections in localStorage
  useEffect(() => {
    try {
      const savedService = localStorage.getItem('booking.selectedService')
      const savedDate = localStorage.getItem('booking.selectedDate')
      const savedTime = localStorage.getItem('booking.selectedTime')
      if (savedService) setSelectedService(savedService)
      if (savedDate) setSelectedDate(savedDate)
      if (savedTime) setSelectedTime(savedTime)
    } catch {}
  }, [])
  useEffect(() => {
    try {
      if (selectedService) localStorage.setItem('booking.selectedService', selectedService)
    } catch {}
  }, [selectedService])
  useEffect(() => {
    try {
      if (selectedDate) localStorage.setItem('booking.selectedDate', selectedDate)
    } catch {}
  }, [selectedDate])
  useEffect(() => {
    try {
      if (selectedTime) localStorage.setItem('booking.selectedTime', selectedTime)
    } catch {}
  }, [selectedTime])

  useEffect(() => {
    if (step !== 3 || !userId) return
    const controller = new AbortController()
    const { signal } = controller
    setLoyaltyLoading(true)
    fetch(`/api/loyalty/balance?user_id=${encodeURIComponent(userId)}`, { signal })
      .then(res => res.json())
      .then(data => {
        if (!signal.aborted && data && typeof data.points === 'number') {
          setPointsBalance(data.points)
        }
      })
      .catch(() => {
        if (!signal.aborted) setPointsBalance(0)
      })
      .finally(() => {
        if (!signal.aborted) setLoyaltyLoading(false)
      })
    return () => controller.abort()
  }, [step, userId])

  useEffect(() => {
    setAppliedCredit(redemptionPoints * 0.1)
  }, [redemptionPoints])

  const maxRedeemByBalance = Math.floor(pointsBalance / 10) * 10
  const maxRedeemByCap = Math.floor((subtotalBeforeTax * 0.5) / 0.1 / 10) * 10
  const maxRedeem = Math.max(0, Math.min(maxRedeemByBalance, maxRedeemByCap))

  const handleBooking = async () => {
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      // Basic validations before any side-effects
      if (!userId) {
        alert('Please log in to continue.')
        return
      }
      // Require a real UUID service id; current UI uses placeholders, so guard it.
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(selectedService)) {
        alert('Service catalog not linked. Please select a real service from catalog.')
        return
      }
      if (!selectedDate || !selectedTime) {
        alert('Please select a date and time.')
        return
      }
      if (!uuidRegex.test(addressId)) {
        alert('Please provide a valid Address ID (UUID).')
        return
      }

      // Attempt instant booking first
      const instantRes = await fetch('/api/bookings/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: userId,
          serviceId: selectedService,
          date: selectedDate,
          time: selectedTime, // in HH:MM
          durationHours: 2,
          addressId,
          notes: notes || undefined,
        }),
      })
      if (!instantRes.ok) {
        const err = await instantRes.json().catch(() => ({}))
        if (instantRes.status === 409) {
          alert(err?.error || 'Requested time is not available. Please pick another slot.')
          return
        }
        alert(err?.error || 'Failed to create instant booking.')
        return
      }

      let appliedPoints = 0
      let creditAmount = 0
      if (redemptionPoints >= 100 && userId) {
        const res = await fetch('/api/loyalty/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            requested_points: redemptionPoints,
            order_subtotal: subtotalBeforeTax,
          }),
        })
        const data = await res.json()
        appliedPoints = data.appliedPoints || 0
        creditAmount = data.creditAmount || 0
      }
      const eligibleSpend = Math.max(0, subtotalBeforeTax - creditAmount)
      await fetch('/api/loyalty/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          eligible_spend: eligibleSpend,
        }),
      })
    } finally {
      setIsSubmitting(false)
      // Create insurance policy draft if selected
      if (userId && selectedInsurance !== 'none') {
        try {
          await fetch('/api/insurance/policies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              // Optional if available in session/profile
              user_email: undefined,
              user_name: undefined,
              plan_code: selectedInsurance,
              billing_cycle: 'annual',
              effective_date: selectedDate || undefined,
            }),
          })
        } catch (e) {
          console.warn('Failed to create insurance policy draft', e)
        }
      }
      setTimeout(() => {
        router.push('/customer')
      }, 800)
    }
  }

  return (
    <div>
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-4">
        {[0, 1, 2, 3].map((num) => (
          <div key={num} className="flex items-center gap-4">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-medium ${
                step >= num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > num ? <CheckCircle2 className="h-5 w-5" /> : num + 1}
            </div>
            {num < 3 && (
              <div className={`h-1 w-16 ${step > num ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Select Service Type */}
      {step === 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Select Service Type</h2>
          <p className="text-muted-foreground mb-6">Choose the type of service you need</p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className={`p-8 cursor-pointer transition-all hover:shadow-lg ${
                serviceType === 'residential' ? 'border-primary ring-2 ring-primary bg-primary/10' : ''
              }`}
              onClick={() => setServiceType('residential')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Residential</h3>
                <p className="text-sm text-muted-foreground">
                  Home cleaning services including standard cleaning, deep cleaning, move-in/out, and more
                </p>
              </div>
            </Card>
            <Card
              className={`p-8 cursor-pointer transition-all hover:shadow-lg ${
                serviceType === 'commercial' ? 'border-primary ring-2 ring-primary bg-primary/10' : ''
              }`}
              onClick={() => setServiceType('commercial')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Commercial</h3>
                <p className="text-sm text-muted-foreground">
                  Business cleaning services for offices, retail spaces, and commercial properties
                </p>
              </div>
            </Card>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(1)} disabled={!serviceType}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 1: Select Service */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Select a Service</h2>
          {servicesLoading && <div className="text-sm text-muted-foreground mb-4">Loading services…</div>}
          {servicesError && <div className="text-sm text-red-600 mb-4">{servicesError}</div>}
          {!servicesLoading && services.length === 0 && !servicesError && (
            <div className="text-sm text-muted-foreground mb-4">No services available for this type.</div>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            {services.map((service) => {
              return (
                <Card
                  key={service.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedService === service.id ? 'border-primary ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <div className="h-32 w-full rounded-lg bg-primary/10 flex items-center justify-center mb-3 p-2">
                    <Image
                      src="/tsmart_cleaning_orange.png"
                      alt="tsmart cleaning logo"
                      width={180}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <h3 className="font-semibold mb-1 text-base">{service.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{service.description}</p>
                  <div className="text-xl font-bold">${service.base_price?.toFixed(0)}</div>
                </Card>
              )
            })}
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => {
              setSelectedService('')
              setStep(0)
            }}>
              Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!selectedService}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Schedule */}
      {step === 2 && (
            <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Schedule Your Service</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Time</Label>
              <div className="grid grid-cols-3 gap-3">
                {availabilityLoading && (
                  <div className="col-span-3 text-sm text-muted-foreground">Loading availability…</div>
                )}
                {!availabilityLoading && availableSlots.length === 0 && (
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {availabilityError ? availabilityError : 'No slots available for this date.'}
                  </div>
                )}
                {!availabilityLoading && availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time
                  const label = `${formatTimeDisplay(slot.time)}`
                  const capacity = typeof (slot as any).availableProviders === 'number' ? (slot as any).availableProviders : undefined
                  return (
                    <Button
                      key={slot.time}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => setSelectedTime(slot.time)}
                      className="w-full"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {label}
                      {typeof capacity === 'number' && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {capacity} available
                        </span>
                      )}
                    </Button>
                  )
                })}
              </div>
              {!availabilityLoading && availableSlots.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Showing start times with at least one available provider.
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State (e.g., NY)</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Add-ons (Platform commission applies to add-ons only)</Label>
              <div className="grid md:grid-cols-2 gap-3">
                {addOns.map(item => {
                  const checked = selectedAddOns.includes(item.id)
                  return (
                    <Card
                      key={item.id}
                      className={`p-4 cursor-pointer flex items-center justify-between ${checked ? 'border-primary ring-1 ring-primary' : ''}`}
                      onClick={() => {
                        setSelectedAddOns(prev =>
                          prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        )
                      }}
                    >
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">${item.base_price.toFixed(2)}</div>
                      </div>
                      {checked ? <Badge variant="default">Selected</Badge> : <Badge variant="outline">Add</Badge>}
                    </Card>
                  )
                })}
              </div>
              <div className="text-sm text-muted-foreground">
                Add-ons subtotal: ${addOnsSubtotal.toFixed(2)} • Commission: ${addOnsCommission.toFixed(2)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressId">Service Address</Label>
              {addressesLoading && <div className="text-sm text-muted-foreground">Loading your addresses…</div>}
              {addressesError && <div className="text-sm text-red-600">{addressesError}</div>}
              <div className="grid md:grid-cols-2 gap-3">
                <select
                  id="addressId"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                >
                  <option value="">Select an address…</option>
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
                <Button variant="outline" type="button" onClick={() => router.push('/customer/profile')}>
                  Manage Addresses
                </Button>
                <Button type="button" onClick={() => setIsAddAddressOpen(true)}>
                  Add New Address
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  disabled={!addressId}
                  onClick={async () => {
                    if (!userId || !addressId) return
                    const supabase = createAnonSupabase()
                    // unset others, set selected as default
                    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
                    await supabase.from('addresses').update({ is_default: true }).eq('id', addressId)
                    await loadAddresses()
                  }}
                >
                  Set as Default
                </Button>
              </div>
              {isAddAddressOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="w-[90%] max-w-lg rounded-lg bg-background p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Add New Address</h3>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => { setIsAddAddressOpen(false); resetNewAddr() }}
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="addr_street">Street Address</Label>
                        <Input
                          id="addr_street"
                          value={newAddr.street_address}
                          onChange={(e) => setNewAddr({ ...newAddr, street_address: e.target.value })}
                          placeholder="123 Main St"
                        />
                        {addressErrors.street_address && <div className="mt-1 text-xs text-red-600">{addressErrors.street_address}</div>}
                      </div>
                      <div>
                        <Label htmlFor="addr_apt">Apt / Suite (optional)</Label>
                        <Input
                          id="addr_apt"
                          value={newAddr.apt_suite}
                          onChange={(e) => setNewAddr({ ...newAddr, apt_suite: e.target.value })}
                          placeholder="Apt 4B"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="addr_city">City</Label>
                          <Input
                            id="addr_city"
                            value={newAddr.city}
                            onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                            placeholder="City"
                          />
                          {addressErrors.city && <div className="mt-1 text-xs text-red-600">{addressErrors.city}</div>}
                        </div>
                        <div>
                          <Label htmlFor="addr_state">State</Label>
                          <Input
                            id="addr_state"
                            value={newAddr.state}
                            onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value.toUpperCase() })}
                            placeholder="NY"
                          />
                          {addressErrors.state && <div className="mt-1 text-xs text-red-600">{addressErrors.state}</div>}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="addr_zip">ZIP Code</Label>
                        <Input
                          id="addr_zip"
                          value={newAddr.zip_code}
                          onChange={(e) => setNewAddr({ ...newAddr, zip_code: e.target.value })}
                          placeholder="10001"
                        />
                        {addressErrors.zip_code && <div className="mt-1 text-xs text-red-600">{addressErrors.zip_code}</div>}
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newAddrIsDefault}
                          onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                          className="accent-[var(--color-primary)]"
                        />
                        Set as default address
                      </label>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => { setIsAddAddressOpen(false); resetNewAddr() }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={isSavingAddress}
                        onClick={async () => {
                          if (!userId) return
                          const errs: Record<string, string> = {}
                          if (!newAddr.street_address.trim()) errs.street_address = 'Street address is required'
                          if (!newAddr.city.trim()) errs.city = 'City is required'
                          if (!newAddr.state.trim()) errs.state = 'State is required'
                          else if (!validateUSState(newAddr.state.trim())) errs.state = 'Use 2-letter state code (e.g., NY)'
                          if (!newAddr.zip_code.trim()) errs.zip_code = 'ZIP code is required'
                          else if (!validateUSZip(newAddr.zip_code.trim())) errs.zip_code = 'Invalid ZIP code (12345 or 12345-6789)'
                          setAddressErrors(errs)
                          if (Object.keys(errs).length > 0) return
                          setIsSavingAddress(true)
                          const supabase = createAnonSupabase()
                          const { data: inserted, error } = await supabase
                            .from('addresses')
                            .insert({
                              user_id: userId,
                              street_address: newAddr.street_address,
                              apt_suite: newAddr.apt_suite || null,
                              city: newAddr.city,
                              state: newAddr.state,
                              zip_code: newAddr.zip_code,
                              is_default: newAddrIsDefault || addresses.length === 0,
                            })
                            .select('id')
                            .single()
                          if (!error && inserted?.id) {
                            if (newAddrIsDefault && addresses.length > 0) {
                              await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId).neq('id', inserted.id)
                              await supabase.from('addresses').update({ is_default: true }).eq('id', inserted.id)
                            }
                            await loadAddresses()
                            setAddressId(inserted.id)
                            setIsAddAddressOpen(false)
                            resetNewAddr()
                            setNewAddrIsDefault(false)
                            setAddressErrors({})
                          }
                          setIsSavingAddress(false)
                        }}
                      >
                        {isSavingAddress ? 'Saving…' : 'Save Address'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or access instructions..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!selectedService || !selectedDate || !selectedTime || !addressId}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Confirm Booking</h2>
          <div className="space-y-6">
            {/* tSmartCard Upsell */}
            <Card className="p-4 ring-1 ring-indigo-500/20 bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">Unlock 10% Off Today with tSmartCard</div>
                  <div className="text-sm text-muted-foreground">
                    Add annual membership for ${tSmartCardPrice} and save ${tSmartInstantSavings.toFixed(2)} instantly on this order.
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Break-even in {Math.max(1, Math.ceil(tSmartCardPrice / Math.max(1, baseServicePrice * 0.10)))} bookings at your selected service price.
                  </div>
                </div>
                {includeTSmartCard && <Badge variant="default">Added</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setIncludeTSmartCard(prev => !prev)}
                  className="gap-2"
                >
                  {includeTSmartCard ? 'Remove tSmartCard' : `Add tSmartCard — $${tSmartCardPrice} / yr`}
                </Button>
                <div className="text-xs text-muted-foreground">
                  Savings applied to service and add-ons. Membership billed today, valid 12 months.
                </div>
              </div>
            </Card>
            {/* Insurance Upsell */}
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">Add CleanGuard Protection</div>
                  <div className="text-sm text-muted-foreground">
                    Protect your home & belongings with comprehensive coverage. Save 20% on annual plans.
                  </div>
                </div>
                <div className="hidden md:block text-xs text-muted-foreground">
                  Recommended for 2x+/week schedules
                </div>
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                <label
                  className={`cursor-pointer rounded-md border p-3 text-sm flex flex-col justify-between ${selectedInsurance === 'basic' ? 'border-primary ring-1 ring-primary' : ''}`}
                  onClick={() => setSelectedInsurance('basic')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">🛡️ Basic</span>
                    <input type="radio" name="insurance" checked={selectedInsurance === 'basic'} readOnly className="accent-[var(--color-primary)]" />
                  </div>
                  <div className="mt-1 text-muted-foreground">Up to $5K · $100 deductible</div>
                  <div className="mt-2 font-medium">$95.90/yr</div>
                </label>
                <label
                  className={`cursor-pointer rounded-md border p-3 text-sm flex flex-col justify-between ${selectedInsurance === 'premium' ? 'border-primary ring-1 ring-primary' : ''}`}
                  onClick={() => setSelectedInsurance('premium')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">🏆 Premium</span>
                    <input type="radio" name="insurance" checked={selectedInsurance === 'premium'} readOnly className="accent-[var(--color-primary)]" />
                  </div>
                  <div className="mt-1 text-muted-foreground">Up to $25K · Theft · $50 deductible</div>
                  <div className="mt-2 font-medium">$191.90/yr</div>
                  <div className="mt-1 text-[10px] inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary w-fit">Recommended</div>
                </label>
                <label
                  className={`cursor-pointer rounded-md border p-3 text-sm flex flex-col justify-between ${selectedInsurance === 'ultimate' ? 'border-primary ring-1 ring-primary' : ''}`}
                  onClick={() => setSelectedInsurance('ultimate')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">💎 Ultimate</span>
                    <input type="radio" name="insurance" checked={selectedInsurance === 'ultimate'} readOnly className="accent-[var(--color-primary)]" />
                  </div>
                  <div className="mt-1 text-muted-foreground">Up to $100K · Zero deductible</div>
                  <div className="mt-2 font-medium">$335.90/yr</div>
                </label>
              </div>
              <button
                type="button"
                className="mt-3 text-sm text-muted-foreground underline underline-offset-2"
                onClick={() => setSelectedInsurance('none')}
              >
                No thanks, I’ll skip protection
              </button>
            </Card>
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">
                    {services.find(s => s.id === selectedService)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base Service</span>
                  <span className="font-medium">${baseServicePrice.toFixed(2)}</span>
                </div>
                {selectedAddOns.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Add-ons Subtotal</span>
                      <span className="font-medium">${addOnsSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Add-ons Commission</span>
                      <span className="font-medium">${addOnsCommission.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {includeTSmartCard && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">tSmartCard Instant Savings (10%)</span>
                      <span className="font-medium text-green-600">-${tSmartInstantSavings.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">tSmartCard Membership (annual)</span>
                      <span className="font-medium">${tSmartCardPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {selectedInsurance !== 'none' && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      CleanGuard {selectedInsurance.charAt(0).toUpperCase() + selectedInsurance.slice(1)} (annual)
                    </span>
                    <span className="font-medium">${insuranceSelectedAnnual.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total Price</span>
                  <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Loyalty Points</div>
                <div className="text-sm text-muted-foreground">
                  {loyaltyLoading ? 'Loading…' : `${pointsBalance} pts`}
                </div>
              </div>
              <div className="mt-3 text-sm">
                Redeem points for credit (100 pts = $10). Max 50% of subtotal.
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  step={10}
                  value={redemptionPoints}
                  onChange={(e) => {
                    const raw = Math.max(0, Math.floor(Number(e.target.value) || 0))
                    const rounded = Math.floor(raw / 10) * 10
                    const capped = Math.min(rounded, maxRedeem)
                    setRedemptionPoints(capped)
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => setRedemptionPoints(maxRedeem >= 100 ? maxRedeem : 0)}
                  disabled={maxRedeem < 100}
                >
                  Redeem Max
                </Button>
                <Button variant="ghost" onClick={() => setRedemptionPoints(0)} disabled={redemptionPoints === 0}>
                  Clear
                </Button>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Applying: {redemptionPoints} pts → ${ (redemptionPoints * 0.1).toFixed(2) } credit
              </div>
            </Card>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-16 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    VISA
                  </div>
                  <div>
                    <div className="font-medium">•••• 4242</div>
                    <div className="text-sm text-muted-foreground">Expires 12/25</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleBooking} size="lg" disabled={isSubmitting}>
              Confirm & Pay
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
