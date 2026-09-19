import { PDFViewer } from '@react-pdf/renderer'
import { QuotePdf, type QuotePdfData } from '@/pdf/QuotePdf'

/** Componente aparte para que `React.lazy` pueda dejar react-pdf fuera del bundle inicial. */
export default function QuotePreview({ data }: { data: QuotePdfData }) {
  return (
    <PDFViewer style={{ width: '100%', height: '70vh', border: 'none' }} showToolbar={false}>
      <QuotePdf data={data} />
    </PDFViewer>
  )
}
