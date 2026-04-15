export default function UrgencyBanner() {
  return (
    <div className="max-w-6xl mx-auto px-5 pb-6">
      <div className="border-l-4 border-brand-gold bg-brand-gold/5 rounded-r-xl py-4 px-6">
        <p className="text-sm md:text-base">
          <span className="font-semibold text-brand-gold">
            &#9889; Estamos tomando proyectos para este mes.
          </span>{' '}
          <span className="text-brand-muted">
            Los turnos de instalaci&oacute;n se ocupan r&aacute;pido. Consult&aacute;
            hoy para no perder la fecha que te conviene.
          </span>
        </p>
      </div>
    </div>
  )
}
