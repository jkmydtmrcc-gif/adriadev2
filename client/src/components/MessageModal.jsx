import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export function MessageModal({ lead, onClose }) {
  return (
    <Dialog.Root open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-bg-surface border border-border rounded-xl shadow-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="font-heading font-semibold text-lg text-text-primary">
              {lead?.business_name} — poruke
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-lg hover:bg-bg-elevated text-text-muted">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          {lead && (
            <div className="space-y-4 text-sm">
              {(lead.sent_at || lead.sent_from_domain) && (
                <div className="text-xs text-text-muted">
                  {lead.sent_at && <span>Poslano: {new Date(lead.sent_at).toLocaleString('hr-HR', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                  {lead.sent_from_domain && <span className="ml-2">S računa: {lead.sent_from_domain}</span>}
                </div>
              )}
              <div>
                <p className="text-text-muted mb-1">Subject</p>
                <p className="text-text-primary font-medium">{lead.email_subject || '—'}</p>
              </div>
              <div>
                <p className="text-text-muted mb-1">Email body</p>
                <pre className="whitespace-pre-wrap text-text-secondary bg-bg-elevated p-3 rounded-lg max-h-40 overflow-y-auto">
                  {lead.email_body || '—'}
                </pre>
              </div>
              <div>
                <p className="text-text-muted mb-1">WhatsApp</p>
                <pre className="whitespace-pre-wrap text-text-secondary bg-bg-elevated p-3 rounded-lg max-h-32 overflow-y-auto">
                  {lead.whatsapp_body || '—'}
                </pre>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
