/**
 * TrainerPanel — Guru-Shishya interface for providing guidance to the soul.
 * Shows pending learnings and allows the trainer to respond.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { LearningResponse, ConfigResponse } from "../types.js";
import { soulClient } from "../api/soul-client.js";

@customElement("trainer-panel")
export class TrainerPanel extends LitElement {
  @property({ type: Object }) config?: ConfigResponse;
  @state() private pendingLearnings: LearningResponse[] = [];
  @state() private allLearnings: LearningResponse[] = [];
  @state() private loading = false;
  @state() private activeRespondId: number | null = null;
  @state() private guidance = "";
  @state() private applicationNote = "";
  @state() private confidenceBoost = 0.7;
  @state() private view: "pending" | "all" = "pending";
  @state() private newGuidance = "";
  @state() private newTrigger = "";
  @state() private newKeywords = "";
  @state() private newNote = "";
  @state() private showCreateForm = false;

  static styles = css`
    :host { display: block; padding: 20px; max-width: 720px; margin: 0 auto; }

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #fbbf24;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subtitle {
      font-size: 13px;
      color: #666644;
      margin-bottom: 20px;
    }

    .mode-banner {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: space-between;
    }

    .mode-banner.enabled {
      background: #162010;
      border: 1px solid #4ade80;
      color: #86efac;
    }

    .mode-banner.disabled {
      background: #1a1510;
      border: 1px solid #713f12;
      color: #fbbf24;
    }

    .toggle-btn {
      padding: 5px 12px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }

    .toggle-btn.enable {
      background: #16653133;
      border: 1px solid #4ade80;
      color: #4ade80;
    }

    .toggle-btn.disable {
      background: #7f1d1d33;
      border: 1px solid #f87171;
      color: #f87171;
    }

    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
    }

    .tab {
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid transparent;
      font-size: 13px;
      cursor: pointer;
      background: transparent;
      color: #666688;
      transition: all 0.15s;
    }

    .tab.active {
      border-color: #2a2a45;
      background: #1a1a2e;
      color: #c0c0e0;
    }

    .tab:hover:not(.active) { background: #141420; color: #9999cc; }

    .refresh-btn {
      margin-left: auto;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #2a2a45;
      background: transparent;
      color: #666688;
      font-size: 12px;
      cursor: pointer;
    }

    .refresh-btn:hover { background: #1a1a2e; color: #9999cc; }

    .empty {
      text-align: center;
      padding: 40px 20px;
      color: #444455;
      font-size: 14px;
    }

    .learning-card {
      border: 1px solid #2a2a45;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 10px;
      background: #13131f;
    }

    .learning-card.pending { border-left: 3px solid #fbbf24; }
    .learning-card.active { border-left: 3px solid #4ade80; }

    .learning-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }

    .learning-id {
      font-size: 11px;
      color: #444466;
      min-width: 28px;
    }

    .learning-summary {
      font-size: 14px;
      color: #d0d0e0;
      flex: 1;
      line-height: 1.5;
    }

    .learning-badge {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 999px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-pending { background: #3d2a0533; border: 1px solid #fbbf24; color: #fbbf24; }
    .badge-active { background: #0f2a1233; border: 1px solid #4ade80; color: #4ade80; }

    .learning-meta {
      font-size: 11px;
      color: #444466;
      margin-top: 6px;
      display: flex;
      gap: 12px;
    }

    .learning-context {
      margin-top: 8px;
      padding: 8px;
      background: #0d0d14;
      border-radius: 6px;
      font-size: 12px;
      color: #888899;
      font-style: italic;
    }

    .learning-guidance {
      margin-top: 8px;
      padding: 10px;
      background: #0f1a0f;
      border: 1px solid #1f3a1f;
      border-radius: 6px;
      font-size: 13px;
      color: #a8e6b8;
      line-height: 1.5;
    }

    /* Respond form */
    .respond-btn {
      margin-top: 10px;
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid #fbbf24;
      background: transparent;
      color: #fbbf24;
      font-size: 12px;
      cursor: pointer;
    }

    .respond-btn:hover { background: #3d2a0533; }

    .respond-form {
      margin-top: 12px;
      padding: 14px;
      background: #0d0d14;
      border-radius: 8px;
      border: 1px solid #2a2a45;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    label {
      font-size: 12px;
      color: #888899;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    textarea, input[type="text"], input[type="number"] {
      background: #13131f;
      border: 1px solid #2a2a45;
      border-radius: 6px;
      color: #d0d0e0;
      padding: 8px 10px;
      font-size: 13px;
      font-family: inherit;
      resize: vertical;
      outline: none;
      transition: border-color 0.15s;
    }

    textarea:focus, input:focus {
      border-color: #fbbf24;
    }

    .form-row {
      display: flex;
      gap: 10px;
    }

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .btn-submit {
      padding: 7px 16px;
      border-radius: 6px;
      border: none;
      background: #fbbf24;
      color: #0d0d14;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit:hover { background: #f59e0b; }

    .btn-cancel {
      padding: 7px 14px;
      border-radius: 6px;
      border: 1px solid #2a2a45;
      background: transparent;
      color: #666688;
      font-size: 13px;
      cursor: pointer;
    }

    .btn-cancel:hover { background: #1a1a2e; }

    .create-section {
      margin-top: 20px;
      border-top: 1px solid #1a1a2e;
      padding-top: 16px;
    }

    .create-label {
      font-size: 12px;
      color: #555577;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .create-label:hover { color: #8888bb; }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadLearnings();
  }

  private async loadLearnings() {
    this.loading = true;
    try {
      const [pending, all] = await Promise.all([
        soulClient.getPendingLearnings(),
        soulClient.getAllLearnings(),
      ]);
      this.pendingLearnings = pending;
      this.allLearnings = all;
    } finally {
      this.loading = false;
    }
  }

  private async toggleLearningMode() {
    if (!this.config) return;
    const updated = await soulClient.toggleLearningMode(!this.config.learning_mode_enabled);
    this.dispatchEvent(new CustomEvent("config-updated", { detail: updated, bubbles: true, composed: true }));
  }

  private openRespond(id: number) {
    this.activeRespondId = id;
    this.guidance = "";
    this.applicationNote = "";
    this.confidenceBoost = 0.7;
  }

  private closeRespond() {
    this.activeRespondId = null;
  }

  private async submitResponse() {
    if (!this.activeRespondId || !this.guidance.trim() || !this.applicationNote.trim()) return;
    await soulClient.respondToLearning(
      this.activeRespondId,
      this.guidance,
      this.applicationNote,
      "all",
      this.confidenceBoost,
    );
    this.activeRespondId = null;
    await this.loadLearnings();
  }

  private async submitCreate() {
    if (!this.newTrigger.trim() || !this.newGuidance.trim() || !this.newNote.trim() || !this.newKeywords.trim()) return;
    await soulClient.createLearning({
      trigger_summary: this.newTrigger,
      keywords: this.newKeywords,
      guidance: this.newGuidance,
      application_note: this.newNote,
    });
    this.newTrigger = "";
    this.newGuidance = "";
    this.newNote = "";
    this.newKeywords = "";
    this.showCreateForm = false;
    await this.loadLearnings();
  }

  private async supersede(id: number) {
    if (!confirm("Remove this learning?")) return;
    await soulClient.supersedeLearning(id);
    await this.loadLearnings();
  }

  private renderLearning(l: LearningResponse) {
    const isResponding = this.activeRespondId === l.id;
    return html`
      <div class="learning-card ${l.status}">
        <div class="learning-header">
          <span class="learning-id">#${l.id}</span>
          <span class="learning-summary">${l.trigger_summary}</span>
          <span class="learning-badge badge-${l.status}">${l.status}</span>
        </div>

        ${l.question_context ? html`
          <div class="learning-context">"${l.question_context}"</div>
        ` : nothing}

        ${l.guidance ? html`
          <div class="learning-guidance">${l.guidance}</div>
        ` : nothing}

        <div class="learning-meta">
          <span>modules: ${l.modules_informed}</span>
          <span>boost: ${(l.confidence_boost * 100).toFixed(0)}%</span>
          <span>applied: ${l.times_applied}×</span>
          <span>keywords: ${l.keywords}</span>
        </div>

        ${l.status === "pending" ? html`
          <button class="respond-btn" @click=${() => this.openRespond(l.id)}>
            Respond with guidance
          </button>

          ${isResponding ? html`
            <div class="respond-form">
              <label>
                Guidance (full teaching)
                <textarea rows="4" .value=${this.guidance}
                  @input=${(e: Event) => this.guidance = (e.target as HTMLTextAreaElement).value}
                  placeholder="Explain how the soul should approach this…"></textarea>
              </label>
              <label>
                Application note (concise directive for modules)
                <input type="text" .value=${this.applicationNote}
                  @input=${(e: Event) => this.applicationNote = (e.target as HTMLInputElement).value}
                  placeholder="Brief, actionable note…" />
              </label>
              <label>
                Confidence boost (0–1)
                <input type="number" min="0" max="1" step="0.1"
                  .value=${String(this.confidenceBoost)}
                  @input=${(e: Event) => this.confidenceBoost = parseFloat((e.target as HTMLInputElement).value)} />
              </label>
              <div class="form-actions">
                <button class="btn-cancel" @click=${this.closeRespond}>Cancel</button>
                <button class="btn-submit" @click=${this.submitResponse}>Submit guidance</button>
              </div>
            </div>
          ` : nothing}
        ` : html`
          <button class="respond-btn" style="border-color:#f87171;color:#f87171"
            @click=${() => this.supersede(l.id)}>
            Supersede
          </button>
        `}
      </div>
    `;
  }

  render() {
    const learningEnabled = this.config?.learning_mode_enabled ?? false;
    const displayed = this.view === "pending" ? this.pendingLearnings : this.allLearnings;

    return html`
      <h2>🧑‍🏫 Trainer Mode</h2>
      <div class="subtitle">Guide the soul's growth through the Guru-Shishya tradition</div>

      <!-- Learning mode toggle -->
      <div class="mode-banner ${learningEnabled ? 'enabled' : 'disabled'}">
        <span>
          Learning mode is <strong>${learningEnabled ? "enabled" : "disabled"}</strong>.
          ${learningEnabled
            ? "Soul will seek guidance when uncertain."
            : "Enable to allow the soul to ask for help."}
        </span>
        <button class="toggle-btn ${learningEnabled ? 'disable' : 'enable'}"
          @click=${this.toggleLearningMode}>
          ${learningEnabled ? "Disable" : "Enable"} learning mode
        </button>
      </div>

      <!-- Tabs + refresh -->
      <div class="tabs">
        <button class="tab ${this.view === 'pending' ? 'active' : ''}"
          @click=${() => this.view = "pending"}>
          Pending (${this.pendingLearnings.length})
        </button>
        <button class="tab ${this.view === 'all' ? 'active' : ''}"
          @click=${() => this.view = "all"}>
          All Learnings (${this.allLearnings.length})
        </button>
        <button class="refresh-btn" @click=${this.loadLearnings}>↻ Refresh</button>
      </div>

      <!-- Learning list -->
      ${this.loading
        ? html`<div class="empty">Loading…</div>`
        : displayed.length === 0
        ? html`<div class="empty">
            ${this.view === "pending"
              ? "No pending learnings. The soul is confident in its responses."
              : "No learnings yet. Enable learning mode and chat with the soul."}
          </div>`
        : displayed.map(l => this.renderLearning(l))}

      <!-- Proactive teaching -->
      <div class="create-section">
        <span class="create-label" @click=${() => this.showCreateForm = !this.showCreateForm}>
          ${this.showCreateForm ? "▲" : "▶"} Proactively teach the soul
        </span>

        ${this.showCreateForm ? html`
          <div class="respond-form" style="margin-top:12px">
            <label>
              Topic / trigger summary
              <input type="text" .value=${this.newTrigger}
                @input=${(e: Event) => this.newTrigger = (e.target as HTMLInputElement).value}
                placeholder="What should the soul learn about?" />
            </label>
            <label>
              Keywords (comma-separated)
              <input type="text" .value=${this.newKeywords}
                @input=${(e: Event) => this.newKeywords = (e.target as HTMLInputElement).value}
                placeholder="word1,word2,word3" />
            </label>
            <label>
              Guidance
              <textarea rows="4" .value=${this.newGuidance}
                @input=${(e: Event) => this.newGuidance = (e.target as HTMLTextAreaElement).value}
                placeholder="Full teaching text…"></textarea>
            </label>
            <label>
              Application note
              <input type="text" .value=${this.newNote}
                @input=${(e: Event) => this.newNote = (e.target as HTMLInputElement).value}
                placeholder="Concise directive for modules…" />
            </label>
            <div class="form-actions">
              <button class="btn-cancel" @click=${() => this.showCreateForm = false}>Cancel</button>
              <button class="btn-submit" @click=${this.submitCreate}>Teach</button>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "trainer-panel": TrainerPanel;
  }
}
