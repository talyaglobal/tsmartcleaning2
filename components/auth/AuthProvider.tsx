"use client";

import React from "react";
import { createAnonSupabase } from "@/lib/supabase";
import { UserRole, UserSession } from "@/lib/auth/roles";

export type AuthContextType = {
	user: UserSession | null;
	loading: boolean;
	signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType>({
	user: null,
	loading: true,
	signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = React.useState<UserSession | null>(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		const supabase = createAnonSupabase();
		let mounted = true;

		async function load() {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				const rawUser = session?.user ?? null;
				if (!mounted) return;
				if (rawUser) {
					const role =
						((rawUser.user_metadata as any)?.role as UserRole | undefined) ?? UserRole.CLEANING_COMPANY;
					const profileImage = (rawUser.user_metadata as any)?.avatar_url ?? null;
					const name = rawUser.user_metadata?.name ?? rawUser.email ?? "User";
					setUser({
						id: rawUser.id,
						email: rawUser.email ?? "",
						name,
						role,
						profileImage,
						permissions: [],
						isActive: true,
						createdAt: rawUser.created_at ?? undefined,
					});
				} else {
					setUser(null);
				}
			} finally {
				if (mounted) setLoading(false);
			}
		}

		load();

		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			const rawUser = session?.user ?? null;
			if (rawUser) {
				const role =
					((rawUser.user_metadata as any)?.role as UserRole | undefined) ?? UserRole.CLEANING_COMPANY;
				const profileImage = (rawUser.user_metadata as any)?.avatar_url ?? null;
				const name = rawUser.user_metadata?.name ?? rawUser.email ?? "User";
				setUser({
					id: rawUser.id,
					email: rawUser.email ?? "",
					name,
					role,
					profileImage,
					permissions: [],
					isActive: true,
					createdAt: rawUser.created_at ?? undefined,
				});
			} else {
				setUser(null);
			}
		});

		return () => {
			mounted = false;
			sub.subscription.unsubscribe();
		};
	}, []);

	const signOut = React.useCallback(async () => {
		const supabase = createAnonSupabase();
		await supabase.auth.signOut();
		setUser(null);
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return React.useContext(AuthContext);
}


