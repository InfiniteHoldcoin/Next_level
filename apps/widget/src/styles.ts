// Injected into the Shadow DOM via a <style> tag — fully scoped, no leakage in either direction.
export const WIDGET_CSS = `
  .nlw-root {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #1f2430;
    box-sizing: border-box;
  }
  .nlw-root *, .nlw-root *::before, .nlw-root *::after {
    box-sizing: border-box;
    font-family: inherit;
  }

  .nlw-launcher {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 56px;
    height: 56px;
    border-radius: 999px;
    border: none;
    background: #4f46e5;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
    z-index: 2147483000;
    transition: transform 0.15s ease;
  }
  .nlw-launcher:hover { transform: scale(1.05); }
  .nlw-launcher svg { width: 26px; height: 26px; }

  .nlw-panel {
    position: fixed;
    right: 24px;
    bottom: 92px;
    width: 360px;
    max-width: calc(100vw - 32px);
    height: 520px;
    max-height: calc(100vh - 140px);
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 2147483000;
  }

  .nlw-header {
    background: #4f46e5;
    color: #fff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .nlw-header-title {
    font-weight: 600;
    font-size: 14px;
  }
  .nlw-header-sub {
    font-size: 12px;
    opacity: 0.85;
    margin-top: 2px;
  }
  .nlw-close {
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 4px;
    display: flex;
    opacity: 0.85;
  }
  .nlw-close:hover { opacity: 1; }
  .nlw-close svg { width: 18px; height: 18px; }

  .nlw-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f8f9fb;
  }

  .nlw-empty {
    margin: auto;
    text-align: center;
    color: #6b7280;
    font-size: 13px;
    padding: 0 12px;
  }

  .nlw-row {
    display: flex;
  }
  .nlw-row.user { justify-content: flex-end; }
  .nlw-row.assistant { justify-content: flex-start; }

  .nlw-bubble {
    max-width: 78%;
    padding: 9px 12px;
    border-radius: 14px;
    font-size: 13.5px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .nlw-bubble.user {
    background: #4f46e5;
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .nlw-bubble.assistant {
    background: #eef0f4;
    color: #1f2430;
    border-bottom-left-radius: 4px;
  }
  .nlw-bubble.error {
    background: #fdecec;
    color: #b3261e;
  }

  .nlw-typing {
    display: inline-flex;
    gap: 3px;
    padding: 4px 2px;
  }
  .nlw-typing span {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #9ca3af;
    animation: nlw-bounce 1s infinite ease-in-out;
  }
  .nlw-typing span:nth-child(2) { animation-delay: 0.15s; }
  .nlw-typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes nlw-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-4px); opacity: 1; }
  }

  .nlw-footer {
    border-top: 1px solid #e5e7eb;
    padding: 10px;
    display: flex;
    gap: 8px;
    align-items: flex-end;
    background: #fff;
  }
  .nlw-textarea {
    flex: 1;
    resize: none;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 13.5px;
    max-height: 90px;
    min-height: 36px;
    outline: none;
  }
  .nlw-textarea:focus { border-color: #4f46e5; }

  .nlw-send {
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .nlw-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .nlw-send svg { width: 16px; height: 16px; }
`;
