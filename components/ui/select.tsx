'use client'

import * as React from 'react'

type SelectProps = {
	value?: string
	onValueChange?: (value: string) => void
	children?: React.ReactNode
	placeholder?: string
}

export function Select({ children }: { children: React.ReactNode }) {
	return <div className="relative">{children}</div>
}

export function SelectTrigger({
	children,
}: {
	children?: React.ReactNode
}) {
	return (
		<button
			type="button"
			className="w-full inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none"
		>
			{children}
		</button>
	)
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
	return <span className="text-gray-500">{placeholder ?? 'Select'}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
	return (
		<div className="mt-2 w-full rounded-md border border-gray-200 bg-white p-1 shadow-lg">
			{children}
		</div>
	)
}

export function SelectItem({
	value,
	children,
	onSelect,
}: {
	value: string
	children: React.ReactNode
	onSelect?: (value: string) => void
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect?.(value)}
			className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
		>
			{children}
		</button>
	)
}


