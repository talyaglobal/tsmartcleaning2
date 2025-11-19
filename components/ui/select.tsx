'use client'

import * as React from 'react'

type SelectContextType = {
	value?: string
	displayValue?: string
	onValueChange?: (value: string) => void
	open: boolean
	setOpen: (open: boolean) => void
	setDisplayValue?: (value: string) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

type SelectProps = {
	value?: string
	onValueChange?: (value: string) => void
	children?: React.ReactNode
	placeholder?: string
}

export function Select({ value, onValueChange, children }: SelectProps) {
	const [open, setOpen] = React.useState(false)
	const [displayValue, setDisplayValue] = React.useState<string | undefined>(undefined)
	
	// Find display text from children when value is provided
	React.useEffect(() => {
		if (value && !displayValue && children) {
			const findDisplayText = (node: React.ReactNode): string | undefined => {
				if (React.isValidElement(node)) {
					// Check if this is a SelectItem by checking for value prop
					// SelectItem will always have a value prop
					if (node.props?.value === value && node.props.value !== undefined) {
						return typeof node.props.children === 'string' 
							? node.props.children 
							: React.Children.toArray(node.props.children).find(child => typeof child === 'string') as string | undefined
					}
					if (node.props?.children) {
						const result = findDisplayText(node.props.children)
						if (result) return result
					}
				} else if (Array.isArray(node)) {
					for (const child of node) {
						const result = findDisplayText(child)
						if (result) return result
					}
				}
				return undefined
			}
			const found = findDisplayText(children)
			if (found) setDisplayValue(found)
		}
	}, [value, displayValue, children])
	
	const contextValue = React.useMemo(() => ({ value, displayValue, onValueChange, open, setOpen, setDisplayValue }), [value, displayValue, onValueChange, open])
	
	return (
		<SelectContext.Provider value={contextValue}>
			<div className="relative">{children}</div>
		</SelectContext.Provider>
	)
}

export function SelectTrigger({
	children,
}: {
	children?: React.ReactNode
}) {
	const context = React.useContext(SelectContext)
	const [selectedValue, setSelectedValue] = React.useState<string | undefined>(context?.value)
	
	React.useEffect(() => {
		setSelectedValue(context?.value)
	}, [context?.value])
	
	return (
		<button
			type="button"
			data-select-trigger
			onClick={() => context?.setOpen(!context.open)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					context?.setOpen(!context.open)
				} else if (e.key === 'Escape' && context?.open) {
					e.preventDefault()
					context?.setOpen(false)
				}
			}}
			aria-haspopup="listbox"
			aria-expanded={context?.open}
			aria-label="Select option"
			className="w-full inline-flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
		>
			{children || <span className="text-gray-500">Select</span>}
		</button>
	)
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
	const context = React.useContext(SelectContext)
	const displayText = context?.displayValue || context?.value || placeholder || 'Select'
	return <span className={context?.value ? "text-gray-900" : "text-gray-500"}>{displayText}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
	const context = React.useContext(SelectContext)
	const contentRef = React.useRef<HTMLDivElement>(null)
	
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
				context?.setOpen(false)
			}
		}
		
		if (context?.open) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [context?.open])
	
	if (!context?.open) return null
	
	return (
		<div 
			ref={contentRef}
			role="listbox"
			aria-label="Select options"
			className="absolute z-50 mt-2 w-full rounded-md border border-gray-200 bg-white p-1 shadow-lg focus:outline-none"
			onKeyDown={(e) => {
				if (e.key === 'Escape') {
					context?.setOpen(false)
				}
			}}
		>
			{children}
		</div>
	)
}

export function SelectItem({
	value,
	children,
}: {
	value: string
	children: React.ReactNode
}) {
	const context = React.useContext(SelectContext)
	const displayText = typeof children === 'string' ? children : React.Children.toArray(children).filter(child => typeof child === 'string').join('') || String(children)
	
	return (
		<button
			type="button"
			role="option"
			aria-selected={context?.value === value}
			data-select-value={value}
			onClick={() => {
				context?.onValueChange?.(value)
				context?.setDisplayValue?.(displayText)
				context?.setOpen(false)
			}}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					context?.onValueChange?.(value)
					context?.setDisplayValue?.(displayText)
					context?.setOpen(false)
				}
			}}
			className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${context?.value === value ? 'bg-gray-50 font-medium' : ''}`}
		>
			{children}
		</button>
	)
}


