import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';

export const metadata = {
  title: "Politica de Confidențialitate | River's Lounge",
  description: "Cum colectăm, folosim și protejăm datele dvs. personale la River's Lounge.",
};

export default function ConfidentialitatePage() {
  return (
    <SiteLayout>
      <PageHero
        badge="Legal"
        title="Politica de Confidențialitate"
        subtitle="Ultima actualizare: ianuarie 2025"
        backgroundImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&h=600&fit=crop"
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 space-y-10 text-muted-foreground leading-relaxed">

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Operatorul de date</h2>
            <p>
              Operatorul de date cu caracter personal este River&apos;s Lounge SRL, cu sediul în
              Călărași, România. Ne puteți contacta la{' '}
              <a href="mailto:contact@riverslounge.ro" className="text-primary hover:underline">
                contact@riverslounge.ro
              </a>.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Datele colectate</h2>
            <p>Colectăm următoarele categorii de date personale:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nume și prenume</li>
              <li>Număr de telefon</li>
              <li>Adresă de email</li>
              <li>Date legate de rezervări (dată, oră, număr persoane, tip eveniment)</li>
              <li>Date legate de comenzi (produse comandate, adresă de livrare, valoare)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Scopul prelucrării</h2>
            <p>Datele dvs. sunt prelucrate în scopul:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestionării și confirmării rezervărilor</li>
              <li>Procesării și livrării comenzilor online</li>
              <li>Comunicării cu dvs. în legătură cu serviciile noastre</li>
              <li>Îmbunătățirii serviciilor oferite</li>
              <li>Respectării obligațiilor legale</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Temeiul legal</h2>
            <p>
              Prelucrarea datelor se bazează pe executarea unui contract (rezervare / comandă),
              pe consimțământul dvs. acolo unde este solicitat, și pe interesul legitim al
              River&apos;s Lounge de a-și desfășura activitatea. Prelucrăm datele în conformitate
              cu Regulamentul (UE) 2016/679 (GDPR).
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Perioada de Retenție a Datelor</h2>
            <p>
              Păstrăm datele dvs. personale conform următoarelor reguli, în conformitate cu principiul
              minimizării datelor din GDPR (Art. 5(1)(e)):
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-medium text-foreground">Tip date</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Perioadă retenție</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Motiv</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Conturi fără comenzi', '1 an de la ultima activitate', 'Minimizare date GDPR'],
                    ['Conturi cu comenzi', '2 ani de la ultima activitate', 'Referință operațională'],
                    ['Date comenzi (anonimizate)', '5 ani', 'Obligații fiscale și contabile'],
                    ['Date rezervări', '1 an după eveniment', 'Referință operațională'],
                    ['Preferințe cookies', '1 an', 'Consimțământ GDPR'],
                  ].map(([type, period, reason]) => (
                    <tr key={type}>
                      <td className="px-4 py-3 text-foreground">{type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{period}</td>
                      <td className="px-4 py-3 text-muted-foreground">{reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Notificare înainte de ștergere:</span> Cu 30 de zile înainte de ștergerea automată a contului, veți primi un email de notificare la adresa înregistrată.</p>
              <p><span className="font-medium text-foreground">Dreptul de a păstra contul:</span> Vă puteți loga oricând pe site pentru a reseta perioada de inactivitate și a evita ștergerea automată.</p>
              <p><span className="font-medium text-foreground">Ștergere imediată:</span> Puteți solicita ștergerea imediată a contului din <strong>Contul tău → Setări → Șterge contul</strong> sau prin email la{' '}
                <a href="mailto:renetrading@yahoo.com" className="text-primary hover:underline">renetrading@yahoo.com</a>.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Drepturile dvs.</h2>
            <p>În conformitate cu GDPR, aveți dreptul la:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acces la datele dvs. personale</li>
              <li>Rectificarea datelor inexacte</li>
              <li>Ștergerea datelor („dreptul de a fi uitat")</li>
              <li>Restricționarea prelucrării</li>
              <li>Portabilitatea datelor</li>
              <li>Opoziția față de prelucrare</li>
            </ul>
            <p>
              Pentru exercitarea acestor drepturi, contactați-ne la{' '}
              <a href="mailto:contact@riverslounge.ro" className="text-primary hover:underline">
                contact@riverslounge.ro
              </a>.
              Aveți de asemenea dreptul de a depune o plângere la Autoritatea Națională de
              Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Securitatea datelor</h2>
            <p>
              Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja datele dvs.
              împotriva accesului neautorizat, pierderii sau divulgării. Accesul la date este
              restricționat exclusiv personalului autorizat.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Transferul datelor</h2>
            <p>
              Nu vindem și nu cedăm datele dvs. personale către terți în scopuri comerciale.
              Datele pot fi transmise partenerilor de livrare sau furnizorilor de servicii IT
              strict în scopul executării comenzilor dvs., cu garanții adecvate de protecție.
            </p>
          </div>

        </div>
      </section>
    </SiteLayout>
  );
}
