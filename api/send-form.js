import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // --- CORS: permette richieste dal browser (in development/production)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, x-client-info, apikey, content-type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // ci aspettiamo JSON con { forms: [...] }
    const { forms } = req.body;

    // (Se vuoi supportare multipart/form-data in futuro, va gestito qui)
    let emailBody = "<h1>Nuovi dati dal form COHO</h1>";

    (forms || []).forEach((form, index) => {
      emailBody += `
        <h2>Annuncio ${index + 1}</h2>
        <p><strong>Nome host:</strong> ${form.hostName || "N/A"}</p>
        <p><strong>Nome B&B:</strong> ${form.bnbName || "N/A"}</p>
        <p><strong>Indirizzo:</strong> ${form.address || "N/A"}</p>
      `;

      // se ci sono immagini come URL (es. hostPhoto, checkinImage, tours[].imageUrl), le elenchiamo
      if (form.hostPhoto) emailBody += `<p><img src="${form.hostPhoto}" alt="host photo" style="max-width:300px"/></p>`;
      if (form.checkinImage) emailBody += `<p><img src="${form.checkinImage}" alt="checkin" style="max-width:300px"/></p>`;
      if (form.checkoutImage) emailBody += `<p><img src="${form.checkoutImage}" alt="checkout" style="max-width:300px"/></p>`;
      if (form.houseRulesImage) emailBody += `<p><img src="${form.houseRulesImage}" alt="house rules" style="max-width:300px"/></p>`;

      if (Array.isArray(form.tours) && form.tours.length) {
        emailBody += `<h3>Tours</h3>`;
        form.tours.forEach((t, i) => {
          emailBody += `<div><strong>${t.title || "Tour " + (i+1)}</strong><p>${t.description || ""}</p>`;
          if (t.imageUrl) emailBody += `<p><img src="${t.imageUrl}" alt="tour image" style="max-width:300px"/></p>`;
          emailBody += `</div>`;
        });
      }

      emailBody += `<hr/>`;
    });

    const emailResponse = await resend.emails.send({
      from: "COHO Form <onboarding@resend.dev>",
      to: ["sito.coho@gmail.com"],
      subject: `Nuova compilazione form COHO - ${forms ? forms.length : 0} annuncio/i`,
      html: emailBody,
    });

    console.log("Email sent successfully:", emailResponse);

    return res.status(200).json({ success: true, data: emailResponse });
  } catch (error) {
    console.error("Error in send-form:", error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}
