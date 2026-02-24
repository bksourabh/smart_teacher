/**
 * ChatMessage — renders a single user or soul message.
 * Soul messages contain all three faculties + synthesis.
 */
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ChatMessage } from "../types.js";
import "./faculty-card.js";
import "./synthesis-panel.js";

@customElement("chat-message")
export class ChatMessageEl extends LitElement {
  @property({ type: Object }) message!: ChatMessage;
  @state() private facultiesExpanded = false;

  static styles = css`
    :host { display: block; }

    /* User message */
    .user-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }

    .user-bubble {
      max-width: 70%;
      background: #1e1e38;
      border: 1px solid #2a2a4a;
      border-radius: 14px 14px 4px 14px;
      padding: 10px 14px;
      font-size: 14px;
      line-height: 1.6;
      color: #d8d8f0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Soul message */
    .soul-row {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .soul-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #fbbf24, #92400e);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      margin-top: 4px;
    }

    .soul-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Toggle button for faculties */
    .faculties-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid #2a2a45;
      background: transparent;
      color: #666688;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      align-self: flex-start;
    }

    .faculties-toggle:hover {
      background: #1a1a2e;
      color: #9999cc;
    }

    .faculties-toggle .icon { font-size: 10px; }

    .faculties-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    /* Error state */
    .error-box {
      background: #200c0c;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 10px 14px;
      color: #f87171;
      font-size: 13px;
    }
  `;

  private toggleFaculties() {
    this.facultiesExpanded = !this.facultiesExpanded;
  }

  private renderFacultyCards() {
    const m = this.message;
    const isStreaming = m.streaming;

    return html`
      <faculty-card
        faculty="manas"
        status=${m.manasStatus ?? "waiting"}
        response=${m.manas?.response ?? ""}
        confidence=${m.manas?.confidence ?? 0}
        valence=${m.manas?.valence}
        .reasoningChain=${[]}
        .activatedHabits=${[]}
      ></faculty-card>

      <faculty-card
        faculty="buddhi"
        status=${m.buddhiStatus ?? "waiting"}
        response=${m.buddhi?.response ?? ""}
        confidence=${m.buddhi?.confidence ?? 0}
        .reasoningChain=${m.buddhi?.reasoning_chain ?? []}
        .activatedHabits=${[]}
      ></faculty-card>

      <faculty-card
        faculty="sanskaras"
        status=${m.sanskarasStatus ?? "waiting"}
        response=${m.sanskaras?.response ?? ""}
        confidence=${m.sanskaras?.confidence ?? 0}
        .reasoningChain=${[]}
        .activatedHabits=${m.sanskaras?.activated_habits ?? []}
      ></faculty-card>
    `;
  }

  render() {
    const m = this.message;

    if (m.role === "user") {
      return html`
        <div class="user-row">
          <div class="user-bubble">${m.text}</div>
        </div>
      `;
    }

    // Soul message
    const isStreaming = m.streaming;
    const hasAnyFaculty = !!(m.manas || m.buddhi || m.sanskaras || isStreaming);
    const activeFacultiesCount = [m.manasStatus, m.buddhiStatus, m.sanskarasStatus]
      .filter(s => s === "loading" || s === "done").length;

    return html`
      <div class="soul-row">
        <div class="soul-avatar">🕉️</div>

        <div class="soul-content">
          ${m.error ? html`
            <div class="error-box">Error: ${m.error}</div>
          ` : nothing}

          <!-- Primary: Synthesis / Atman -->
          <synthesis-panel
            status=${m.synthesisStatus ?? (hasAnyFaculty ? "waiting" : "waiting")}
            mode=${m.mode ?? "autonomous"}
            .synthesis=${m.synthesis}
            .trainerNeeded=${m.trainer_needed}
            elapsedMs=${m.elapsed_ms}
          ></synthesis-panel>

          <!-- Secondary: Three Faculties (collapsible) -->
          ${hasAnyFaculty ? html`
            <button class="faculties-toggle" @click=${this.toggleFaculties}>
              <span class="icon">${this.facultiesExpanded ? "▲" : "▼"}</span>
              ${this.facultiesExpanded ? "Hide" : "Show"} faculties
              ${isStreaming && activeFacultiesCount < 3
                ? html`· ${activeFacultiesCount}/3 ready`
                : nothing}
            </button>

            ${this.facultiesExpanded ? html`
              <div class="faculties-list">
                ${this.renderFacultyCards()}
              </div>
            ` : nothing}
          ` : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chat-message": ChatMessageEl;
  }
}
