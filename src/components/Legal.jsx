const UPDATED = '30 October 2026';

function Shell({ title, updated, children }) {
  return (
    <main className="relative z-10 bg-graphite min-h-screen">
      <nav className="sticky top-0 z-40 bg-base/90 backdrop-blur-md border-b border-line">
        <div className="flex items-center justify-between gap-4 px-4 md:px-12 py-3 max-w-5xl mx-auto">
          <a href="/" className="flex items-center gap-3">
            <img src="/images/logo-gold.webp" alt="Diamond Palace Pvt. Ltd. — home" className="h-11 w-auto" width="420" height="279" />
          </a>
          <a href="/" className="text-[0.7rem] tracking-[0.22em] uppercase text-mute transition-colors hover:text-signal">← Back to site</a>
        </div>
      </nav>

      <div className="px-3 sm:px-6 md:px-12 py-8 sm:py-14">
        <article className="panel-surface max-w-4xl mx-auto p-5 sm:p-8 md:p-12">
          <p className="flex items-center gap-3.5 mb-4 text-[0.64rem] tracking-[0.42em] uppercase text-mute">
            <span className="hallmark" aria-hidden="true" />
            <span>Legal</span>
            <span className="flex-1 h-px bg-line" aria-hidden="true" />
          </p>
          <h1 className="font-display font-semibold text-text text-[clamp(1.9rem,4.6vw,2.9rem)]">{title}</h1>
          <p className="mt-3 font-mono text-[0.68rem] tracking-[0.24em] uppercase text-signal">Last updated · {updated}</p>
          <div className="mt-8 space-y-8">{children}</div>

          <div className="mt-12 pt-8 border-t border-line flex flex-wrap gap-3">
            <a href="/" className="btn-ghost">← Back to Diamond Palace Pvt. Ltd.</a>
            <a href="mailto:dppl2080@gmail.com" className="btn-ghost">dppl2080@gmail.com</a>
          </div>
        </article>
      </div>

      <footer className="bg-[#080C14] border-t border-silver/[0.07] px-5 md:px-16 py-8">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-mute tracking-wide">© 2026 Diamond Palace Pvt. Ltd. · 5th Floor, Sasa Complex, New Road, Kathmandu</p>
          <p className="flex gap-5 text-xs text-mute tracking-wide">
            <a href="/privacy" className="transition-colors hover:text-signal">Privacy Policy</a>
            <a href="/terms" className="transition-colors hover:text-signal">Terms of Use</a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function Section({ heading, children }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-text text-[clamp(1.15rem,2.6vw,1.45rem)] mb-3">{heading}</h2>
      <div className="space-y-3 text-[0.95rem] leading-relaxed text-body/85">{children}</div>
    </section>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy Policy" updated={UPDATED}>
      <p className="text-[0.95rem] leading-relaxed text-body/85">
        This policy explains what information is collected when you visit dppl.com.np, why it is collected, and what
        choices you have. Diamond Palace Pvt. Ltd. operates a gold and silver bullion counter at Sasa Complex, New Road, Kathmandu. This website is
        an information, enquiry and quotation channel — it does not sell online, take payments, or hold customer accounts.
      </p>

      <Section heading="Information we collect">
        <p>
          <b className="text-text font-medium">We do not ask you to create an account, and there is no checkout or payment form on this site.</b>{' '}
          The only page that asks for personal details is the optional quotation form, described below. We never collect
          card or bank details.
        </p>
        <p>
          Like almost all websites, our hosting provider (Cloudflare) records standard technical data for every visit —
          IP address, browser and device type, referring page, and the time of the request. This is used to serve the
          site, keep it secure, and defend against abuse.
        </p>
        <p>
          If you contact us by WhatsApp, phone, or email using the links on this site, we receive whatever you choose to
          send: your phone number or email address, and the content of your message. We use that information only to
          answer your enquiry and, where an order follows, to prepare your invoice as Nepali law requires.
        </p>
      </Section>

      <Section heading="Cookies and similar technologies">
        <p>
          A cookie is a small file placed on your device by a website. Diamond Palace Pvt. Ltd. does not set any cookies of its own for
          tracking or profiling, and the site works fully without them.
        </p>
        <p>
          However, third parties whose services appear on this site may set cookies in your browser, as described below.
          You can block or delete cookies at any time in your browser settings; doing so will not prevent you from using
          this site.
        </p>
      </Section>

      <Section heading="Advertising — Google AdSense">
        <p>
          This site displays advertising served by Google. Third-party vendors, including Google, use cookies to serve
          ads based on your prior visits to this and other websites.
        </p>
        <p>
          Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this
          site and/or other sites on the Internet. You may opt out of personalised advertising by visiting{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-signal border-b border-signal/50 hover:border-signal">Google Ads Settings</a>.
          You can also opt out of a third-party vendor's use of cookies for personalised advertising at{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-signal border-b border-signal/50 hover:border-signal">aboutads.info</a>.
        </p>
        <p>
          Third-party ad servers or ad networks may use cookies, JavaScript, or web beacons in the advertisements shown
          on this site. They receive your IP address automatically when this occurs. Diamond Palace Pvt. Ltd. has no access to or control
          over cookies used by third-party advertisers.
        </p>
      </Section>

      <Section heading="Analytics">
        <p>
          We may use privacy-respecting analytics to understand how many people visit the site and which pages are read,
          in aggregate. This tells us, for example, that the daily price page is popular — it does not tell us who you
          are. We do not sell or share analytics data.
        </p>
      </Section>

      <Section heading="Live price data">
        <p>
          The silver rates shown on this site are fetched by our server from the published Kathmandu bullion market
          reference. Your browser requests the rate from us; no information about you is sent to any rate provider.
        </p>
      </Section>

      <Section heading="Maps">
        <p>
          Our location is displayed using map tiles from OpenStreetMap and CARTO. When the map loads, those providers
          receive the request needed to deliver the map imagery, including your IP address. Following our Google Maps
          link takes you to Google, where Google's own privacy policy applies.
        </p>
      </Section>

      <Section heading="Quotation requests">
        <p>
          If you use the quotation form at <a className="text-gold underline underline-offset-4" href="/quotation">dppl.com.np/quotation</a>, we ask for your
          customer type, PAN number, name (or registered business name and contact person), contact number and address,
          together with the products you choose. We need these details to prepare a quotation in your name, as a PAN-based
          invoice would later require.
        </p>
        <p>
          While you fill in the form, your answers are kept in your own browser for that tab only. When you send or download
          the quotation, the details and the calculated price are stored on our hosting provider (Cloudflare) so that the
          PDF can be produced. The PDF is reached through a long random link; anyone who has that link can open it, so
          share it only with us. Stored quotations are deleted automatically after 180 days.
        </p>
        <p>
          We use quotation details only to respond to your request and, if you go on to buy, to prepare your invoice. They
          are never used for marketing or shared with anyone else. To have a quotation deleted sooner, contact us with its
          quotation number.
        </p>
      </Section>

      <Section heading="How long we keep enquiry information">
        <p>
          Messages you send us are kept only as long as needed to serve you, and quotation requests for 180 days. Invoices and transaction records are
          retained as required by Nepali tax and accounting law. We do not build marketing profiles, and we do not sell,
          rent, or trade your information to anyone.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          This site is intended for adults transacting in bullion and is not directed at children. We do not knowingly
          collect information from children. If you believe a child has sent us information, please contact us and we
          will delete it.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can browse this site without contacting us or identifying yourself. You may block cookies in your browser,
          opt out of personalised ads through the links above, and ask us to delete any enquiry correspondence we hold
          by emailing dppl2080@gmail.com.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If this policy changes, the revised version will be posted on this page with a new "last updated" date.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Diamond Palace Pvt. Ltd. · 5th Floor, Sasa Complex, New Road, Kathmandu 44600, Nepal<br />
          Counter: 01-5915052 · Mobile: +977 980-561-7932 · Email: dppl2080@gmail.com
        </p>
      </Section>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of Use" updated={UPDATED}>
      <p className="text-[0.95rem] leading-relaxed text-body/85">
        These terms govern your use of dppl.com.np. By using the site, you accept them.
      </p>

      <Section heading="About this site">
        <p>
          This website provides information about Diamond Palace Pvt. Ltd. and publishes the daily silver rate for reference. It is not an
          online shop: no purchase, sale, payment, or reservation can be completed through this site. All transactions
          take place in person at our counter on New Road, Kathmandu.
        </p>
      </Section>

      <Section heading="Prices shown">
        <p>
          Gold and silver rates published here are drawn from the Kathmandu bullion market reference and are provided
          for information only. They are indicative — the rate applied to any transaction is the rate confirmed at the
          counter at the time of that transaction.
        </p>
        <p>
          <b className="text-text font-medium">Gold bars are priced by weight at the published gold rate plus a fixed making charge per bar; silver bars and coins follow the published silver rate by weight plus a minimal making charge</b>.
          Any making charge is added at the counter and itemised on your invoice. Rates may change during the day and can be
          affected by market movement.
        </p>
      </Section>

      <Section heading="Online quotations">
        <p>
          A quotation from the online form is an estimate only. <b className="text-text font-medium">It is not a booking, an order confirmation or an invoice</b>,
          and it does not reserve stock. It is calculated from the quotation rates our staff set for the day, which can differ
          from the indicative market rate shown on the homepage and can change during the day. The price that applies to a
          purchase is the one confirmed at the counter at the time of sale.
        </p>
        <p>
          Quotations list each product, the making charge on gold products (a fixed amount per piece) and on silver products (a percentage), and, for personal customers, a skill
          promotion fee where it applies. Products shown as out of stock cannot be quoted.
        </p>
      </Section>

      <Section heading="No investment advice">
        <p>
          Nothing on this site is investment, financial, tax, or legal advice. Articles are general information about
          silver and its history. The value of precious metals can fall as well as rise. You are responsible for your own
          decisions, and you should seek independent professional advice where appropriate.
        </p>
      </Section>

      <Section heading="Products and purchases">
        <p>
          Bullion sold by Diamond Palace Pvt. Ltd. is 24-carat (999.9) gold or 999 fine silver, weighed on calibrated scales in the presence of the customer and
          supplied with a full VAT invoice. Availability of any weight or format is subject to stock at the time of
          purchase. We buy back documented bullion we have sold at the purchase rate published on the day of the
          buy-back.
        </p>
      </Section>

      <Section heading="Accuracy and availability">
        <p>
          We take care to keep this site accurate and available, but we do not guarantee that it will be uninterrupted,
          error-free, or that published rates will always reflect the latest market movement. The site is provided on an
          "as is" basis, and Diamond Palace Pvt. Ltd. is not liable for loss arising from reliance on information published here.
        </p>
      </Section>

      <Section heading="Intellectual property">
        <p>
          The Diamond Palace Pvt. Ltd. name, seal, site text, images, and design are the property of Diamond Palace Pvt. Ltd. and may not be copied or reproduced
          without permission. Map data is © OpenStreetMap contributors and CARTO.
        </p>
      </Section>

      <Section heading="External links and advertising">
        <p>
          This site links to third-party services such as WhatsApp and Google Maps, and displays third-party advertising.
          Diamond Palace Pvt. Ltd. does not control and is not responsible for the content, products, or practices of those third parties.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of Nepal, and any dispute arising from use of this site is subject to the
          jurisdiction of the courts of Kathmandu.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Diamond Palace Pvt. Ltd. · 5th Floor, Sasa Complex, New Road, Kathmandu 44600, Nepal<br />
          Counter: 01-5915052 · Mobile: +977 980-561-7932 · Email: dppl2080@gmail.com
        </p>
      </Section>
    </Shell>
  );
}

export function NotFound() {
  return (
    <Shell title="Page not found" updated={UPDATED}>
      <p className="text-[0.95rem] leading-relaxed text-body/85">
        The page you were looking for is not here — it may have been moved, or the address may be slightly off.
        Everything on this site is reachable from the links below.
      </p>

      <Section heading="Where to go next">
        <ul className="space-y-3">
          <li><a href="/" className="text-signal border-b border-signal/50 hover:border-signal">Today&rsquo;s silver price</a> — the day&rsquo;s sale and purchase rates</li>
          <li><a href="/#products" className="text-signal border-b border-signal/50 hover:border-signal">Silver bars and grains</a> — 999 fine, 100 g to 1 kg</li>
          <li><a href="/articles" className="text-signal border-b border-signal/50 hover:border-signal">The DPPL Journal</a> — how silver is priced, verified and stored</li>
          <li><a href="/#contact" className="text-signal border-b border-signal/50 hover:border-signal">Contact and directions</a> — Sasa Complex, New Road</li>
        </ul>
      </Section>

      <Section heading="Still stuck?">
        <p>
          Call the counter on <a href="tel:+97715915052" className="text-signal">01-5915052</a>, message us on
          WhatsApp at <a href="tel:+9779805617932" className="text-signal">+977 980-561-7932</a>, or email
          <a href="mailto:dppl2080@gmail.com" className="text-signal"> dppl2080@gmail.com</a>.
        </p>
      </Section>
    </Shell>
  );
}
