import { useEffect, useRef } from 'react';

export const MAPS_URL = 'https://maps.app.goo.gl/5yAecqdMx1nu1hKc8';
const DPPL = [27.7032447, 85.3111961];

export default function KathmanduMap({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    let map;
    let cancelled = false;

    // Leaflet is ~150 KB and the map sits below the fold, so it is only
    // fetched once the container is close to the viewport
    const start = async () => {
      await import('leaflet/dist/leaflet.css');
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current || ref.current.dataset.init) return;
      ref.current.dataset.init = '1';

      map = L.map(ref.current, {
        center: DPPL,
        zoom: 18,
        zoomControl: true,
        scrollWheelZoom: false,          // no scroll-jacking; click map to enable
        attributionControl: true,
      });
      map.on('click', () => map.scrollWheelZoom.enable());

      /* Back to the previous dark-map design. CARTO's tiles now need a key, so
         the account key is used; it is a public, domain-restricted map key,
         which is how browser tiles work — it grants nothing but tile access.
         If the dark style is not available on this key the voyager style is
         used instead and darkened in CSS, so the map never comes up blank. */
      const KEY = 'cb1_2qgk_1_221faa526fce46dd4f05a577';
      const tileOpts = {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 20,
      };
      let layer = L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${KEY}`, tileOpts).addTo(map);

      let failures = 0;
      layer.on('tileerror', () => {
        if (++failures < 3 || cancelled) return;
        layer.off('tileerror');
        map.removeLayer(layer);
        document.documentElement.classList.add('map-voyager');
        layer = L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${KEY}`, tileOpts).addTo(map);
      });

      const icon = L.divIcon({
        className: '',
        html: `
          <div class="dppl-marker">
            <span class="dppl-pulse"></span>
            <span class="dppl-pulse dppl-pulse-2"></span>
            <span class="dppl-core"><span class="dppl-diamond"></span></span>
          </div>`,
        iconSize: [0, 0],
      });

      const marker = L.marker(DPPL, { icon, title: 'DPPL — Sasa Complex, New Road' }).addTo(map);
      marker.bindPopup(
        `<div class="dppl-pop">
           <p class="dppl-pop-tag">999 FINE SILVER</p>
           <h3>DPPL</h3>
           <p>5th Floor, Sasa Complex, New Road,<br/>Kathmandu 44600</p>
           <a href="${MAPS_URL}" target="_blank" rel="noopener noreferrer">Open in Google Maps →</a>
         </div>`,
        { closeButton: false, offset: [0, -14] }
      );
      marker.openPopup();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '400px' }
    );
    if (ref.current) io.observe(ref.current);

    return () => { cancelled = true; io.disconnect(); if (map) map.remove(); };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} role="img" aria-label="Map — DPPL at Sasa Complex, New Road, Kathmandu" className="absolute inset-0 dppl-map" />
      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 z-[500] inline-flex items-center gap-2 bg-[#0A1322]/85 backdrop-blur border border-gold/50 text-silverhi text-[0.68rem] tracking-[0.18em] uppercase px-4 py-2.5 rounded-full transition-colors hover:border-gold hover:text-gold shadow-lg"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        Google Maps
      </a>
    </div>
  );
}
