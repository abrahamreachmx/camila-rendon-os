import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { LoadingRows } from '@/components/data/LoadingRows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadBrandLogo } from '@/lib/api/invoices'
import { getSettings, updateSettings } from '@/lib/api/settings'

type Draft = {
  brand_name: string
  brand_handle: string
  brand_email: string
  brand_phone: string
  quote_footer: string
  quote_validity_days: number
  brand_logo_path: string | null
}

export function BrandTab() {
  const queryClient = useQueryClient()
  const { data: settings, isPending } = useQuery({ queryKey: ['settings'], queryFn: getSettings })
  const fileInput = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    if (!settings) return
    setDraft({
      brand_name: settings.brand_name,
      brand_handle: settings.brand_handle ?? '',
      brand_email: settings.brand_email ?? '',
      brand_phone: settings.brand_phone ?? '',
      quote_footer: settings.quote_footer ?? '',
      quote_validity_days: settings.quote_validity_days,
      brand_logo_path: settings.brand_logo_path,
    })
  }, [settings])

  const save = useMutation({
    mutationFn: () => updateSettings(draft!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Datos de la marca guardados.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const upload = useMutation({
    mutationFn: (file: File) => uploadBrandLogo(file),
    onSuccess: (path) => {
      setDraft((current) => (current ? { ...current, brand_logo_path: path } : current))
      toast.success('Logo subido. No olvides guardar.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isPending || !draft) return <LoadingRows rows={4} />

  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })

  return (
    <div className="max-w-[560px] space-y-5 rounded-lg border border-line bg-surface p-5">
      <p className="text-[13px] text-ink-muted">Esto es lo que aparece en la cabecera y el pie de los PDF.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand-name">Nombre</Label>
          <Input id="brand-name" value={draft.brand_name} onChange={(e) => set({ brand_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-handle">Usuario en redes</Label>
          <Input id="brand-handle" value={draft.brand_handle} onChange={(e) => set({ brand_handle: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-email">Correo de contacto</Label>
          <Input id="brand-email" type="email" value={draft.brand_email}
            onChange={(e) => set({ brand_email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-phone">Teléfono</Label>
          <Input id="brand-phone" value={draft.brand_phone} onChange={(e) => set({ brand_phone: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-footer">Pie de la cotización</Label>
        <Textarea id="quote-footer" rows={3} value={draft.quote_footer}
          onChange={(e) => set({ quote_footer: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="validity">Vigencia de la cotización (días)</Label>
        <Input id="validity" type="number" min={1} className="w-32" value={draft.quote_validity_days}
          onChange={(e) => set({ quote_validity_days: Number(e.target.value) })} />
      </div>

      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) upload.mutate(file) }} />
          <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? 'Subiendo…' : 'Subir logo'}
          </Button>
          <span className="text-[13px] text-ink-muted">
            {draft.brand_logo_path ? draft.brand_logo_path.split('/').pop() : 'Sin logo'}
          </span>
        </div>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending || draft.brand_name.trim().length < 2}>
        {save.isPending ? 'Guardando…' : 'Guardar'}
      </Button>
    </div>
  )
}
