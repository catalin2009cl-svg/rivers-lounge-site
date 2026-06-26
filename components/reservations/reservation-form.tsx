'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Users, MapPin, CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { eventTypes, reservationLocations } from '@/lib/mock-data';
import { toast } from 'sonner';
import { saveReservation } from '@/lib/actions/reservations';

const WHATSAPP_NUMBER = '40734642449';

const reservationSchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  email: z.string().email('Email invalid'),
  phone: z.string().min(10, 'Număr de telefon invalid'),
  date: z.string().min(1, 'Selectează o dată'),
  time: z.string().min(1, 'Selectează ora'),
  guests: z.string().min(1, 'Indică numărul de persoane'),
  eventType: z.string().optional(),
  message: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

function buildWhatsAppMessage(data: ReservationFormData, locationName: string): string {
  const lines = [
    'Rezervare noua Rivers Lounge',
    '',
    `- Locatie: ${locationName}`,
    `- Nume: ${data.name}`,
    `- Telefon: ${data.phone}`,
    `- Email: ${data.email}`,
    `- Data: ${new Date(data.date).toLocaleDateString('ro-RO')}`,
    `- Ora: ${data.time}`,
    `- Persoane: ${data.guests}`,
  ];
  if (data.eventType) {
    const et = eventTypes.find((e) => e.id === data.eventType);
    lines.push(`- Tip eveniment: ${et ? et.name : data.eventType}`);
  }
  if (data.message?.trim()) {
    lines.push(`- Mentiuni: ${data.message.trim()}`);
  }
  return lines.join('\n');
}

interface CurrentUser {
  name: string;
  email: string;
  phone?: string;
}

interface ReservationFormProps {
  currentUser?: CurrentUser;
}

export function ReservationForm({ currentUser }: ReservationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [location, setLocation] = useState<'restaurant' | 'cabin' | 'event'>('restaurant');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: currentUser?.name ?? '',
      email: currentUser?.email ?? '',
      phone: currentUser?.phone ?? '',
    },
  });

  const onSubmit = async (data: ReservationFormData) => {
    const locationName = reservationLocations.find((l) => l.id === location)?.name ?? location;
    const eventTypeName = data.eventType
      ? (eventTypes.find((e) => e.id === data.eventType)?.name ?? data.eventType)
      : '';

    // Save to internal history (best-effort — never blocks the WhatsApp flow)
    try {
      await saveReservation({
        name: data.name,
        phone: data.phone,
        email: data.email,
        date: data.date,
        time: data.time,
        guests: parseInt(data.guests, 10) || 1,
        location: locationName,
        eventType: eventTypeName,
        notes: data.message?.trim() ?? '',
      });
    } catch {
      // Intentionally ignored — the WhatsApp flow must still proceed
    }

    const message = buildWhatsAppMessage(data, locationName);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');

    toast.success('Rezervare trimisă! Vă vom contacta în curând.');
    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <Card className="max-w-lg mx-auto border-primary/30">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
              <h3 className="font-serif text-2xl font-bold">✅ Solicitarea ta a fost trimisă!</h3>
              <p className="text-muted-foreground">
                Vă vom contacta în curând pentru confirmare.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Poți urmări statusul rezervării în contul tău.
                </p>
                <Link
                  href="/cont/rezervari"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-semibold"
                >
                  📅 Vezi rezervările mele →
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Dacă fereastra WhatsApp nu s-a deschis automat,{' '}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  apăsați aici
                </a>
                .
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Fă o altă rezervare
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-4xl px-4 lg:px-8">
        <Tabs value={location} onValueChange={(v) => setLocation(v as typeof location)}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            {reservationLocations.map((loc) => (
              <TabsTrigger key={loc.id} value={loc.id} className="text-xs sm:text-sm">
                {loc.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {reservationLocations.map((loc) => (
            <TabsContent key={loc.id} value={loc.id}>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-serif">{loc.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{loc.description}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nume complet *</Label>
                        <Input id="name" {...register('name')} placeholder="Ion Popescu" />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefon *</Label>
                        <Input id="phone" {...register('phone')} placeholder="07xx xxx xxx" />
                        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" {...register('email')} placeholder="email@exemplu.ro" />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="guests">Număr persoane *</Label>
                        <Input id="guests" type="number" min="1" {...register('guests')} placeholder="4" />
                        {errors.guests && <p className="text-xs text-destructive mt-1">{errors.guests.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="date">Data *</Label>
                        <Input id="date" type="date" {...register('date')} />
                        {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="time">Ora *</Label>
                        <Input id="time" type="time" {...register('time')} />
                        {errors.time && <p className="text-xs text-destructive mt-1">{errors.time.message}</p>}
                      </div>
                    </div>

                    {(location === 'event' || location === 'cabin') && (
                      <div>
                        <Label>Tip eveniment</Label>
                        <Select onValueChange={(v) => setValue('eventType', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează tipul evenimentului" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.icon} {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="message">Mesaj (opțional)</Label>
                      <Textarea
                        id="message"
                        {...register('message')}
                        placeholder="Detalii suplimentare despre rezervare..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-500 shrink-0" />
                        După trimitere, veți fi redirecționat către WhatsApp pentru confirmare.
                      </p>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <CalendarDays className="h-4 w-4" />
                        {isSubmitting ? 'Se trimite...' : 'Trimite Rezervarea'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
          <Card className="p-4 border-border text-center">
            <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Locație</p>
            <p className="text-xs text-muted-foreground">Călărași, România</p>
          </Card>
          <Card className="p-4 border-border text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Capacitate</p>
            <p className="text-xs text-muted-foreground">2 - 150 persoane</p>
          </Card>
          <Card className="p-4 border-border text-center">
            <CalendarDays className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Confirmare</p>
            <p className="text-xs text-muted-foreground">Răspuns în 24h</p>
          </Card>
        </div>

        {location === 'cabin' && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Vezi și{' '}
            <Link href="/cabana" className="text-primary hover:underline">
              pachetele Cabana Rivers
            </Link>{' '}
            pentru evenimente speciale.
          </p>
        )}
      </div>
    </section>
  );
}
