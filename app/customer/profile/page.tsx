import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CustomerProfilePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav userType="customer" userName="User" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
          
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
                  </div>
                  <Button>Save Changes</Button>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Saved Addresses</h2>
                  <Button>Add New Address</Button>
                </div>
                <div className="space-y-4">
                  <Card className="p-4 border-primary">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium mb-1">Home</div>
                        <div className="text-sm text-muted-foreground">
                          123 Main St<br />
                          Boston, MA 02101
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Delete</Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Payment Methods</h2>
                  <Button>Add Payment Method</Button>
                </div>
                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-16 rounded bg-muted flex items-center justify-center text-xs font-medium">
                          VISA
                        </div>
                        <div>
                          <div className="font-medium">•••• 4242</div>
                          <div className="text-sm text-muted-foreground">Expires 12/25</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Remove</Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Cleaning Preferences</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Special Instructions</Label>
                    <Input placeholder="Any special requirements or notes..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Cleaning Time</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                      <option>Morning (8 AM - 12 PM)</option>
                      <option>Afternoon (12 PM - 5 PM)</option>
                      <option>Evening (5 PM - 8 PM)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ecoFriendly" className="h-4 w-4" />
                    <Label htmlFor="ecoFriendly" className="font-normal">
                      Prefer eco-friendly cleaning products
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="petFriendly" className="h-4 w-4" />
                    <Label htmlFor="petFriendly" className="font-normal">
                      Pet-friendly products required
                    </Label>
                  </div>
                  <Button>Save Preferences</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
