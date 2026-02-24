/**
 * HabitsPanel — displays and manages the soul's Sanskaras (habit impressions).
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { HabitResponse } from "../types.js";
import { soulClient } from "../api/soul-client.js";

@customElement("habits-panel")
export class HabitsPanel extends LitElement {
  @state() private habits: HabitResponse[] = [];
  @state() private loading = false;

  static styles = css`
    :host { display: block; padding: 20px; max-width: 720px; margin: 0 auto; }

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #4ade80;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subtitle {
      font-size: 13px;
      color: #336633;
      margin-bottom: 20px;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .btn {
      padding: 7px 14px;
      border-radius: 6px;
      border: 1px solid #2a2a45;
      background: transparent;
      color: #666688;
      font-size: 12px;
      cursor: pointer;
    }

    .btn:hover { background: #1a1a2e; color: #9999cc; }

    .habit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 10px;
    }

    .habit-card {
      border: 1px solid #1f3a1f;
      border-radius: 10px;
      padding: 14px;
      background: #0f1a0f;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .habit-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .habit-name {
      font-size: 13px;
      font-weight: 600;
      color: #86efac;
      flex: 1;
    }

    .habit-category {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 999px;
      background: #0f2a0f;
      border: 1px solid #1a4a1a;
      color: #4ade80;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .habit-desc {
      font-size: 13px;
      color: #789078;
      line-height: 1.5;
    }

    .habit-stats {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #336633;
    }

    .habit-stat strong { color: #4ade80; }

    /* Weight bar */
    .weight-track {
      height: 3px;
      background: #1a2a1a;
      border-radius: 2px;
      overflow: hidden;
    }

    .weight-fill {
      height: 100%;
      background: #4ade80;
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    .valence-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .reinforce-btn {
      align-self: flex-end;
      padding: 4px 10px;
      border-radius: 5px;
      border: 1px solid #1a4a1a;
      background: transparent;
      color: #4ade80;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .reinforce-btn:hover { background: #0f2a0f; }

    .empty { text-align: center; padding: 40px; color: #444455; font-size: 14px; }

    .keywords {
      font-size: 11px;
      color: #2a4a2a;
      word-break: break-all;
    }

    .keywords span {
      display: inline-block;
      padding: 1px 6px;
      margin: 2px 2px 0 0;
      border-radius: 4px;
      background: #0f1e0f;
      border: 1px solid #1a3a1a;
      color: #3a7a3a;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.load();
  }

  private async load() {
    this.loading = true;
    try {
      this.habits = await soulClient.getHabits();
    } finally {
      this.loading = false;
    }
  }

  private async reinforce(id: number) {
    await soulClient.reinforceHabit(id);
    await this.load();
  }

  private valenceColor(v: number) {
    if (v > 0.2) return "#4ade80";
    if (v < -0.2) return "#f87171";
    return "#888899";
  }

  render() {
    return html`
      <h2>🌿 Sanskaras — Habits</h2>
      <div class="subtitle">Accumulated experience patterns that shape the soul's responses</div>

      <div class="actions">
        <button class="btn" @click=${this.load}>↻ Refresh</button>
      </div>

      ${this.loading
        ? html`<div class="empty">Loading…</div>`
        : this.habits.length === 0
        ? html`<div class="empty">No habits found.</div>`
        : html`
          <div class="habit-grid">
            ${this.habits.map(h => html`
              <div class="habit-card">
                <div class="habit-header">
                  <div class="habit-name">${h.name.replace(/_/g, " ")}</div>
                  <span class="habit-category">${h.category}</span>
                  <div class="valence-dot" style="background:${this.valenceColor(h.valence)};margin-top:2px"></div>
                </div>

                <div class="habit-desc">${h.description}</div>

                <div class="weight-track">
                  <div class="weight-fill" style="width:${Math.min(h.effective_weight / 4 * 100, 100)}%"></div>
                </div>

                <div class="habit-stats">
                  <span>weight: <strong>${h.effective_weight.toFixed(2)}</strong></span>
                  <span>rep: <strong>${h.repetition_count}</strong></span>
                  <span>valence: <strong>${h.valence.toFixed(2)}</strong></span>
                </div>

                <div class="keywords">
                  ${h.keywords.split(",").filter(k => k.trim()).map(k => html`<span>${k.trim()}</span>`)}
                </div>

                <button class="reinforce-btn" @click=${() => this.reinforce(h.id)}>
                  + Reinforce
                </button>
              </div>
            `)}
          </div>
        `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "habits-panel": HabitsPanel;
  }
}
