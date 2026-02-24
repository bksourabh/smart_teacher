/**
 * SynthesisPanel — displays the Atman (unified self) synthesis response.
 * This is the primary response the user sees; the three faculties are supplementary.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { FacultyStatus, SynthesisOutput, TrainerNeeded } from "../types.js";

@customElement("synthesis-panel")
export class SynthesisPanel extends LitElement {
  @property() status: FacultyStatus = "waiting";
  @property({ type: Object }) synthesis?: SynthesisOutput;
  @property({ type: Object }) trainerNeeded?: TrainerNeeded;
  @property({ type: Number }) elapsedMs?: number;
  @property() mode: "autonomous" | "needs_trainer" = "autonomous";

  static styles = css`
    :host { display: block; }

    .panel {
      border-radius: 12px;
      border: 1px solid #3a2a10;
      background: linear-gradient(135deg, #1a160a 0%, #13131f 100%);
      overflow: hidden;
    }

    .panel.needs-trainer {
      border-color: #92400e;
      background: linear-gradient(135deg, #1a1200 0%, #13131f 100%);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid #2a200a;
    }

    .atman-icon {
      font-size: 18px;
    }

    .title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fbbf24;
    }

    .weights {
      margin-left: auto;
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: #666650;
    }

    .weight-chip {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .weight-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .elapsed {
      font-size: 11px;
      color: #555544;
      margin-left: 8px;
    }

    .body {
      padding: 16px;
    }

    .synthesis-text {
      font-size: 15px;
      line-height: 1.75;
      color: #f0ead0;
      font-weight: 400;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Loading state */
    .shimmer-line {
      height: 14px;
      border-radius: 7px;
      background: linear-gradient(90deg, #1f1c10 25%, #2a2618 50%, #1f1c10 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin-bottom: 10px;
    }

    .shimmer-line:last-child { width: 65%; margin-bottom: 0; }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Trainer needed */
    .trainer-box {
      background: #1a0f00;
      border: 1px solid #92400e;
      border-radius: 8px;
      padding: 14px;
    }

    .trainer-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #fbbf24;
      margin-bottom: 8px;
    }

    .trainer-question {
      font-size: 14px;
      color: #e0c88a;
      line-height: 1.6;
    }

    .trainer-hint {
      margin-top: 10px;
      font-size: 12px;
      color: #666644;
    }

    /* Waiting state */
    .waiting {
      color: #444455;
      font-size: 13px;
      font-style: italic;
      padding: 4px 0;
    }
  `;

  private renderWeights() {
    if (!this.synthesis?.weights) return nothing;
    const { weights } = this.synthesis;
    const dots: Record<string, string> = {
      manas: "#c084fc",
      buddhi: "#38bdf8",
      sanskaras: "#4ade80",
    };
    return html`
      <div class="weights">
        ${Object.entries(weights).map(([k, v]) => html`
          <span class="weight-chip">
            <span class="weight-dot" style="background:${dots[k] ?? '#888'}"></span>
            ${(v * 100).toFixed(0)}%
          </span>
        `)}
        ${this.elapsedMs !== undefined
          ? html`<span class="elapsed">${this.elapsedMs}ms</span>`
          : nothing}
      </div>
    `;
  }

  render() {
    const isTrainerMode = this.mode === "needs_trainer";
    const panelClass = `panel${isTrainerMode ? " needs-trainer" : ""}`;

    return html`
      <div class="${panelClass}">
        <div class="header">
          <span class="atman-icon">${isTrainerMode ? "🙏" : "✨"}</span>
          <span class="title">${isTrainerMode ? "Seeking Guidance — Atman" : "Soul · Atman"}</span>
          ${this.renderWeights()}
        </div>

        <div class="body">
          ${this.status === "waiting"
            ? html`<div class="waiting">Awaiting faculty outputs…</div>`
            : this.status === "loading"
            ? html`
                <div class="shimmer-line"></div>
                <div class="shimmer-line" style="width:85%"></div>
                <div class="shimmer-line"></div>
              `
            : isTrainerMode && this.trainerNeeded
            ? html`
                <div class="trainer-box">
                  <div class="trainer-label">Question for Trainer</div>
                  <div class="trainer-question">${this.trainerNeeded.trigger_summary}</div>
                  <div class="trainer-hint">
                    Switch to the Trainer tab to provide guidance (Learning #${this.trainerNeeded.learning_id}).
                  </div>
                </div>
              `
            : html`
                <div class="synthesis-text">${this.synthesis?.response ?? ""}</div>
              `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "synthesis-panel": SynthesisPanel;
  }
}
