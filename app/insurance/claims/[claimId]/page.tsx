import { Card } from '@/components/ui/card'

export default function ClaimStatusPage({ params }: { params: { claimId: string } }) {
  const claimId = params.claimId
  const prettyId = decodeURIComponent(claimId)
  const timeline = [
    { label: 'Filed', done: true },
    { label: 'Under Review', done: true },
    { label: 'Adjuster Assigned', done: false },
    { label: 'Approved', done: false },
    { label: 'Paid', done: false },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Claim Status</h1>
        <p className="text-muted-foreground mb-6">Claim ID: {prettyId}</p>

        <Card className="p-6 mb-6">
          <div className="font-semibold">Status Timeline</div>
          <div className="mt-4 flex items-center justify-between">
            {timeline.map((t, idx) => (
              <div key={t.label} className="flex-1 flex items-center">
                <div className={`size-3 rounded-full ${t.done ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                {idx < timeline.length - 1 && <div className="h-0.5 flex-1 bg-muted-foreground/20 mx-2" />}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {timeline.map((t) => <div key={t.label}>{t.label}</div>)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Incident Type</div>
              <div>Property Damage</div>
            </div>
            <div>
              <div className="text-muted-foreground">Filed Date</div>
              <div>Nov 16, 2025</div>
            </div>
            <div>
              <div className="text-muted-foreground">Amount Claimed</div>
              <div>$1,200</div>
            </div>
            <div>
              <div className="text-muted-foreground">Estimated Payout</div>
              <div>$1,150</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="font-semibold mb-2">Activity Log</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Nov 16, 9:30 AM — Claim filed</li>
              <li>Nov 16, 10:15 AM — Claim received</li>
              <li>Nov 16, 2:00 PM — Under review</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}


