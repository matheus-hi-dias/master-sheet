export function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-main)] px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-5 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
            Master-Sheet
          </p>
          <h1 className="mt-2 text-3xl font-bold font-display text-[var(--color-gold)]">
            Dashboard (Minhas Fichas)
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Conectado na plataforma. Gerencie suas fichas, campanhas e sessões a
            partir daqui.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Fichas ativas
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-gold)]">
              0
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Campanhas
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-gold)]">
              0
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Sessões pendentes
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-gold)]">
              0
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-main)]">
            Próximos passos
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Sua conta está pronta. Crie sua primeira ficha, organize uma
            campanha ou convide o grupo.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4">
              <p className="font-medium">Criar ficha</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Comece montando um personagem para sua mesa.
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4">
              <p className="font-medium">Abrir campanha</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Estruture sessões, personagens e anotações do grupo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
