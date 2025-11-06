import { Resend } from "resend";

export default async function handler(req, res) {
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
        <h3>Wi-Fi</h3>
        <p><strong>Nome:</strong> ${form.wifiName}</p>
        <p><strong>Password:</strong> ${form.wifiPassword}</p>
        <h3>Check-out</h3>
        <p>${form.checkoutInstructions}</p>
        <hr/>
      `;
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = await resend.emails.send({
      from: "COHO Form <onboarding@resend.dev>",
      to: "sito.coho@gmail.com",
      subject: `Nuova compilazione form COHO - ${forms.length} annuncio/i`,
      html: emailBody,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Errore:", error);
    res.status(500).json({ error: error.message });
  }
}
