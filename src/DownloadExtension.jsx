
import "./DownloadExtension.css";

export default function DownloadExtension() {
  return (
    <section id="download-extension"
  className="download-section">
      <div className="download-icon">✉</div>

      <h2>Meet MailMuse for Gmail</h2>

      <p>
        Write smarter email replies with AI, directly inside Gmail.
        Download the extension and get started for free.
      </p>

      <a
        className="download-button"
        href="/downloads/MailMuse-Extension.zip"
        download="MailMuse-Extension.zip"
      >
        <span>↓</span> Download for Chrome
      </a>

      <small>
        Chrome extension · Free to download
      </small>

      <div className="install-hint">
        After downloading, extract the ZIP, open{" "}
        <code>chrome://extensions</code>, enable Developer mode,
        and select Load unpacked.
      </div>
    </section>
  );
}
