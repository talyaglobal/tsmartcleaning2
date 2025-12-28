"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Save } from "lucide-react";

export default function GamificationRulesPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Gamification Rules"
				subtitle="Configure global gamification settings and feature toggles"
			/>

			<Tabs defaultValue="general" className="space-y-4">
				<TabsList>
					<TabsTrigger value="general">General Settings</TabsTrigger>
					<TabsTrigger value="points">Points System</TabsTrigger>
					<TabsTrigger value="badges">Badges</TabsTrigger>
					<TabsTrigger value="levels">Levels</TabsTrigger>
					<TabsTrigger value="features">Feature Toggles</TabsTrigger>
				</TabsList>

				<TabsContent value="general" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Global Gamification Settings</CardTitle>
							<CardDescription>Configure overall gamification behavior</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Enable Gamification</Label>
									<p className="text-sm text-muted-foreground">Turn gamification system on or off</p>
								</div>
								<Switch defaultChecked />
							</div>
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Show Leaderboards</Label>
									<p className="text-sm text-muted-foreground">Display leaderboards to users</p>
								</div>
								<Switch defaultChecked />
							</div>
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Enable Challenges</Label>
									<p className="text-sm text-muted-foreground">Allow time-based challenges</p>
								</div>
								<Switch defaultChecked />
							</div>
							<Button>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="points" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Point Multipliers</CardTitle>
							<CardDescription>Configure point multipliers for different actions</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Job Completion Multiplier</Label>
								<Input type="number" defaultValue="1" min="0" step="0.1" />
								<p className="text-sm text-muted-foreground">Multiply points earned for job completion</p>
							</div>
							<div className="space-y-2">
								<Label>Referral Bonus Multiplier</Label>
								<Input type="number" defaultValue="1" min="0" step="0.1" />
								<p className="text-sm text-muted-foreground">Multiply points earned for referrals</p>
							</div>
							<Button>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="features" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Feature Toggles</CardTitle>
							<CardDescription>Enable or disable specific gamification features</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>A/B Testing</Label>
									<p className="text-sm text-muted-foreground">Enable A/B testing for gamification features</p>
								</div>
								<Switch />
							</div>
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Seasonal Events</Label>
									<p className="text-sm text-muted-foreground">Enable seasonal gamification events</p>
								</div>
								<Switch />
							</div>
							<Button>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

