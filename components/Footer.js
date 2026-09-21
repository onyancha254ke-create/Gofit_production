export default function Footer() {
  return (
    <footer>
      <span className="logo">G<span>o</span>Fit</span>
      <div>
        <a href="/training">Training</a>
        <a href="/shop">Shop</a>
        <a href="/booking">Book</a>
      </div>
      <div>
        <a href="https://x.com/onyanchah0254" aria-label="X" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.6L4.5 22H1.3l8.1-9.3L1 2h7l4.9 6.1L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z"/></svg>
        </a>
        <a href="https://wa.me/qr/UTLSEJ4EQTG7A1" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 4 3.5.6.2 1 .4 1.3.5.6.2 1.1.1 1.5-.1.5-.2 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z"/></svg>
        </a>
        <a href="https://instagram.com/stoic_alpha" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>
        </a>
        <a href="https://tiktok.com/@thejudge254" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2h-3v13.2a3.1 3.1 0 1 1-2.2-3v-3.1a6.1 6.1 0 1 0 5.2 6V9.3a7.7 7.7 0 0 0 4.5 1.4V7.7A4.8 4.8 0 0 1 16.5 2Z"/></svg>
        </a>
      </div>
      <small>© {new Date().getFullYear()} GoFit. All rights reserved.</small>
    </footer>
  );
}
