async function generateMessages(lead, openai, agency = {}) {
  const websiteStatus = lead.has_website
    ? `DA — kvaliteta: ${lead.website_quality}/10, mobilna verzija: ${lead.is_mobile_friendly ? 'DA' : 'NE'}`
    : 'NE — nema web stranicu uopće';

  const ownerName = agency.owner_name || 'Adria Dev';
  const agencyPhone = agency.phone || '';
  const agencyEmail = agency.email || '';

  const signatureLine =
    agencyPhone || agencyEmail
      ? `\n\n--\n${ownerName}${agencyPhone ? `\nTel: ${agencyPhone}` : ''}${agencyEmail ? `\n${agencyEmail}` : ''}`
      : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content: `Ti si stručnjak za prodajne poruke za digitalnu agenciju Adria Dev iz Hrvatske koja nudi izradu web stranica i SEO usluge.

Piši poruke na HRVATSKOM jeziku koje su:
- Personalizirane (spominji ime biznisa i grad)
- Prijateljske ali profesionalne
- EMAIL: max 180 riječi, subject koji potiče radoznalost
- WHATSAPP: max 80 riječi, casual, direktno
- Fokus na KORIST za klijenta, ne na hvaljenje agencije
- Bez generičnih fraza poput "nudimo Vam naše usluge"
- Soft CTA — "Javi se ako te zanima", ne "KUPI ODMAH"
- VAŽNO: U email_body NE stavljaj potpis, ime, telefon ili "[vaše ime]" — potpis se automatski dodaje na kraju.

Adria Dev nudi:
- Web stranice od 400€ (gotovo za 2-3 tjedna)
- SEO optimizacija — da te Google nađe kad te netko traži
- Google My Business optimizacija — besplatna ali moćna
- Online booking za salone i restorane
- Direktne booking stranice za apartmane (bez Airbnb provizije 15-20%)
- Mjesečno SEO održavanje — 100-200€/mj (recurring prihod!)

KLJUČNI PRODAJNI ARGUMENT — uvijek ga ubaci prirodno:
- Klijent NE plaća unaprijed ništa
- Adria Dev napravi stranicu i pošalje preview link
- Klijent vidi gotovu stranicu, tek onda plaća
- Nakon uplate stranica ide na njegovu domenu
- Nema rizika za klijenta — ili mu se sviđa ili ne plaća

Vrati SAMO validan JSON, ništa drugo:
{
  "email_subject": "...",
  "email_body": "...",
  "whatsapp_body": "..."
}`,
      },
      {
        role: 'user',
        content: `Biznis: ${lead.business_name}
Grad: ${lead.city}
Industrija: ${lead.industry}
Web stranica: ${websiteStatus}
Google ocjena: ${lead.google_rating} (${lead.google_reviews} recenzija)
Telefon: ${lead.phone || 'nije dostupan'}

Generiraj personaliziranu email i WhatsApp poruku (bez potpisa na kraju emaila).`,
      },
    ],
  });

  const raw = response.choices[0].message.content.trim();
  const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(clean);
  if (parsed.email_body && signatureLine) {
    parsed.email_body = parsed.email_body.trim() + signatureLine;
  }
  return parsed;
}

async function generateFollowUp(lead, followUpNumber, openai, agency = {}) {
  const ownerName = agency.owner_name || 'Adria Dev';
  const agencyPhone = agency.phone || '';
  const agencyEmail = agency.email || '';
  const signatureLine =
    agencyPhone || agencyEmail
      ? `\n\n--\n${ownerName}${agencyPhone ? `\nTel: ${agencyPhone}` : ''}${agencyEmail ? `\n${agencyEmail}` : ''}`
      : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content: `Ti si stručnjak za follow-up prodajne poruke za web agenciju Adria Dev.

Follow-up ${followUpNumber === 1 ? 'PRVI (nakon 7 dana)' : 'DRUGI I ZADNJI (nakon 14 dana)'}

Pravila:
- Kratko, casual, max 80 riječi
- Follow-up 1: "Samo da provjerim..." lagan, bez pritiska
- Follow-up 2: Blagi FOMO "Zadnji put se javljam, imamo još slobodnih termina u ožujku..."
- Uvijek: vidiš stranicu PRIJE nego platiš, nema rizika
- Nikad agresivno
- U email_body NE stavljaj potpis ili "[vaše ime]" — potpis se automatski dodaje.

Vrati SAMO JSON:
{"email_subject":"...","email_body":"...","whatsapp_body":"..."}`,
      },
      {
        role: 'user',
        content: `Biznis: ${lead.business_name}, ${lead.city}, ${lead.industry}. Ima web: ${lead.has_website ? 'DA' : 'NE'}. Follow-up broj: ${followUpNumber}`,
      },
    ],
  });
  const raw = response.choices[0].message.content.trim();
  const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(clean);
  if (parsed.email_body && signatureLine) {
    parsed.email_body = parsed.email_body.trim() + signatureLine;
  }
  return parsed;
}

module.exports = { generateMessages, generateFollowUp };
