function toDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createPoster({ title, subtitle, accent = '#7A2338', background = '#F8F3EE' }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="40" fill="url(#g)" />
      <circle cx="640" cy="150" r="120" fill="${accent}" opacity="0.12" />
      <circle cx="140" cy="640" r="180" fill="${accent}" opacity="0.08" />
      <text x="64" y="360" fill="#24181B" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">${title}</text>
      <text x="64" y="430" fill="#76676B" font-family="Arial, Helvetica, sans-serif" font-size="28">${subtitle}</text>
      <rect x="64" y="120" width="144" height="10" rx="5" fill="${accent}" />
    </svg>`;

  return toDataUri(svg);
}

function createAvatar({ name, accent = '#7A2338', background = '#F6E3E7' }) {
  const initial = name.slice(0, 1);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" rx="128" fill="${background}" />
      <circle cx="128" cy="128" r="112" fill="${accent}" opacity="0.12" />
      <text x="128" y="146" text-anchor="middle" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700">${initial}</text>
    </svg>`;

  return toDataUri(svg);
}

module.exports = {
  createPoster,
  createAvatar,
};
