'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, DollarSign } from 'lucide-react'

interface Service {
  id: string
  service_name: string
  description?: string | null
  base_price?: number | null
  price_type?: string | null
  duration?: number | null
  available: boolean
}

interface ServicePackagesProps {
  services: Service[]
}

export function ServicePackages({ services }: ServicePackagesProps) {
  if (!services || services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services & Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No services available yet</p>
        </CardContent>
      </Card>
    )
  }

  const formatPrice = (price: number | null | undefined, priceType: string | null | undefined) => {
    if (!price) return 'Contact for pricing'
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)

    switch (priceType) {
      case 'hourly':
        return `${formattedPrice}/hour`
      case 'per_sqft':
        return `${formattedPrice}/sq ft`
      case 'flat':
        return formattedPrice
      default:
        return formattedPrice
    }
  }

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    return `${hours}h ${mins}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services & Pricing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{service.service_name}</h3>
                {service.available && (
                  <Badge variant="secondary" className="ml-2">
                    Available
                  </Badge>
                )}
              </div>
              
              {service.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {service.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {formatPrice(service.base_price, service.price_type)}
                  </span>
                </div>
                
                {service.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(service.duration)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Verified Service</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

