'use client';

import { useState } from 'react';

const FAQ = [
  {
    q: 'Cât costă înregistrarea?',
    a: 'Înregistrarea este complet gratuită. Nu există taxe ascunse sau abonamente de niciun fel.',
  },
  {
    q: 'Cum urc de nivel?',
    a: 'Fiecare comandă finalizată și plătită (livrare sau ridicare) se numără automat. Când atingi pragul unui nivel — 10, 20, 35, 50 sau 75 de comenzi — primești automat un cupon de reducere în contul tău.',
  },
  {
    q: 'Când expiră cupoanele?',
    a: 'Fiecare cupon este valabil 30 de zile de la emitere. Data exactă apare în secțiunea "Recompensele mele" din cont. Odată expirat, cuponul nu mai poate fi utilizat.',
  },
  {
    q: 'Pot cumula cuponul de fidelitate cu alte promoții?',
    a: 'Implicit, cupoanele de fidelitate nu se cumulează cu alte coduri promoționale. La checkout poți aplica un singur cupon odată.',
  },
  {
    q: 'Cum aflu dacă rezervarea mea a fost acceptată?',
    a: 'Statusul rezervării apare în timp real în contul tău la secțiunea "Rezervările Mele". Vei vedea instant când a fost acceptată sau dacă sunt mențiuni din partea noastră.',
  },
];

export function BeneficiiAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {FAQ.map((item, i) => (
        <div
          key={i}
          style={{
            background: open === i
              ? 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(201,168,76,0.02) 100%)'
              : '#0E0E0E',
            border: `1px solid ${open === i ? 'rgba(201,168,76,0.2)' : '#161616'}`,
            borderRadius:12,
            overflow:'hidden',
            transition:'border-color 0.2s ease, background 0.2s ease',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width:'100%', display:'flex', alignItems:'center',
              justifyContent:'space-between',
              padding:'18px 24px', textAlign:'left', gap:16,
              background:'none', border:'none', cursor:'pointer',
            }}
          >
            <span style={{
              color: open === i ? '#E0D4A0' : '#8A8480',
              fontSize:14, fontWeight:600, lineHeight:1.4,
              transition:'color 0.2s',
            }}>
              {item.q}
            </span>
            <span style={{
              color: open === i ? '#C9A84C' : '#2E2E2E',
              fontSize:18, fontWeight:300, flexShrink:0,
              transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
              transition:'transform 0.25s ease, color 0.2s ease',
              lineHeight:1,
            }}>
              +
            </span>
          </button>
          <div style={{
            maxHeight: open === i ? 200 : 0,
            overflow:'hidden',
            transition:'max-height 0.3s ease',
          }}>
            <p style={{
              padding:'0 24px 20px',
              color:'#4A4440', fontSize:13, lineHeight:1.7, margin:0,
            }}>
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
