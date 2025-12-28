"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Webhook, FileCode, ToggleLeft, Bug } from "lucide-react";
import Link from "next/link";

export default function DeveloperToolsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Developer Tools"
				subtitle="API documentation, webhook testing, and debug tools"
			/>

			<Tabs defaultValue="api" className="space-y-4">
				<TabsList>
					<TabsTrigger value="api">API Documentation</TabsTrigger>
					<TabsTrigger value="webhooks">Webhooks</TabsTrigger>
					<TabsTrigger value="features">Feature Flags</TabsTrigger>
					<TabsTrigger value="debug">Debug Mode</TabsTrigger>
				</TabsList>

				<TabsContent value="api" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>API Documentation</CardTitle>
							<CardDescription>Access API documentation and endpoints</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								API documentation is available in the docs directory and can be accessed programmatically.
							</p>
							<Button asChild>
								<Link href="/docs/api">
									<FileCode className="h-4 w-4 mr-2" />
									View API Docs
								</Link>
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="webhooks" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Webhook Testing</CardTitle>
							<CardDescription>Test webhook endpoints and configurations</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Webhook URL</Label>
								<Input placeholder="https://example.com/webhook" />
							</div>
							<div className="space-y-2">
								<Label>Payload (JSON)</Label>
								<Input placeholder='{"event": "test", "data": {}}' />
							</div>
							<Button>
								<Webhook className="h-4 w-4 mr-2" />
								Test Webhook
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="features" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Feature Flags</CardTitle>
							<CardDescription>Enable or disable experimental features</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Beta Features</Label>
									<p className="text-sm text-muted-foreground">Enable beta features for testing</p>
								</div>
								<Switch />
							</div>
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Debug Logging</Label>
									<p className="text-sm text-muted-foreground">Enable detailed debug logging</p>
								</div>
								<Switch />
							</div>
							<Button>
								<ToggleLeft className="h-4 w-4 mr-2" />
								Save Feature Flags
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="debug" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Debug Mode</CardTitle>
							<CardDescription>Enable debug mode for development and troubleshooting</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Enable Debug Mode</Label>
									<p className="text-sm text-muted-foreground">Show detailed error messages and logs</p>
								</div>
								<Switch />
							</div>
							<div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
								<div className="flex">
									<Bug className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
									<div className="ml-3">
										<p className="text-sm text-yellow-800 dark:text-yellow-200">
											Warning: Debug mode should only be enabled in development environments.
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

