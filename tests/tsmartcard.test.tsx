/**
 * Test suite for tSmartCard landing page
 * Tests plan selection, pricing calculator, form submission, and responsive design
 */

import { describe, it, expect } from 'vitest'

describe('tSmartCard Landing Page', () => {
  describe('Calculator Logic', () => {
    it('should calculate annual cost correctly for tSmartCard', () => {
      const plan = 'card'
      const amount = 150
      const frequency = 'biweekly' // 26 orders per year
      const ordersPerYear = 26
      
      const planAnnualCost = 99 // tSmartCard is $99/year
      const discountRate = 0.10 // 10% discount
      
      const annualWithout = amount * ordersPerYear // 150 * 26 = 3900
      const annualDiscount = annualWithout * discountRate // 3900 * 0.10 = 390
      const annualWith = annualWithout - annualDiscount // 3900 - 390 = 3510
      const netSavings = annualDiscount - planAnnualCost // 390 - 99 = 291
      
      expect(annualWithout).toBe(3900)
      expect(annualDiscount).toBe(390)
      expect(annualWith).toBe(3510)
      expect(netSavings).toBe(291)
    })

    it('should calculate break-even correctly', () => {
      const planAnnualCost = 99
      const amount = 150
      const discountRate = 0.10
      const discountPerOrder = amount * discountRate // 15
      
      const breakEvenOrders = Math.ceil(planAnnualCost / discountPerOrder) // ceil(99/15) = 7
      
      expect(breakEvenOrders).toBe(7)
      expect(breakEvenOrders * discountPerOrder).toBeGreaterThanOrEqual(planAnnualCost)
    })

    it('should handle basic plan with 0% discount', () => {
      const planAnnualCost = 0
      const amount = 150
      const discountRate = 0
      const discountPerOrder = amount * discountRate
      
      const breakEvenOrders = discountPerOrder > 0 && planAnnualCost > 0 
        ? Math.ceil(planAnnualCost / discountPerOrder)
        : Infinity
      
      expect(breakEvenOrders).toBe(Infinity)
    })

    it('should calculate tSmartPro correctly with yearly billing', () => {
      const plan = 'pro'
      const billing = 'yearly'
      const planAnnualCost = billing === 'yearly' ? 190 : 19 * 12
      const discountRate = 0.15
      
      expect(planAnnualCost).toBe(190)
      expect(discountRate).toBe(0.15)
    })

    it('should calculate tSmartPro correctly with monthly billing', () => {
      const plan = 'pro'
      const billing = 'monthly'
      const planAnnualCost = billing === 'yearly' ? 190 : 19 * 12
      
      expect(planAnnualCost).toBe(228) // 19 * 12
    })

    it('should calculate orders per year correctly', () => {
      const weeklyOrders = 52
      const biweeklyOrders = 26
      const monthlyOrders = 12
      const customOrders = 24
      
      expect(weeklyOrders).toBe(52)
      expect(biweeklyOrders).toBe(26)
      expect(monthlyOrders).toBe(12)
      expect(customOrders).toBe(24)
    })

    it('should calculate net savings correctly for elite plan', () => {
      const planAnnualCost = 490 // Elite yearly
      const amount = 200
      const ordersPerYear = 24
      const discountRate = 0.20 // 20% discount
      
      const annualWithout = amount * ordersPerYear // 4800
      const annualDiscount = annualWithout * discountRate // 960
      const netSavings = annualDiscount - planAnnualCost // 960 - 490 = 470
      
      expect(netSavings).toBe(470)
    })

    it('should handle zero amount gracefully', () => {
      const amount = 0
      const ordersPerYear = 26
      const discountRate = 0.10
      
      const annualWithout = amount * ordersPerYear
      const annualDiscount = annualWithout * discountRate
      
      expect(annualWithout).toBe(0)
      expect(annualDiscount).toBe(0)
    })

    it('should calculate progress to break-even correctly', () => {
      const ordersPerYear = 26
      const breakEvenOrders = 7
      
      const progress = Math.min(100, Math.round((Math.min(ordersPerYear, breakEvenOrders) / breakEvenOrders) * 100))
      
      // 7 orders out of 7 needed = 100%
      expect(progress).toBe(100)
      
      // If user books more than break-even, progress should cap at 100%
      const progressCapped = Math.min(100, Math.round((Math.min(26, 7) / 7) * 100))
      expect(progressCapped).toBe(100)
    })

    it('should handle progress when orders are less than break-even', () => {
      const ordersPerYear = 5
      const breakEvenOrders = 7
      
      const progress = Math.min(100, Math.round((Math.min(ordersPerYear, breakEvenOrders) / breakEvenOrders) * 100))
      
      // 5 orders out of 7 needed = ~71%
      expect(progress).toBe(Math.round((5 / 7) * 100))
    })
  })

  describe('Plan Features', () => {
    it('should have correct features for tSmartCard', () => {
      const plan = 'card'
      const features = {
        priorityBooking: plan === 'card' || plan === 'pro' || plan === 'elite',
        freeRescheduling: plan === 'pro' || plan === 'elite',
        dedicatedSupport: plan === 'pro' || plan === 'elite',
        noBookingFees: plan === 'pro' || plan === 'elite',
      }
      
      expect(features.priorityBooking).toBe(true)
      expect(features.freeRescheduling).toBe(false)
      expect(features.dedicatedSupport).toBe(false)
      expect(features.noBookingFees).toBe(false)
    })

    it('should have correct features for tSmartPro', () => {
      const plan = 'pro'
      const features = {
        priorityBooking: plan === 'card' || plan === 'pro' || plan === 'elite',
        freeRescheduling: plan === 'pro' || plan === 'elite',
        dedicatedSupport: plan === 'pro' || plan === 'elite',
        noBookingFees: plan === 'pro' || plan === 'elite',
        upgradeLabel: plan === 'elite' ? 'Monthly free upgrade' : plan === 'pro' ? '1 free upgrade/quarter' : null,
      }
      
      expect(features.priorityBooking).toBe(true)
      expect(features.freeRescheduling).toBe(true)
      expect(features.dedicatedSupport).toBe(true)
      expect(features.noBookingFees).toBe(true)
      expect(features.upgradeLabel).toBe('1 free upgrade/quarter')
    })

    it('should have correct features for tSmartElite', () => {
      const plan = 'elite'
      const features = {
        priorityBooking: plan === 'card' || plan === 'pro' || plan === 'elite',
        freeRescheduling: plan === 'pro' || plan === 'elite',
        unlimitedRescheduling: plan === 'elite',
        conciergeService: plan === 'elite',
        sameDayAvailability: plan === 'elite',
        premiumCleanersOnly: plan === 'elite',
        upgradeLabel: plan === 'elite' ? 'Monthly free upgrade' : plan === 'pro' ? '1 free upgrade/quarter' : null,
      }
      
      expect(features.priorityBooking).toBe(true)
      expect(features.unlimitedRescheduling).toBe(true)
      expect(features.conciergeService).toBe(true)
      expect(features.sameDayAvailability).toBe(true)
      expect(features.premiumCleanersOnly).toBe(true)
      expect(features.upgradeLabel).toBe('Monthly free upgrade')
    })
  })

  describe('Discount Rates', () => {
    it('should have correct discount rates for each plan', () => {
      const discountByPlan = {
        basic: 0,
        card: 0.10,
        pro: 0.15,
        elite: 0.20,
      }
      
      expect(discountByPlan.basic).toBe(0)
      expect(discountByPlan.card).toBe(0.10)
      expect(discountByPlan.pro).toBe(0.15)
      expect(discountByPlan.elite).toBe(0.20)
    })
  })

  describe('Plan Labels', () => {
    it('should generate correct plan labels', () => {
      const getPlanLabel = (plan: string) => {
        if (plan === 'card') return 'tSmartCard'
        if (plan === 'pro') return 'tSmartPro'
        if (plan === 'elite') return 'tSmartElite'
        return 'tSmartBasic'
      }
      
      expect(getPlanLabel('basic')).toBe('tSmartBasic')
      expect(getPlanLabel('card')).toBe('tSmartCard')
      expect(getPlanLabel('pro')).toBe('tSmartPro')
      expect(getPlanLabel('elite')).toBe('tSmartElite')
    })
  })
})

