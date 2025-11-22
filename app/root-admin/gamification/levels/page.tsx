"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertCircle,
	Save,
	RefreshCw,
	TrendingUp,
	Building2,
	User,
	CheckCircle2,
	BarChart3,
} from "lucide-react";
import { LevelConfiguration } from "./components/LevelConfiguration";
import { LevelDistribution } from "./components/LevelDistribution";
import { ProgressionAnalytics } from "./components/ProgressionAnalytics";

type LevelConfig = {
	id: string;
	name: string;
	minPoints: number;
	maxPoints: number | null;
	rewards: {
		premiumFeatures: boolean;
		prioritySupport: boolean;
		exclusiveBadges: string[];
		profileHighlight: boolean;
		leaderboardRecognition: boolean;
	};
};

type LevelsConfig = {
	companyLevels: LevelConfig[];
	cleanerLevels: LevelConfig[];
};

type LevelDistributionData = {
	companyDistribution: Array<{ level: string; count: number; percentage: number }>;
	cleanerDistribution: Array<{ level: string; count: number; percentage: number }>;
};

type ProgressionAnalyticsData = {
	averageTimeToLevelUp: {
		company: Record<string, number>; // level name -> days
		cleaner: Record<string, number>;
	};
	levelUpRates: {
		company: Record<string, number>; // level name -> percentage
		cleaner: Record<string, number>;
	};
	bottlenecks: Array<{
		level: string;
		userType: "company" | "cleaner";
		avgDaysStuck: number;
		usersAffected: number;
	}>;
};

export default function LevelsPage() {
	const [activeTab, setActiveTab] = useState("configuration");
	const [config, setConfig] = useState<LevelsConfig | null>(null);
	const [distribution, setDistribution] = useState<LevelDistributionData | null>(null);
	const [analytics, setAnalytics] = useState<ProgressionAnalyticsData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [saving, setSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		setError(null);
		try {
			// Load configuration
			const configRes = await fetch("/api/root-admin/gamification/levels/config");
			if (!configRes.ok) throw new Error("Failed to load configuration");
			const configData = await configRes.json();
			setConfig(configData);

			// Load distribution if on that tab
			if (activeTab === "distribution") {
				const distRes = await fetch("/api/root-admin/gamification/levels/distribution");
				if (distRes.ok) {
					const distData = await distRes.json();
					setDistribution(distData);
				}
			}

			// Load analytics if on that tab
			if (activeTab === "analytics") {
				const analyticsRes = await fetch("/api/root-admin/gamification/levels/analytics");
				if (analyticsRes.ok) {
					const analyticsData = await analyticsRes.json();
					setAnalytics(analyticsData);
				}
			}
		} catch (err: any) {
			console.error("Error loading data:", err);
			setError(err?.message || "Failed to load data");
		} finally {
			setLoading(false);
		}
	};

	const handleTabChange = async (value: string) => {
		setActiveTab(value);
		if (value === "distribution" && !distribution) {
			try {
				const res = await fetch("/api/root-admin/gamification/levels/distribution");
				if (res.ok) {
					const data = await res.json();
					setDistribution(data);
				}
			} catch (err) {
				console.error("Error loading distribution:", err);
			}
		}
		if (value === "analytics" && !analytics) {
			try {
				const res = await fetch("/api/root-admin/gamification/levels/analytics");
				if (res.ok) {
					const data = await res.json();
					setAnalytics(data);
				}
			} catch (err) {
				console.error("Error loading analytics:", err);
			}
		}
	};

	const handleSave = async (updatedConfig: LevelsConfig) => {
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const res = await fetch("/api/root-admin/gamification/levels/config", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updatedConfig),
			});
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to save configuration");
			}
			setConfig(updatedConfig);
			setSuccess("Configuration saved successfully");
			setTimeout(() => setSuccess(null), 3000);
		} catch (err: any) {
			console.error("Error saving configuration:", err);
			setError(err?.message || "Failed to save configuration");
		} finally {
			setSaving(false);
		}
	};

	const handleRecalculate = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/root-admin/gamification/levels/recalculate", {
				method: "POST",
			});
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to recalculate levels");
			}
			setSuccess("Levels recalculated successfully. Refreshing data...");
			setTimeout(() => {
				loadData();
				setSuccess(null);
			}, 2000);
		} catch (err: any) {
			console.error("Error recalculating levels:", err);
			setError(err?.message || "Failed to recalculate levels");
			setLoading(false);
		}
	};

	if (loading && !config) {
		return (
			<div className="space-y-6">
				<PageHeader title="Levels & Progression" subtitle="Configure level thresholds and rewards" />
				<LoadingSpinner label="Loading levels configuration..." />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Levels & Progression"
				subtitle="Configure level thresholds, rewards, and track progression analytics"
				actions={
					<div className="flex gap-2">
						<Button variant="outline" onClick={handleRecalculate} disabled={loading}>
							<RefreshCw className="h-4 w-4 mr-2" />
							Recalculate All
						</Button>
					</div>
				}
			/>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
					<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
					<AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
				</Alert>
			)}

			<Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="configuration">
						<TrendingUp className="h-4 w-4 mr-2" />
						Configuration
					</TabsTrigger>
					<TabsTrigger value="distribution">
						<BarChart3 className="h-4 w-4 mr-2" />
						Distribution
					</TabsTrigger>
					<TabsTrigger value="analytics">
						<BarChart3 className="h-4 w-4 mr-2" />
						Analytics
					</TabsTrigger>
				</TabsList>

				<TabsContent value="configuration" className="space-y-6">
					{config && (
						<LevelConfiguration
							config={config}
							onSave={handleSave}
							saving={saving}
						/>
					)}
				</TabsContent>

				<TabsContent value="distribution" className="space-y-6">
					{distribution ? (
						<LevelDistribution data={distribution} />
					) : (
						<LoadingSpinner label="Loading distribution data..." />
					)}
				</TabsContent>

				<TabsContent value="analytics" className="space-y-6">
					{analytics ? (
						<ProgressionAnalytics data={analytics} />
					) : (
						<LoadingSpinner label="Loading analytics data..." />
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

