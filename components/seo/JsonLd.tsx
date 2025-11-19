import Script from 'next/script'

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>
  id?: string
}

/**
 * Component to inject JSON-LD structured data into the page
 */
export function JsonLd({ data, id }: JsonLdProps) {
  const jsonLd = Array.isArray(data) ? data : [data]

  return (
    <>
      {jsonLd.map((item, index) => (
        <Script
          key={id || `jsonld-${index}`}
          id={id || `jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}

