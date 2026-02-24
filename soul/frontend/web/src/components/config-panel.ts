/**
 * ConfigPanel — runtime configuration management.
 * Pattern inspired by opensoulai's config management system with JSON persistence.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ConfigResponse } from "../types.js";
import { soulClient } from "../api/soul-client.js";

@customElement("config-panel")
export class ConfigPanel extends LitElement {
  @property({ type: Object }) config?: ConfigResponse;
  @state() private saving = false;
  @state() private saved = false;
  // Local editable state
  @state() private weightManas = 0.35;
  @state() private weightBuddhi = 0.40;
  @state() private weightSanskaras = 0.25;
  @state() private temperature = 0.7;
  @state() private maxTokens = 1024;
  @state() private claudeModel = "claude-sonnet-4-5-20250929";
  @state() private confidenceThreshold = 0.4;

  static styles = css`
    :host { display: block; padding: 20px; max-width: 560px; margin: 0 auto; }

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #e8e8f0;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subtitle { font-size: 13px; color: #555577; margin-bottom: 24px; }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #444466;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #1a1a2e;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 14px;
    }

    .field-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: #9090b0;
    }

    .field-value {
      font-size: 12px;
      color: #666688;
      font-variant-numeric: tabular-nums;
    }

    input[type="range"] {
      width: 100%;
      accent-color: #7c3aed;
      height: 4px;
    }

    input[type="text"],
    input[type="number"],
    select {
      width: 100%;
      background: #13131f;
      border: 1px solid #2a2a45;
      border-radius: 6px;
      color: #d0d0e0;
      padding: 8px 10px;
      font-size: 13px;
      font-family: inherit;
      outline: none;
    }

    input:focus, select:focus { border-color: #7c3aed; }

    /* Weight bars */
    .weights-display {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
    }

    .weight-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .weight-label {
      font-size: 12px;
      color: #888899;
      width: 120px;
      flex-shrink: 0;
    }

    .weight-bar-track {
      flex: 1;
      height: 6px;
      background: #1a1a2e;
      border-radius: 3px;
      overflow: hidden;
    }

    .weight-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .weight-pct {
      font-size: 12px;
      color: #666688;
      width: 36px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .weight-total {
      font-size: 11px;
      color: #444455;
      text-align: right;
      margin-top: 4px;
    }

    .weight-total.ok { color: #4ade80; }
    .weight-total.warn { color: #f87171; }

    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .btn-save {
      padding: 8px 20px;
      border-radius: 7px;
      border: none;
      background: #7c3aed;
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-save:hover { background: #6d28d9; }
    .btn-save:disabled { background: #3a2a5a; color: #666688; cursor: default; }

    .saved-msg {
      font-size: 12px;
      color: #4ade80;
    }
  `;

  updated(changed: Map<string, unknown>) {
    if (changed.has("config") && this.config) {
      this.weightManas = this.config.weight_manas;
      this.weightBuddhi = this.config.weight_buddhi;
      this.weightSanskaras = this.config.weight_sanskaras;
      this.temperature = this.config.temperature;
      this.maxTokens = this.config.max_tokens;
      this.claudeModel = this.config.claude_model;
      this.confidenceThreshold = this.config.confidence_threshold;
    }
  }

  private get weightTotal() {
    return +(this.weightManas + this.weightBuddhi + this.weightSanskaras).toFixed(2);
  }

  private async save() {
    this.saving = true;
    try {
      const updated = await soulClient.updateConfig({
        weight_manas: this.weightManas,
        weight_buddhi: this.weightBuddhi,
        weight_sanskaras: this.weightSanskaras,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        claude_model: this.claudeModel,
        confidence_threshold: this.confidenceThreshold,
      });
      this.saved = true;
      this.dispatchEvent(new CustomEvent("config-updated", { detail: updated, bubbles: true, composed: true }));
      setTimeout(() => this.saved = false, 2500);
    } finally {
      this.saving = false;
    }
  }

  render() {
    const totalOk = Math.abs(this.weightTotal - 1.0) < 0.01;

    return html`
      <h2>⚙️ Configuration</h2>
      <div class="subtitle">Runtime settings — no restart required</div>

      <!-- Faculty weights -->
      <div class="section">
        <div class="section-title">Faculty Weights</div>

        <div class="weights-display">
          <div class="weight-row">
            <span class="weight-label" style="color:#c084fc">Manas (Mind)</span>
            <div class="weight-bar-track">
              <div class="weight-bar-fill" style="width:${this.weightManas*100}%;background:#c084fc"></div>
            </div>
            <span class="weight-pct">${(this.weightManas*100).toFixed(0)}%</span>
          </div>
          <div class="weight-row">
            <span class="weight-label" style="color:#38bdf8">Buddhi (Intellect)</span>
            <div class="weight-bar-track">
              <div class="weight-bar-fill" style="width:${this.weightBuddhi*100}%;background:#38bdf8"></div>
            </div>
            <span class="weight-pct">${(this.weightBuddhi*100).toFixed(0)}%</span>
          </div>
          <div class="weight-row">
            <span class="weight-label" style="color:#4ade80">Sanskaras (Habits)</span>
            <div class="weight-bar-track">
              <div class="weight-bar-fill" style="width:${this.weightSanskaras*100}%;background:#4ade80"></div>
            </div>
            <span class="weight-pct">${(this.weightSanskaras*100).toFixed(0)}%</span>
          </div>
        </div>

        <div class="field">
          <div class="field-label">
            <span>Manas</span>
            <span class="field-value">${this.weightManas.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05"
            .value=${String(this.weightManas)}
            @input=${(e: Event) => this.weightManas = parseFloat((e.target as HTMLInputElement).value)} />
        </div>

        <div class="field">
          <div class="field-label">
            <span>Buddhi</span>
            <span class="field-value">${this.weightBuddhi.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05"
            .value=${String(this.weightBuddhi)}
            @input=${(e: Event) => this.weightBuddhi = parseFloat((e.target as HTMLInputElement).value)} />
        </div>

        <div class="field">
          <div class="field-label">
            <span>Sanskaras</span>
            <span class="field-value">${this.weightSanskaras.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05"
            .value=${String(this.weightSanskaras)}
            @input=${(e: Event) => this.weightSanskaras = parseFloat((e.target as HTMLInputElement).value)} />
        </div>

        <div class="weight-total ${totalOk ? 'ok' : 'warn'}">
          Total: ${this.weightTotal.toFixed(2)} ${totalOk ? "✓" : "(should sum to 1.0)"}
        </div>
      </div>

      <!-- Model settings -->
      <div class="section">
        <div class="section-title">Model Settings</div>

        <div class="field">
          <div class="field-label"><span>Claude model</span></div>
          <input type="text" .value=${this.claudeModel}
            @input=${(e: Event) => this.claudeModel = (e.target as HTMLInputElement).value} />
        </div>

        <div class="field">
          <div class="field-label">
            <span>Temperature</span>
            <span class="field-value">${this.temperature.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="2" step="0.05"
            .value=${String(this.temperature)}
            @input=${(e: Event) => this.temperature = parseFloat((e.target as HTMLInputElement).value)} />
        </div>

        <div class="field">
          <div class="field-label">
            <span>Max tokens</span>
            <span class="field-value">${this.maxTokens}</span>
          </div>
          <input type="range" min="100" max="4096" step="100"
            .value=${String(this.maxTokens)}
            @input=${(e: Event) => this.maxTokens = parseInt((e.target as HTMLInputElement).value)} />
        </div>
      </div>

      <!-- Learning mode -->
      <div class="section">
        <div class="section-title">Learning Mode</div>
        <div class="field">
          <div class="field-label">
            <span>Confidence threshold</span>
            <span class="field-value">${this.confidenceThreshold.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05"
            .value=${String(this.confidenceThreshold)}
            @input=${(e: Event) => this.confidenceThreshold = parseFloat((e.target as HTMLInputElement).value)} />
        </div>
      </div>

      <div class="actions">
        <button class="btn-save" ?disabled=${this.saving || !totalOk} @click=${this.save}>
          ${this.saving ? "Saving…" : "Save changes"}
        </button>
        ${this.saved ? html`<span class="saved-msg">✓ Saved</span>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "config-panel": ConfigPanel;
  }
}
