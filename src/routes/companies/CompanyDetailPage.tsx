import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/data/EmptyState'
import { LoadingRows } from '@/components/data/LoadingRows'
import { MoneyCell } from '@/components/data/MoneyCell'
import { COMPANY_STAGE_STYLE, GIFTING_STATUS_STYLE, StatusBadge } from '@/components/data/StatusBadge'
import { CompanyForm, type CompanyDraft } from '@/components/forms/CompanyForm'
import { ContactForm, type ContactDraft } from '@/components/forms/ContactForm'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteCompany, getCompany, updateCompany } from '@/lib/api/companies'
import { createContact, deleteContact, updateContact } from '@/lib/api/contacts'
import { formatDateShort } from '@/lib/dates'
import type { Contact, GiftingStatus, CompanyStage } from '@/types'
import type { Currency } from '@/lib/money'

export default function CompanyDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [contactDialog, setContactDialog] = useState<{ open: boolean; contact: Contact | null }>({
    open: false, contact: null,
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: company, isPending } = useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompany(id),
  })

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['company', id] })
    void queryClient.invalidateQueries({ queryKey: ['companies'] })
  }

  const save = useMutation({
    mutationFn: (draft: CompanyDraft) => updateCompany(id, draft),
    onSuccess: () => { refresh(); setEditing(false); toast.success('Marca actualizada.') },
    onError: (error: Error) => toast.error(error.message),
  })

  const remove = useMutation({
    mutationFn: () => deleteCompany(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Marca eliminada.')
      void navigate('/marcas')
    },
    onError: (error: Error) => {
      setConfirmDelete(false)
      toast.error(
        error.message.includes('dependen')
          ? 'No se puede borrar: la marca tiene campañas. Bórralas primero o deja la marca como prospecto.'
          : error.message,
      )
    },
  })

  const saveContact = useMutation({
    mutationFn: (draft: ContactDraft) =>
      contactDialog.contact
        ? updateContact(contactDialog.contact.id, id, draft)
        : createContact({ ...draft, company_id: id }),
    onSuccess: () => {
      refresh()
      setContactDialog({ open: false, contact: null })
      toast.success('Contacto guardado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const removeContact = useMutation({
    mutationFn: (contactId: string) => deleteContact(contactId),
    onSuccess: () => { refresh(); toast.success('Contacto eliminado.') },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isPending) return <LoadingRows rows={6} />
  if (!company) return <EmptyState message="No encontramos esa marca." />

  const stageStyle = COMPANY_STAGE_STYLE[company.stage as CompanyStage]

  return (
    <>
      <Link to="/marcas" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-plum">
        <ArrowLeft className="size-4" aria-hidden /> Marcas
      </Link>

      <PageHeader
        title={company.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge label={stageStyle.label} color={stageStyle.color} />
            {company.industry && <span>{company.industry}</span>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-plum">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" /> Editar</Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4 text-overdue" /> Eliminar
            </Button>
          </>
        }
      />

      {company.notes && (
        <p className="mb-6 max-w-prose rounded-lg border border-line bg-surface p-4 text-ink-muted">{company.notes}</p>
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-heading text-[20px]">Contactos</h2>
          <Button variant="outline" size="sm" onClick={() => setContactDialog({ open: true, contact: null })}>
            <Plus className="size-4" /> Agregar
          </Button>
        </div>
        {company.contacts.length === 0 ? (
          <EmptyState message="Sin contactos. Agrega al menos uno para la cotización." />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {company.contacts.map((contact) => (
              <li key={contact.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-medium">
                    {contact.name}
                    {contact.is_primary && <Star className="size-3.5 fill-pending text-pending" aria-label="Principal" />}
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {[contact.role, contact.email, contact.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Editar ${contact.name}`}
                  onClick={() => setContactDialog({ open: true, contact })}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Eliminar ${contact.name}`}
                  onClick={() => removeContact.mutate(contact.id)}>
                  <Trash2 className="size-4 text-overdue" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-[20px]">Campañas</h2>
        {company.campaigns.length === 0 ? (
          <EmptyState message="Esta marca todavía no tiene campañas." />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {company.campaigns.map((campaign) => (
              <li key={campaign.id}>
                <Link to={`/campanas/${campaign.id}`}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-2">
                  <span className="min-w-0 flex-1 font-heading text-[17px]">{campaign.name}</span>
                  {campaign.status && <StatusBadge label={campaign.status.name} color={campaign.status.color} />}
                  <span className="text-[13px] text-ink-muted">{formatDateShort(campaign.publish_date)}</span>
                  <MoneyCell amount={campaign.net_amount} currency={campaign.currency as Currency} strong />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-[20px]">Gifting</h2>
        {company.gifting.length === 0 ? (
          <EmptyState message="Sin envíos de producto registrados para esta marca." />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {company.gifting.map((item) => {
              const style = GIFTING_STATUS_STYLE[item.status as GiftingStatus]
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">{item.products ?? 'Sin descripción'}</span>
                  <StatusBadge label={style.label} color={style.color} />
                  <span className="text-[13px] text-ink-muted">{formatDateShort(item.received_at)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <CompanyForm open={editing} company={company} saving={save.isPending}
        onClose={() => setEditing(false)} onSave={(draft) => save.mutate(draft)} />

      <ContactForm open={contactDialog.open} contact={contactDialog.contact} saving={saveContact.isPending}
        onClose={() => setContactDialog({ open: false, contact: null })}
        onSave={(draft) => saveContact.mutate(draft)} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar “{company.name}”</AlertDialogTitle>
            <AlertDialogDescription>
              Se borran también sus contactos. Las campañas impiden el borrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
