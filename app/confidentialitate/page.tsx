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
        subtitle="Ultima actualizare: Iulie 2026"
        backgroundImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&h=600&fit=crop"
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 space-y-10 text-muted-foreground leading-relaxed">

          <div className="space-y-2 rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm">
            <p className="font-semibold text-foreground">POLITICA PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL</p>
            <p>riverslounge.ro | Ultima actualizare: Iulie 2026</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Operatorul de date</h2>
            <p>
              Operatorul de date cu caracter personal este <strong className="text-foreground">RIVERS LOUNGE CROWD SRL</strong>,
              cu sediul în Str. Dobrogei nr. 1, Călărași, România, înregistrată la Oficiul Registrului Comerțului
              sub nr. <strong className="text-foreground">J51/320/2013</strong>, cod unic de înregistrare{' '}
              <strong className="text-foreground">32126105</strong>.
            </p>
            <p>Ne puteți contacta la:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Email general:{' '}
                <a href="mailto:contact@riverslounge.ro" className="text-primary hover:underline">
                  contact@riverslounge.ro
                </a>
              </li>
              <li>
                Email GDPR:{' '}
                <a href="mailto:renetrading@yahoo.com" className="text-primary hover:underline">
                  renetrading@yahoo.com
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Datele colectate</h2>
            <p>Colectăm următoarele categorii de date personale:</p>

            <p className="font-medium text-foreground">La crearea contului:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nume și prenume</li>
              <li>Adresă de e-mail</li>
              <li>Număr de telefon</li>
              <li>Parolă (stocată criptat, nu în text clar)</li>
              <li>Dată de naștere (opțional)</li>
              <li>Avatar/fotografie profil (opțional)</li>
            </ul>

            <p className="font-medium text-foreground">La plasarea unei comenzi:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Adresă de livrare</li>
              <li>Produse comandate și valoarea comenzii</li>
              <li>Modalitate de plată (numerar sau card online)</li>
              <li>Geolocație (dacă este activată pe dispozitivul dvs.)</li>
            </ul>

            <p className="font-medium text-foreground">La efectuarea rezervărilor:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nume și prenume</li>
              <li>Număr de telefon</li>
              <li>Adresă de e-mail</li>
              <li>Dată, oră, număr persoane, tip eveniment</li>
            </ul>

            <p className="font-medium text-foreground">La utilizarea programului de fidelizare Rivers Lounge:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cod client unic (RL-XXXX)</li>
              <li>Istoric comenzi eligibile</li>
              <li>Nivel de fidelizare (1–8)</li>
              <li>Sold portofel electronic și istoric tranzacții</li>
              <li>Codul de referral utilizat la înregistrare (dacă este cazul)</li>
            </ul>

            <p className="font-medium text-foreground">Date tehnice (colectate automat):</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Adresa IP</li>
              <li>Tipul browserului și dispozitivului</li>
              <li>Pagini vizitate și ora accesării</li>
            </ul>

            <p className="font-medium text-foreground">La completarea formularului de cariere:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nume, prenume, e-mail, număr de telefon, CV</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Scopul prelucrării</h2>
            <p>Datele dvs. sunt prelucrate în scopul:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestionării și confirmării rezervărilor</li>
              <li>Procesării și livrării comenzilor online</li>
              <li>Administrării contului de client</li>
              <li>Administrării programului de fidelizare Rivers Lounge</li>
              <li>Comunicării cu dvs. în legătură cu serviciile noastre</li>
              <li>Îmbunătățirii serviciilor oferite</li>
              <li>Trimiterii de comunicări de marketing (doar cu consimțământul dvs.)</li>
              <li>Respectării obligațiilor legale</li>
              <li>Procesului de recrutare (doar pentru candidații la Cariere)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Temeiul legal</h2>
            <p>Prelucrarea datelor se bazează pe:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="text-foreground font-medium">Executarea unui contract (Art. 6(1)(b) GDPR)</span> — pentru comenzi, rezervări și gestionarea contului</li>
              <li><span className="text-foreground font-medium">Consimțământul dvs. (Art. 6(1)(a) GDPR)</span> — pentru marketing, cookies și programul de fidelizare</li>
              <li><span className="text-foreground font-medium">Interesul legitim (Art. 6(1)(f) GDPR)</span> — pentru securitatea platformei și îmbunătățirea serviciilor</li>
              <li><span className="text-foreground font-medium">Obligație legală (Art. 6(1)(c) GDPR)</span> — pentru păstrarea datelor fiscale și contabile</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Perioada de retenție a datelor</h2>
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
                    ['Date program fidelizare', 'Pe durata contului + 1 an', 'Referință operațională'],
                    ['Date candidaturi (Cariere)', '2 ani de la depunere', 'Recrutare'],
                    ['Preferințe cookies', '1 an', 'Consimțământ GDPR'],
                    ['Date tehnice (IP, navigare)', '3 ani', 'Securitate și statistici'],
                  ].map(([type, period, reason]) => (
                    <tr key={type}>
                      <td className="px-4 py-3 text-foreground">{type}</td>
                      <td className="px-4 py-3">{period}</td>
                      <td className="px-4 py-3">{reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm">
              <p>
                <span className="font-medium text-foreground">Notificare înainte de ștergere:</span>{' '}
                Cu 30 de zile înainte de ștergerea automată a contului, veți primi un email de notificare la adresa înregistrată.
              </p>
              <p>
                <span className="font-medium text-foreground">Dreptul de a păstra contul:</span>{' '}
                Vă puteți loga oricând pentru a reseta perioada de inactivitate.
              </p>
              <p>
                <span className="font-medium text-foreground">Ștergere imediată:</span>{' '}
                Puteți solicita ștergerea contului din <strong>Contul tău → Setări → Șterge contul</strong> sau prin email la{' '}
                <a href="mailto:renetrading@yahoo.com" className="text-primary hover:underline">
                  renetrading@yahoo.com
                </a>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Drepturile dvs.</h2>
            <p>În conformitate cu GDPR, aveți dreptul la:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="text-foreground font-medium">Acces</span> — să solicitați o copie a datelor pe care le deținem despre dvs.</li>
              <li><span className="text-foreground font-medium">Rectificare</span> — să solicitați corectarea datelor inexacte sau incomplete</li>
              <li><span className="text-foreground font-medium">Ștergere („dreptul de a fi uitat")</span> — să solicitați ștergerea datelor, în condițiile legii</li>
              <li><span className="text-foreground font-medium">Restricționarea prelucrării</span> — să limitați modul în care folosim datele dvs.</li>
              <li><span className="text-foreground font-medium">Portabilitatea datelor</span> — să primiți datele într-un format structurat și lizibil automat</li>
              <li><span className="text-foreground font-medium">Opoziție</span> — să vă opuneți prelucrării datelor în scop de marketing direct</li>
              <li><span className="text-foreground font-medium">Retragerea consimțământului</span> — în orice moment, fără a afecta legalitatea prelucrării anterioare</li>
            </ul>
            <p>
              Pentru exercitarea acestor drepturi, contactați-ne la{' '}
              <a href="mailto:renetrading@yahoo.com" className="text-primary hover:underline">
                renetrading@yahoo.com
              </a>. Vom răspunde în termen de 30 de zile.
            </p>
            <p>
              Aveți de asemenea dreptul de a depune o plângere la Autoritatea Națională de Supraveghere
              a Prelucrării Datelor cu Caracter Personal (ANSPDCP) —{' '}
              <a
                href="https://www.dataprotection.ro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.dataprotection.ro
              </a>.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Securitatea datelor</h2>
            <p>Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja datele dvs.:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criptarea parolelor (bcrypt)</li>
              <li>Conexiuni securizate HTTPS/SSL</li>
              <li>Acces restricționat la date exclusiv personalului autorizat</li>
              <li>Monitorizarea și auditarea accesului la sisteme</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Transferul datelor</h2>
            <p>
              Nu vindem și nu cedăm datele dvs. personale către terți în scopuri comerciale.
              Datele pot fi transmise către:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Parteneri de livrare (proprii sau externi) — exclusiv datele necesare livrării: nume, adresă, telefon</li>
              <li>Procesatori de plăți autorizați — pentru plățile online cu cardul (nu stocăm datele cardului)</li>
              <li>Furnizori de servicii IT și hosting — cu obligații contractuale de confidențialitate</li>
              <li>Autorități de stat — exclusiv când legislația impune acest lucru</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Cookies</h2>
            <p>
              riverslounge.ro utilizează cookies pentru funcționarea corectă a site-ului. La prima
              accesare, veți fi informați printr-un banner și vi se va solicita acordul.
            </p>
            <p>Tipuri de cookies utilizate:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="text-foreground font-medium">Cookies esențiale</span> — necesare funcționării site-ului (sesiune, coș de cumpărături, autentificare)</li>
              <li><span className="text-foreground font-medium">Cookies de performanță</span> — statistici anonime despre utilizarea site-ului</li>
              <li><span className="text-foreground font-medium">Cookies de marketing</span> — exclusiv cu acordul dvs. expres</li>
            </ul>
            <p>
              Puteți gestiona preferințele de cookies din setările browserului sau din banner-ul
              de cookies afișat pe site.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Protecția datelor minorilor</h2>
            <p>
              Serviciile riverslounge.ro nu sunt destinate persoanelor sub 18 ani. Nu colectăm
              în mod intenționat date de la minori. Dacă un părinte sau tutore identifică că un
              minor ne-a furnizat date personale, ne va contacta la{' '}
              <a href="mailto:renetrading@yahoo.com" className="text-primary hover:underline">
                renetrading@yahoo.com
              </a>{' '}
              pentru ștergerea imediată.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. Modificări ale politicii</h2>
            <p>
              Ne rezervăm dreptul de a actualiza prezenta politică. Versiunea actualizată va fi
              publicată pe riverslounge.ro cu indicarea datei ultimei modificări. Continuarea
              utilizării site-ului după publicarea modificărilor constituie acceptul noii versiuni.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">12. Contact</h2>
            <div className="rounded-xl border border-border bg-secondary/30 px-5 py-4 text-sm space-y-1.5">
              <p className="font-semibold text-foreground">RIVERS LOUNGE CROWD SRL</p>
              <p>Str. Dobrogei nr. 1, Călărași, România</p>
              <p>CUI: 32126105 | Nr. Reg. Com.: J51/320/2013</p>
              <p>
                Email GDPR:{' '}
                <a href="mailto:renetrading@yahoo.com" className="text-primary hover:underline">
                  renetrading@yahoo.com
                </a>
              </p>
              <p>
                Email general:{' '}
                <a href="mailto:contact@riverslounge.ro" className="text-primary hover:underline">
                  contact@riverslounge.ro
                </a>
              </p>
              <p>Website: riverslounge.ro</p>
              <p className="pt-1 text-muted-foreground/70">Ultima actualizare: Iulie 2026</p>
            </div>
          </div>

        </div>
      </section>
    </SiteLayout>
  );
}
