/**
 * SoulApp — root Lit element for the Soul AI web interface.
 *
 * Architecture inspired by opensoulai's app.ts LitElement component structure:
 * - LitElement as the root application shell
 * - Component-based rendering for each view (chat, trainer, habits, config)
 * - State managed via @state decorators
 * - SSE streaming for real-time faculty output display
 *
 * Fundamental design: Trigunatmaka consciousness (Manas + Buddhi + Sanskaras)
 * synthesized by Atman, as documented in the Soul AI philosophy.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { ChatMessage, ConfigResponse, AppTab } from "./types.js";
import { soulClient } from "./api/soul-client.js";
import "./components/chat-message.js";
import "./components/trainer-panel.js";
import "./components/habits-panel.js";
import "./components/config-panel.js";

function generateId(): string {
  return Math.random().toString(36).slice(2);
}

@customElement("soul-app")
export class SoulApp extends LitElement {
  @state() private tab: AppTab = "chat";
  @state() private messages: ChatMessage[] = [];
  @state() private draft = "";
  @state() private sending = false;
  @state() private connected = false;
  @state() private config?: ConfigResponse;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: var(--color-bg, #0d0d14);
      color: var(--color-text, #e8e8f0);
    }

    /* ── App header ─────────────────────────────── */
    .app-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px;
      height: 52px;
      border-bottom: 1px solid #1a1a2e;
      flex-shrink: 0;
      background: #0f0f1a;
    }

    .logo {
      font-size: 20px;
      letter-spacing: -0.5px;
    }

    .logo-text {
      font-size: 15px;
      font-weight: 600;
      color: #fbbf24;
      letter-spacing: 0.02em;
    }

    .logo-sub {
      font-size: 11px;
      color: #555544;
      margin-left: 2px;
    }

    .header-status {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #444466;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #f87171;
    }

    .status-dot.connected { background: #4ade80; }

    /* ── Nav tabs ───────────────────────────────── */
    .nav {
      display: flex;
      gap: 2px;
      padding: 8px 16px 0;
      border-bottom: 1px solid #1a1a2e;
      flex-shrink: 0;
      background: #0f0f1a;
    }

    .nav-tab {
      padding: 7px 16px;
      border-radius: 6px 6px 0 0;
      border: 1px solid transparent;
      border-bottom: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: #555577;
      transition: all 0.15s;
      position: relative;
      bottom: -1px;
    }

    .nav-tab:hover:not(.active) {
      color: #8888cc;
      background: #14142a;
    }

    .nav-tab.active {
      border-color: #1a1a2e;
      border-bottom-color: #0d0d14;
      background: #0d0d14;
      color: #c0c0e0;
    }

    /* Tab accent colors */
    .nav-tab[data-tab="chat"].active { color: #fbbf24; }
    .nav-tab[data-tab="trainer"].active { color: #fbbf24; }
    .nav-tab[data-tab="habits"].active { color: #4ade80; }
    .nav-tab[data-tab="config"].active { color: #c084fc; }

    /* ── Main content ───────────────────────────── */
    .main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ── Chat view ──────────────────────────────── */
    .chat-view {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      scroll-behavior: smooth;
    }

    .chat-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      gap: 16px;
      color: #333355;
    }

    .chat-empty-icon { font-size: 52px; }

    .chat-empty-title {
      font-size: 20px;
      font-weight: 600;
      color: #444466;
    }

    .chat-empty-subtitle {
      font-size: 14px;
      color: #333355;
      max-width: 380px;
      line-height: 1.6;
    }

    .faculty-legend {
      display: flex;
      gap: 16px;
      font-size: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    /* ── Chat input bar ─────────────────────────── */
    .input-bar {
      padding: 12px 20px 16px;
      border-top: 1px solid #1a1a2e;
      background: #0f0f1a;
      flex-shrink: 0;
    }

    .input-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      background: #13131f;
      border: 1px solid #2a2a45;
      border-radius: 12px;
      padding: 10px 12px;
      transition: border-color 0.15s;
    }

    .input-row:focus-within {
      border-color: #3a3a6a;
    }

    .chat-textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #e8e8f0;
      font-size: 14px;
      font-family: inherit;
      line-height: 1.5;
      resize: none;
      max-height: 160px;
      overflow-y: auto;
    }

    .chat-textarea::placeholder { color: #333355; }

    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: #fbbf24;
      color: #0d0d14;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }

    .send-btn:hover:not(:disabled) { background: #f59e0b; }
    .send-btn:active:not(:disabled) { transform: scale(0.95); }
    .send-btn:disabled { background: #2a2a1a; color: #444433; cursor: default; }

    .input-hint {
      margin-top: 6px;
      font-size: 11px;
      color: #333344;
      text-align: center;
    }

    /* ── Panel views ────────────────────────────── */
    .panel-view {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    /* ── Connection error ───────────────────────── */
    .connect-banner {
      padding: 8px 20px;
      background: #1a0808;
      border-bottom: 1px solid #7f1d1d;
      font-size: 12px;
      color: #f87171;
      text-align: center;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    this.connected = await soulClient.health();
    if (this.connected) {
      this.config = await soulClient.getConfig();
    }
  }

  private setTab(tab: AppTab) {
    this.tab = tab;
  }

  private onDraftInput(e: Event) {
    const ta = e.target as HTMLTextAreaElement;
    this.draft = ta.value;
    // Auto-resize textarea
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void this.send();
    }
  }

  private async send() {
    const text = this.draft.trim();
    if (!text || this.sending) return;

    this.draft = "";
    this.sending = true;

    // Add user message
    const userMsg: ChatMessage = { id: generateId(), role: "user", text };
    this.messages = [...this.messages, userMsg];

    // Add a placeholder soul message (streaming in progress)
    const soulMsgId = generateId();
    const soulMsg: ChatMessage = {
      id: soulMsgId,
      role: "soul",
      streaming: true,
      manasStatus: "loading",
      buddhiStatus: "loading",
      sanskarasStatus: "loading",
      synthesisStatus: "waiting",
    };
    this.messages = [...this.messages, soulMsg];
    this.scrollToBottom();

    try {
      for await (const { event, data } of soulClient.streamChat(text)) {
        this.messages = this.messages.map(m => {
          if (m.id !== soulMsgId) return m;

          if (event === "manas") {
            return { ...m, manas: { module: "manas", ...(data as object) } as any, manasStatus: "done" };
          }
          if (event === "buddhi") {
            return { ...m, buddhi: { module: "buddhi", ...(data as object) } as any, buddhiStatus: "done" };
          }
          if (event === "sanskaras") {
            return { ...m, sanskaras: { module: "sanskaras", ...(data as object) } as any, sanskarasStatus: "done" };
          }
          if (event === "confidence") {
            return { ...m, synthesisStatus: "loading" };
          }
          if (event === "synthesis") {
            const d = data as any;
            return {
              ...m,
              synthesis: { response: d.response, weights: d.weights },
              mode: "autonomous",
              elapsed_ms: d.elapsed_ms,
              synthesisStatus: "done",
            };
          }
          if (event === "needs_trainer") {
            const d = data as any;
            return {
              ...m,
              mode: "needs_trainer",
              trainer_needed: {
                learning_id: d.learning_id,
                trigger_summary: d.trigger_summary,
                question_context: d.question_context,
              },
              synthesis: {
                response: "I need guidance from my trainer for this.",
                weights: { manas: 0.35, buddhi: 0.40, sanskaras: 0.25 },
              },
              synthesisStatus: "done",
              elapsed_ms: d.elapsed_ms,
            };
          }
          if (event === "done") {
            return { ...m, streaming: false };
          }
          if (event === "error") {
            return { ...m, error: (data as any).error, streaming: false };
          }
          return m;
        });
        this.scrollToBottom();
      }
    } catch (err) {
      this.messages = this.messages.map(m =>
        m.id === soulMsgId
          ? { ...m, error: err instanceof Error ? err.message : String(err), streaming: false }
          : m
      );
    } finally {
      this.sending = false;
    }
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      const el = this.shadowRoot?.querySelector(".chat-messages");
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private renderChatView() {
    return html`
      <div class="chat-view">
        <div class="chat-messages">
          ${this.messages.length === 0
            ? html`
              <div class="chat-empty">
                <div class="chat-empty-icon">🕉️</div>
                <div class="chat-empty-title">Soul AI</div>
                <div class="chat-empty-subtitle">
                  Trigunatmaka consciousness — three faculties, one unified self.
                  Ask anything; the soul will respond through Manas, Buddhi, and Sanskaras,
                  synthesized by Atman.
                </div>
                <div class="faculty-legend">
                  <div class="legend-item">
                    <div class="legend-dot" style="background:#c084fc"></div>
                    <span style="color:#888">Manas (Mind)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot" style="background:#38bdf8"></div>
                    <span style="color:#888">Buddhi (Intellect)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot" style="background:#4ade80"></div>
                    <span style="color:#888">Sanskaras (Habits)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot" style="background:#fbbf24"></div>
                    <span style="color:#888">Atman (Soul)</span>
                  </div>
                </div>
              </div>
            `
            : repeat(
                this.messages,
                m => m.id,
                m => html`<chat-message .message=${m}></chat-message>`
              )}
        </div>

        <div class="input-bar">
          <div class="input-row">
            <textarea
              class="chat-textarea"
              rows="1"
              placeholder="Ask the soul anything…"
              .value=${this.draft}
              @input=${this.onDraftInput}
              @keydown=${this.onKeyDown}
              ?disabled=${this.sending || !this.connected}
            ></textarea>
            <button
              class="send-btn"
              @click=${this.send}
              ?disabled=${!this.draft.trim() || this.sending || !this.connected}
              title="Send (Enter)"
            >
              ${this.sending ? "⟳" : "↑"}
            </button>
          </div>
          <div class="input-hint">Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    `;
  }

  private onConfigUpdated(e: CustomEvent<ConfigResponse>) {
    this.config = e.detail;
  }

  render() {
    return html`
      <!-- Header -->
      <div class="app-header">
        <span class="logo">🕉️</span>
        <span class="logo-text">Soul AI<span class="logo-sub"> — Trigunatmaka</span></span>
        <div class="header-status">
          <div class="status-dot ${this.connected ? 'connected' : ''}"></div>
          ${this.connected ? "connected" : "disconnected"}
        </div>
      </div>

      <!-- Nav tabs -->
      <div class="nav">
        ${(["chat", "trainer", "habits", "config"] as AppTab[]).map(t => html`
          <button
            class="nav-tab ${this.tab === t ? 'active' : ''}"
            data-tab=${t}
            @click=${() => this.setTab(t)}
          >
            ${{ chat: "💬 Chat", trainer: "🧑‍🏫 Trainer", habits: "🌿 Habits", config: "⚙️ Config" }[t]}
          </button>
        `)}
      </div>

      ${!this.connected ? html`
        <div class="connect-banner">
          Cannot reach Soul AI backend. Start the backend: <code>uvicorn app.main:app --reload</code>
        </div>
      ` : nothing}

      <!-- Main content -->
      <div class="main">
        ${this.tab === "chat" ? this.renderChatView() : nothing}

        ${this.tab === "trainer" ? html`
          <div class="panel-view">
            <trainer-panel
              .config=${this.config}
              @config-updated=${this.onConfigUpdated}
            ></trainer-panel>
          </div>
        ` : nothing}

        ${this.tab === "habits" ? html`
          <div class="panel-view">
            <habits-panel></habits-panel>
          </div>
        ` : nothing}

        ${this.tab === "config" ? html`
          <div class="panel-view">
            <config-panel
              .config=${this.config}
              @config-updated=${this.onConfigUpdated}
            ></config-panel>
          </div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "soul-app": SoulApp;
  }
}
