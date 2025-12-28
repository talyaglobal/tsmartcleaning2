"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plug, CheckCircle2, XCircle, Settings } from "lucide-react";

export default function IntegrationsPage() {
	const integrations = [
		{ name: "Stripe", status: "connected", description: "Payment processing" },
		{ name: "SendGrid", status: "connected", description: "Email delivery" },
		{ name: "WhatsApp API", status: "disconnected", description: "Messaging" },
		{ name: "Sentry", status: "connected", description: "Error tracking" },
	];

	const getStatusIcon = (status: string) => {
		return status === "connected" ? (
			<CheckCircle2 className="h-5 w-5 text-green-500" />
		) : (
			<XCircle className="h-5 w-5 text-gray-400" />
		);
	};

	const getStatusBadge = (status: string) => {
		return (
			<Badge variant={status === "connected" ? "default" : "secondary"}>
				{status}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Integrations"
				subtitle="Manage third-party integrations and API keys"
			/>

			<div className="grid gap-4 md:grid-cols-2">
				{integrations.map((integration) => (
					<Card key={integration.name}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Plug className="h-5 w-5" />
									<CardTitle>{integration.name}</CardTitle>
								</div>
								{getStatusIcon(integration.status)}
							</div>
							<CardDescription>{integration.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								{getStatusBadge(integration.status)}
								<Button variant="outline" size="sm">
									<Settings className="h-4 w-4 mr-2" />
									Configure
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>API Keys Management</CardTitle>
					<CardDescription>Manage API keys for external services</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Webhook Secret</Label>
						<Input type="password" placeholder="Enter webhook secret" />
						<p className="text-sm text-muted-foreground">Secret key for webhook verification</p>
					</div>
					<Button>Save API Keys</Button>
				</CardContent>
			</Card>
		</div>
	);
}

