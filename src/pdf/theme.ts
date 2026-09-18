import { Font, StyleSheet } from '@react-pdf/renderer'
import FrauncesMedium from '@/pdf/fonts/Fraunces-Medium.ttf'
import FrauncesRegular from '@/pdf/fonts/Fraunces-Regular.ttf'
import InstrumentBold from '@/pdf/fonts/InstrumentSans-Bold.ttf'
import InstrumentRegular from '@/pdf/fonts/InstrumentSans-Regular.ttf'
import InstrumentSemiBold from '@/pdf/fonts/InstrumentSans-SemiBold.ttf'

/**
 * react-pdf usa fontkit, que sólo lee TTF/OTF (no woff2), y con un variable
 * tomaría su instancia por defecto —en Fraunces, wght 900 / opsz 9—. Por eso
 * estos archivos son instancias estáticas generadas con fonttools.
 */
Font.register({
  family: 'Fraunces',
  fonts: [
    { src: FrauncesRegular, fontWeight: 400 },
    { src: FrauncesMedium, fontWeight: 500 },
  ],
})

Font.register({
  family: 'Instrument Sans',
  fonts: [
    { src: InstrumentRegular, fontWeight: 400 },
    { src: InstrumentSemiBold, fontWeight: 600 },
    { src: InstrumentBold, fontWeight: 700 },
  ],
})

// Sin guionado: en español parte las palabras en lugares raros.
Font.registerHyphenationCallback((word) => [word])

export const PDF_COLORS = {
  ink: '#2A2320',
  muted: '#8B8079',
  line: '#E3D9CE',
  plum: '#6B2D4F',
  sage: '#7E9276',
  sageSoft: '#EDF1EB',
  surface: '#FFFFFF',
} as const

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: 'Instrument Sans',
    fontSize: 10,
    color: PDF_COLORS.ink,
    backgroundColor: PDF_COLORS.surface,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandName: { fontFamily: 'Fraunces', fontWeight: 500, fontSize: 26, lineHeight: 1.1 },
  brandHandle: { color: PDF_COLORS.muted, fontSize: 10, marginTop: 4 },
  logo: { width: 72, height: 72, objectFit: 'contain' },
  rule: { height: 1, backgroundColor: PDF_COLORS.plum, marginTop: 16, marginBottom: 16 },
  ruleSoft: { height: 1, backgroundColor: PDF_COLORS.line, marginVertical: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { color: PDF_COLORS.muted, fontSize: 9 },
  metaValue: { fontSize: 11, fontWeight: 600, marginTop: 2 },
  sectionTitle: { fontSize: 9, color: PDF_COLORS.muted, marginBottom: 4 },
  toName: { fontFamily: 'Fraunces', fontWeight: 500, fontSize: 16 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.plum,
    paddingBottom: 6,
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.line,
    paddingVertical: 8,
  },
  th: { fontSize: 9, color: PDF_COLORS.muted, fontWeight: 600 },
  colDescription: { flex: 1, paddingRight: 8 },
  colQty: { width: 54, textAlign: 'right' },
  colPrice: { width: 84, textAlign: 'right' },
  colTotal: { width: 92, textAlign: 'right' },
  itemName: { fontSize: 11 },
  itemNote: { fontSize: 9, color: PDF_COLORS.muted, marginTop: 2 },
  totalBox: {
    marginTop: 14,
    marginLeft: 'auto',
    width: 240,
    backgroundColor: PDF_COLORS.sageSoft,
    borderLeftWidth: 2,
    borderLeftColor: PDF_COLORS.sage,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 10, color: PDF_COLORS.muted },
  totalValue: { fontFamily: 'Fraunces', fontWeight: 500, fontSize: 18 },
  terms: { marginTop: 22 },
  termsText: { fontSize: 10, marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.line,
    paddingTop: 8,
    fontSize: 8,
    color: PDF_COLORS.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
