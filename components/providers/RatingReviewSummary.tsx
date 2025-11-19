'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Review {
  id?: string
  rating: number
  comment?: string | null
  response?: string | null
  responded_at?: string | null
  created_at?: string
  booking?: {
    id: string
  }
}

interface RatingReviewSummaryProps {
  rating: number
  totalReviews: number
  recentReviews: Review[]
}

export function RatingReviewSummary({ rating, totalReviews, recentReviews }: RatingReviewSummaryProps) {
  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    stars: star,
    count: recentReviews.filter(r => Math.round(r.rating) === star).length
  }))

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Rating & Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center py-4 border-b">
          <div className="text-5xl font-bold mb-2">
            {rating > 0 ? rating.toFixed(1) : 'N/A'}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating Distribution */}
        {totalReviews > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">Rating Distribution</div>
            {ratingDistribution.map(({ stars, count }) => {
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent Reviews */}
        {recentReviews.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm font-medium">Recent Reviews</div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentReviews.slice(0, 3).map((review, index) => (
                <div key={index} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm font-medium ml-1">
                        {review.rating}/5
                      </span>
                    </div>
                    {review.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      "{review.comment}"
                    </p>
                  )}
                  {review.response && (
                    <div className="mt-3 pt-3 border-t border-muted">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Provider Response:
                      </div>
                      <p className="text-sm text-foreground">
                        {review.response}
                      </p>
                      {review.responded_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(review.responded_at)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {totalReviews === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No reviews yet</p>
            <p className="text-xs mt-1">Complete jobs to receive reviews</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

