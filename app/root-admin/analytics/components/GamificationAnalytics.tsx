"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Coins, Award, TrendingUp, Trophy } from "lucide-react";
import { PointsDistribution } from "./PointsDistribution";
import { BadgeAchievements } from "./BadgeAchievements";
import { LevelProgression } from "./LevelProgression";
import { LeaderboardStats } from "./LeaderboardStats";

export function GamificationAnalytics() {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Pre-load data when component mounts
		setLoading(false);
	}, []);

	if (loading) {
		return <LoadingSpinner label="Loading gamification analytics..." />;
	}

	return (
		<div className="space-y-6">
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Tabs defaultValue="points" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="points">
						<Coins className="h-4 w-4 mr-2" />
						Points
					</TabsTrigger>
					<TabsTrigger value="badges">
						<Award className="h-4 w-4 mr-2" />
						Badges
					</TabsTrigger>
					<TabsTrigger value="levels">
						<TrendingUp className="h-4 w-4 mr-2" />
						Levels
					</TabsTrigger>
					<TabsTrigger value="leaderboards">
						<Trophy className="h-4 w-4 mr-2" />
						Leaderboards
					</TabsTrigger>
				</TabsList>

				<TabsContent value="points" className="mt-6">
					<PointsDistribution />
				</TabsContent>

				<TabsContent value="badges" className="mt-6">
					<BadgeAchievements />
				</TabsContent>

				<TabsContent value="levels" className="mt-6">
					<LevelProgression />
				</TabsContent>

				<TabsContent value="leaderboards" className="mt-6">
					<LeaderboardStats />
				</TabsContent>
			</Tabs>
		</div>
	);
}

