import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export const MAPS_URL = 'https://maps.app.goo.gl/vi1fuUN78UcsuRTA7';
const DPPL = [27.7032447, 85.3111961];

export default function KathmanduMap({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    let map;
    let cancelled = false;
    (async () => {
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

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

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
    })();

    return () => { cancelled = true; if (map) map.remove(); };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} className="absolute inset-0 dppl-map" aria-label="Map — DPPL at Sasa Complex, New Road, Kathmandu" />
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
