'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

type EnsureDashboardUserProps = {
	paramKey?: string
}

export default function EnsureDashboardUser({ paramKey = 'userId' }: EnsureDashboardUserProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	useEffect(() => {
		let isMounted = true
		async function ensure() {
			const existing = searchParams?.get(paramKey)
			if (existing) return
			const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
			const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
			if (!supabaseUrl || !anon) return
			const supabase = createClient(supabaseUrl, anon, {
				auth: { autoRefreshToken: true, persistSession: true },
			})
			const { data } = await supabase.auth.getSession()
			const uid = data?.session?.user?.id
			if (!uid || !isMounted) return
			const params = new URLSearchParams(searchParams?.toString() || '')
			params.set(paramKey, uid)
			router.replace(`${pathname}?${params.toString()}`)
		}
		ensure()
		return () => {
			isMounted = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname, router, searchParams, paramKey])

	return null
}


