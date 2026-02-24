/**
 * FacultyCard — displays one faculty's output (Manas, Buddhi, or Sanskaras).
 * Inspired by opensoulai's message group rendering approach.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { FacultyStatus } from "../types.js";

export type Faculty = "manas" | "buddhi" | "sanskaras";

@customElement("faculty-card")
export class FacultyCard extends LitElement {
  @property() faculty: Faculty = "manas";
  @property() status: FacultyStatus = "waiting";
  @property() response = "";
  @property({ type: Number }) confidence = 0;
  @property({ type: Number }) valence?: number;           // manas only
  @property({ type: Array }) reasoningChain: string[] = []; // buddhi only
  @property({ type: Array }) activatedHabits: { name: string; weight: number }[] = []; // sanskaras only
  @property({ type: Boolean }) expanded = true;

  static styles = css`
    :host {
      display: block;
    }

    .card {
      border-radius: 10px;
      border: 1px solid var(--faculty-color-dim, #2a2a45);
      background: var(--faculty-bg, #13131f);
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .card.loading {
      border-color: var(--faculty-color, #888);
    }

    .card.done {
      border-color: var(--faculty-color-dim, #2a2a45);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      cursor: pointer;
      user-select: none;
      background: var(--faculty-color-dim, #1a1a2e);
    }

    .header:hover { background: var(--faculty-color-dim-hover, #222238); }

    .faculty-icon {
      font-size: 16px;
      width: 22px;
      text-align: center;
    }

    .faculty-name {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--faculty-color, #888);
    }

    .meta {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      color: #666688;
    }

    .confidence-bar {
      width: 60px;
      height: 4px;
      background: #2a2a45;
      border-radius: 2px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      border-radius: 2px;
      background: var(--faculty-color, #888);
      transition: width 0.4s ease;
    }

    .confidence-text {
      min-width: 32px;
      text-align: right;
    }

    .valence {
      font-size: 11px;
      font-weight: 500;
    }
    .valence.pos { color: #4ade80; }
    .valence.neg { color: #f87171; }
    .valence.neu { color: #888899; }

    .chevron {
      font-size: 10px;
      color: #555577;
      transition: transform 0.2s;
    }
    .chevron.open { transform: rotate(180deg); }

    .body {
      padding: 12px 14px;
      display: none;
    }
    .body.visible { display: block; }

    .spinner {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666688;
      font-size: 12px;
      padding: 4px 0;
    }

    .dots {
      display: inline-flex;
      gap: 3px;
    }

    .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--faculty-color, #888);
      animation: pulse 1.2s ease-in-out infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
      40% { opacity: 1; transform: scale(1); }
    }

    .response-text {
      font-size: 14px;
      line-height: 1.65;
      color: #d0d0e0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .reasoning {
      margin-top: 10px;
      padding: 8px 10px;
      background: #0d0d14;
      border-radius: 6px;
      border-left: 2px solid var(--faculty-color, #888);
    }

    .reasoning-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #555577;
      margin-bottom: 6px;
    }

    .reasoning-steps {
      font-size: 12px;
      color: #888899;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
    }

    .reasoning-step { color: #a0a0c0; }

    .reasoning-arrow {
      color: #444466;
      font-size: 10px;
    }

    .habits {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .habit-chip {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--faculty-color-dim, #1a2a1a);
      border: 1px solid var(--faculty-color, #4ade80);
      color: var(--faculty-color, #4ade80);
      opacity: 0.8;
    }

    /* Faculty-specific CSS variables applied via host */
    :host([faculty="manas"]) {
      --faculty-color: #c084fc;
      --faculty-color-dim: #1e1228;
      --faculty-color-dim-hover: #261630;
      --faculty-bg: #13131f;
    }
    :host([faculty="buddhi"]) {
      --faculty-color: #38bdf8;
      --faculty-color-dim: #0c1e2a;
      --faculty-color-dim-hover: #102534;
      --faculty-bg: #13131f;
    }
    :host([faculty="sanskaras"]) {
      --faculty-color: #4ade80;
      --faculty-color-dim: #0f1f14;
      --faculty-color-dim-hover: #13271a;
      --faculty-bg: #13131f;
    }
  `;

  private readonly labels: Record<Faculty, { icon: string; name: string; sanskrit: string }> = {
    manas: { icon: "🧠", name: "Mind", sanskrit: "Manas" },
    buddhi: { icon: "💡", name: "Intellect", sanskrit: "Buddhi" },
    sanskaras: { icon: "🌿", name: "Habits", sanskrit: "Sanskaras" },
  };

  private toggle() {
    this.expanded = !this.expanded;
  }

  private renderValence() {
    if (this.valence === undefined) return nothing;
    const cls = this.valence > 0.1 ? "pos" : this.valence < -0.1 ? "neg" : "neu";
    const sign = this.valence >= 0 ? "+" : "";
    return html`<span class="valence ${cls}">${sign}${this.valence.toFixed(2)}</span>`;
  }

  private renderBody() {
    if (this.status === "waiting") return nothing;

    if (this.status === "loading") {
      return html`
        <div class="body visible">
          <div class="spinner">
            <div class="dots">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
            processing…
          </div>
        </div>
      `;
    }

    if (this.status === "error") {
      return html`<div class="body visible" style="color:#f87171;font-size:13px;">Error processing this faculty.</div>`;
    }

    return html`
      <div class="body ${this.expanded ? "visible" : ""}">
        <div class="response-text">${this.response}</div>

        ${this.reasoningChain.length > 0 ? html`
          <div class="reasoning">
            <div class="reasoning-label">Reasoning</div>
            <div class="reasoning-steps">
              ${this.reasoningChain.map((step, i) => html`
                ${i > 0 ? html`<span class="reasoning-arrow">→</span>` : nothing}
                <span class="reasoning-step">${step}</span>
              `)}
            </div>
          </div>
        ` : nothing}

        ${this.activatedHabits.length > 0 ? html`
          <div class="habits">
            ${this.activatedHabits.map(h => html`
              <span class="habit-chip" title="weight: ${h.weight.toFixed(1)}">${h.name}</span>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  render() {
    const label = this.labels[this.faculty];
    const cardClass = `card ${this.status}`;
    const isLoading = this.status === "loading";

    return html`
      <div class="${cardClass}">
        <div class="header" @click=${this.toggle}>
          <span class="faculty-icon">${label.icon}</span>
          <span class="faculty-name">${label.sanskrit} · ${label.name}</span>

          <div class="meta">
            ${isLoading ? html`
              <div class="dots">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
              </div>
            ` : this.status === "done" ? html`
              <div class="confidence-bar">
                <div class="confidence-fill" style="width:${this.confidence * 100}%"></div>
              </div>
              <span class="confidence-text">${(this.confidence * 100).toFixed(0)}%</span>
              ${this.renderValence()}
            ` : nothing}

            <span class="chevron ${this.expanded ? 'open' : ''}">▼</span>
          </div>
        </div>

        ${this.renderBody()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "faculty-card": FacultyCard;
  }
}
