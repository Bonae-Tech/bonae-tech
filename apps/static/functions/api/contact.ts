interface Env {
  CF_ACCOUNT_ID: string;
  CF_EMAIL_TOKEN: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const referer = request.headers.get('Referer');
  const back = referer && new URL(referer).origin === url.origin ? new URL(referer).pathname : '/';
  const wantsJson = request.headers.get('Accept')?.includes('application/json');
  const redirect = (status: 'sent' | 'error') =>
    wantsJson
      ? Response.json({ ok: status === 'sent' }, { status: status === 'sent' ? 200 : 400 })
      : Response.redirect(`${url.origin}${back}?contact=${status}#contacto`, 303);

  const form = await request.formData();
  const name = String(form.get('name') ?? '').trim().slice(0, 200);
  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const phone = String(form.get('phone') ?? '').trim().slice(0, 50);
  const message = String(form.get('message') ?? '').trim().slice(0, 5000);

  if (!name || !phone || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return redirect('error');

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_EMAIL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: env.CONTACT_TO ?? 'bonaetech@gmail.com',
        from: { address: env.CONTACT_FROM ?? 'contacto@bonaetech.com', name: 'Bonae Tech Web' },
        reply_to: email,
        subject: `Nuevo contacto web: ${name}`,
        text: `Nombre: ${name}\nEmail: ${email}\nTeléfono: ${phone}\n\n${message}`,
        html: `<p><b>Nombre:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Teléfono:</b> ${esc(phone)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  } catch (err) {
    console.error('contact send failed', err);
    return redirect('error');
  }
  return redirect('sent');
};
