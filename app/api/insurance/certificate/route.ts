import { NextResponse } from 'next/server'

// Very small placeholder PDF (valid but minimal) for MVP
function generateMinimalPdf(name: string) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 75 >>
stream
BT
/F1 18 Tf
72 720 Td
(CleanGuard Certificate - ${name}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000297 00000 n 
0000000475 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
582
%%EOF`
  return Buffer.from(content)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'Member'
  const pdf = generateMinimalPdf(name)
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="CleanGuard_Certificate_${name}.pdf"`,
    },
  })
}


