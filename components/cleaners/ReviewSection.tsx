'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Verified, Image as ImageIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface Review {
  id: string
  rating: number
  title?: string | null
  comment?: string | null
  customer_name?: string | null
  verified?: boolean | null
  service_type?: string | null
  service_date?: string | null
  created_at?: string | null
  helpful_count?: number | null
  company_response?: string | null
  response_date?: string | null
  photos?: Array<{ url: string }> | null
}

interface ReviewSectionProps {
  reviews: Review[]
  averageRating: number | null
  totalReviews: number
}

export function ReviewSection({ reviews, averageRating, totalReviews }: ReviewSectionProps) {
  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const verifiedReviews = reviews.filter((r) => r.verified)
  const reviewsWithPhotos = reviews.filter((r) => r.photos && r.photos.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating Summary */}
        <div className="text-center py-6 border-b">
          <div className="text-5xl font-bold mb-2">
            {averageRating ? averageRating.toFixed(1) : 'N/A'}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-6 w-6 ${
                  averageRating && i < Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            {verifiedReviews.length > 0 && (
              <span className="ml-2">
                ({verifiedReviews.length} verified)
              </span>
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        {totalReviews > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium mb-3">Rating Breakdown</div>
            {ratingDistribution.map(({ stars, count }) => {
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                All Reviews ({reviews.length})
              </div>
              <div className="flex gap-2">
                {verifiedReviews.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Verified className="h-3 w-3 mr-1" />
                    {verifiedReviews.length} Verified
                  </Badge>
                )}
                {reviewsWithPhotos.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {reviewsWithPhotos.length} With Photos
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {review.rating}/5
                        </span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Verified className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-semibold">
                        {review.customer_name || 'Anonymous'}
                      </div>
                      {review.service_type && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {review.service_type}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {formatDate(review.created_at)}
                      {review.service_date && (
                        <div className="mt-1">
                          Service: {formatDate(review.service_date)}
                        </div>
                      )}
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-semibold">{review.title}</h4>
                  )}

                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}

                  {review.photos && review.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {review.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded overflow-hidden"
                        >
                          <img
                            src={photo.url}
                            alt={`Review photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {review.company_response && (
                    <div className="mt-3 pt-3 border-t bg-muted/30 rounded p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">Company Response</span>
                        {review.response_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.response_date)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.company_response}
                      </p>
                    </div>
                  )}

                  {review.helpful_count !== null && review.helpful_count > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No reviews yet</p>
            <p className="text-xs mt-1">Be the first to review this company</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

