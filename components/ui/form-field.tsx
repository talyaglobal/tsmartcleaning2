'use client'

import * as React from 'react'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  hint?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Accessible form field wrapper that ensures proper label/input associations
 * and error message announcements for screen readers
 */
export function FormField({
  label,
  name,
  error,
  required = false,
  hint,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`
  const inputId = name

  // Build aria-describedby to include both hint and error
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={inputId}>
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required field">
            *
          </span>
        )}
      </Label>
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {children ? (
        React.cloneElement(children as React.ReactElement, {
          id: inputId,
          'aria-describedby': describedBy,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required ? 'true' : 'false',
        })
      ) : null}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-destructive flex items-center gap-1"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

interface FormInputProps extends React.ComponentProps<typeof Input> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

/**
 * Accessible input field with integrated label and error handling
 */
export function FormInput({
  label,
  name,
  error,
  hint,
  required,
  className,
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      name={name || ''}
      error={error}
      hint={hint}
      required={required}
    >
      <Input
        name={name}
        className={cn(error && 'border-destructive', className)}
        {...props}
      />
    </FormField>
  )
}

interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

/**
 * Accessible textarea field with integrated label and error handling
 */
export function FormTextarea({
  label,
  name,
  error,
  hint,
  required,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <FormField
      label={label}
      name={name || ''}
      error={error}
      hint={hint}
      required={required}
    >
      <Textarea
        name={name}
        className={cn(error && 'border-destructive', className)}
        {...props}
      />
    </FormField>
  )
}

interface FormFieldsetProps {
  legend: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Accessible fieldset for grouping related form fields
 */
export function FormFieldset({
  legend,
  description,
  children,
  className,
}: FormFieldsetProps) {
  const descriptionId = `fieldset-${legend.toLowerCase().replace(/\s+/g, '-')}-desc`
  
  return (
    <fieldset 
      className={cn('border border-border rounded-lg p-4 space-y-4', className)}
      aria-describedby={description ? descriptionId : undefined}
    >
      <legend className="text-lg font-semibold px-2 -ml-2">
        {legend}
      </legend>
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  )
}


