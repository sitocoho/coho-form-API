import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { forms } = req.body;

    let emailBody = "<h1>Nuovi dati dal form COHO</h1>";

    forms.forEach((form, index) => {
      emailBody += `
        <h2>Annuncio ${index + 1}</h2>
        <p><strong>Nome host:</strong> ${form.hostName}</p>
        <p><strong>Nome B&B:</strong> ${form.bnbName || "N/A"}</p>
        <p><strong>Indirizzo:</strong> ${form.address}</p>

        <h3>Check-in</h3>
        <p>${form.checkinInstructions}</p>

        <h3>Istruzioni stanza</h3>
        <p>${form.roomInstructions || "N/A"}</p>

        <h3>Regole della casa</h3>
        <p>${form.houseRules}</p>

        <h3>Servizi e dintorni</h3>
        <ul>${form.services.map(s => `<li>${s}</li>`).join("")}</ul>

        <h3>Wi-Fi</h3>
        <p><strong>Nome:</strong> ${form.wifiName}</p>
        <p><strong>Password:</strong> ${form.wifiPassword}</p>

        <h3>Check-out</h3>
        <p>${form.checkoutInstructions}</p>

        <h3>Consigli sulla città</h3>
        <p>${form.cityTips.intro || "N/A"}</p>

        <h4>Ristoranti</h4>
        <ul>${form.cityTips.restaurants.map(r => `<li><strong>${r.name}</strong>: ${r.comment}</li>`).join("")}</ul>

        <h4>Pub</h4>
        <ul>${form.cityTips.pubs.map(p => `<li><strong>${p.name}</strong>: ${p.comment}</li>`).join("")}</ul>

        <h4>Bar</h4>
        <ul>${form.cityTips.bars.map(b => `<li><strong>${b.name}</strong>: ${b.comment}</li>`).join("")}</ul>

        <h3>Piatti da non perdere</h3>
        <ul>${form.dishes.map(d => `<li>${d}</li>`).join("")}</ul>

        <h3>Tour consigliati</h3>
        ${form.tours.map(t => `<div><strong>${t.title}</strong><p>${t.description}</p></div>`).join("")}

        <hr/>
      `;
    });

    const emailResponse = await resend.emails.send({
      from: "COHO Form <onboarding@resend.dev>",
      to: ["sito.coho@gmail.com"],
      subject: `Nuova compilazione form COHO - ${forms.length} annuncio/i`,
      html: emailBody,
    });

    console.log("Email sent successfully:", emailResponse);

    return res.status(200).json({ success: true, data: emailResponse });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: error.message });
  }
}
