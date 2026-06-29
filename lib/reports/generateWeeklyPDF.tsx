import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const GOLD = '#C9A84C';
const BG = '#0F0F0F';
const SURFACE = '#1A1A1A';
const MUTED = '#9A9490';

const styles = StyleSheet.create({
  page: { backgroundColor: BG, padding: 40, fontFamily: 'Helvetica', color: '#F0EDE6' },
  header: { marginBottom: 28 },
  headerTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 3 },
  headerSub: { fontSize: 10, color: MUTED, marginTop: 4 },
  weekLabel: { fontSize: 13, color: '#F0EDE6', marginTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GOLD, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, borderBottom: `1pt solid ${GOLD}`, paddingBottom: 4 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCard: { backgroundColor: SURFACE, borderRadius: 6, padding: '12 16', width: '46%', border: `0.5pt solid #2E2E2E` },
  kpiValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: GOLD },
  kpiLabel: { fontSize: 9, color: MUTED, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottom: `0.5pt solid #2E2E2E` },
  rowLabel: { fontSize: 10, color: '#F0EDE6', flex: 1 },
  rowValue: { fontSize: 10, color: GOLD, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40 },
  footerText: { fontSize: 9, color: MUTED, textAlign: 'center' },
});

interface WeeklyPDFData {
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  newCustomers: number;
  avgOrderValue: number;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  peakDay: string;
  peakHour: number;
  revenueByDay: Array<{ day: string; revenue: number; orders: number }>;
}

export async function generateWeeklyPDF(data: WeeklyPDFData): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RIVERS LOUNGE</Text>
          <Text style={styles.headerSub}>Raport Săptămânal — riverslounge.ro</Text>
          <Text style={styles.weekLabel}>{data.weekLabel}</Text>
        </View>

        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicatori Cheie</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.totalRevenue.toFixed(0)} RON</Text>
              <Text style={styles.kpiLabel}>Venit Total</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.totalOrders}</Text>
              <Text style={styles.kpiLabel}>Total Comenzi</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.completedOrders}</Text>
              <Text style={styles.kpiLabel}>Comenzi Livrate</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.avgOrderValue.toFixed(0)} RON</Text>
              <Text style={styles.kpiLabel}>Valoare Medie</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.newCustomers}</Text>
              <Text style={styles.kpiLabel}>Clienți Noi</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{data.cancelledOrders}</Text>
              <Text style={styles.kpiLabel}>Comenzi Anulate</Text>
            </View>
          </View>
        </View>

        {/* Peak info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vârf de activitate</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ziua cu cele mai multe comenzi</Text>
            <Text style={styles.rowValue}>{data.peakDay}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ora de vârf</Text>
            <Text style={styles.rowValue}>{data.peakHour}:00 – {data.peakHour + 1}:00</Text>
          </View>
        </View>

        {/* Revenue by day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vânzări pe Zi</Text>
          {data.revenueByDay.map((d) => (
            <View key={d.day} style={styles.row}>
              <Text style={styles.rowLabel}>{d.day}</Text>
              <Text style={[styles.rowValue, { color: '#9A9490', marginRight: 16, fontFamily: 'Helvetica' }]}>{d.orders} comenzi</Text>
              <Text style={styles.rowValue}>{d.revenue.toFixed(0)} RON</Text>
            </View>
          ))}
        </View>

        {/* Top products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Produse</Text>
          {data.topProducts.slice(0, 8).map((p, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.rowLabel, { color: MUTED, marginRight: 8, width: 16, flex: 0 }]}>{i + 1}.</Text>
              <Text style={[styles.rowLabel]}>{p.name}</Text>
              <Text style={[styles.rowValue, { color: '#9A9490', marginRight: 16, fontFamily: 'Helvetica' }]}>×{p.count}</Text>
              <Text style={styles.rowValue}>{p.revenue.toFixed(0)} RON</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            RIVERS LOUNGE CROWD SRL · Str. Dobrogei nr. 1, Călărași · riverslounge.ro
          </Text>
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
