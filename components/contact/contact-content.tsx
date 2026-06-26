'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  email: z.string().email('Email invalid'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subiectul este obligatoriu'),
  message: z.string().min(10, 'Mesajul trebuie să aibă cel puțin 10 caractere'),
});

type ContactForm = z.infer<typeof contactSchema>;

interface ContactContentProps {
  schedule?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function ContactContent({ schedule, phone, email, address }: ContactContentProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Mesajul a fost trimis! Vă vom răspunde în curând.');
    setSubmitted(true);
    reset();
  };

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
              Informații <span className="text-primary">Contact</span>
            </h2>
            <div className="space-y-6 mb-8">
              {[
                { icon: MapPin, label: 'Adresă', value: address },
                { icon: Phone, label: 'Telefon', value: phone, href: phone ? `tel:${phone}` : undefined },
                { icon: Mail, label: 'Email', value: email, href: email ? `mailto:${email}` : undefined },
                {
                  icon: Clock,
                  label: 'Program',
                  value: schedule || `Luni – Duminică: 07:30 – 00:00`,
                },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{label}</h3>
                    {href ? (
                      <a href={href} className="text-muted-foreground hover:text-primary transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-line">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative h-64 rounded-2xl overflow-hidden border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d683!2d27.3320657!3d44.1880948!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b018779d22a8f5%3A0x39b3724ef68e193f!2sRiver's%20Lounge!5e0!3m2!1sro!2sro!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="River's Lounge Location"
                className="absolute inset-0"
              />
            </div>
          </div>

          <div>
            {submitted ? (
              <Card className="border-primary/30">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="font-serif text-2xl font-bold mb-2">Mesaj Trimis!</h3>
                  <p className="text-muted-foreground mb-6">
                    Vă mulțumim! Echipa noastră vă va răspunde în cel mai scurt timp.
                  </p>
                  <Button onClick={() => setSubmitted(false)} variant="outline">
                    Trimite alt mesaj
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border">
                <CardContent className="p-6">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                    Trimite-ne un <span className="text-primary">Mesaj</span>
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nume</Label>
                        <Input id="name" {...register('name')} placeholder="Ion Popescu" />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} placeholder="email@exemplu.ro" />
                        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon (opțional)</Label>
                      <Input id="phone" {...register('phone')} placeholder="07xx xxx xxx" />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subiect</Label>
                      <Input id="subject" {...register('subject')} placeholder="Rezervare eveniment / Informații" />
                      {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="message">Mesaj</Label>
                      <Textarea id="message" {...register('message')} placeholder="Scrie mesajul tău aici..." rows={5} />
                      {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                      {isSubmitting ? 'Se trimite...' : 'Trimite Mesajul'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
