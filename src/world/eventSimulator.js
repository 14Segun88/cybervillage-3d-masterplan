import { EVENTS_DATA } from '../data/eventsData.js';
import { soundFx } from '../audio/soundFx.js';

export class EventSimulator {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.currentEvent = null;
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.elapsed = 0;
    this.timer = null;
  }

  loadEvent(eventId) {
    this.stop();
    this.currentEvent = EVENTS_DATA[eventId] || null;
    this.currentStepIndex = 0;
    this.elapsed = 0;

    if (this.onStateChange) {
      this.onStateChange({
        event: this.currentEvent,
        stepIndex: this.currentStepIndex,
        step: this.getCurrentStep(),
        isPlaying: this.isPlaying,
        progress: 0
      });
    }
  }

  start() {
    if (!this.currentEvent) return;
    this.isPlaying = true;
    soundFx.playPulse();

    const intervalMs = 100;
    this.timer = setInterval(() => {
      this.elapsed += 0.1;
      const progress = Math.min(this.elapsed / this.currentEvent.durationSec, 1.0);

      // Проверка шагов
      const steps = this.currentEvent.steps;
      let newStepIdx = this.currentStepIndex;
      for (let i = steps.length - 1; i >= 0; i--) {
        if (this.elapsed >= steps[i].time) {
          newStepIdx = i;
          break;
        }
      }

      if (newStepIdx !== this.currentStepIndex) {
        this.currentStepIndex = newStepIdx;
        soundFx.playPulse();
      }

      if (this.elapsed >= this.currentEvent.durationSec) {
        this.stop();
      }

      if (this.onStateChange) {
        this.onStateChange({
          event: this.currentEvent,
          stepIndex: this.currentStepIndex,
          step: this.getCurrentStep(),
          isPlaying: this.isPlaying,
          progress: progress * 100
        });
      }
    }, intervalMs);
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.onStateChange) {
      this.onStateChange({
        event: this.currentEvent,
        stepIndex: this.currentStepIndex,
        step: this.getCurrentStep(),
        isPlaying: false,
        progress: (this.elapsed / (this.currentEvent?.durationSec || 1)) * 100
      });
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsed = 0;
    this.currentStepIndex = 0;

    if (this.onStateChange) {
      this.onStateChange({
        event: this.currentEvent,
        stepIndex: 0,
        step: this.getCurrentStep(),
        isPlaying: false,
        progress: 0
      });
    }
  }

  goToStep(index) {
    if (!this.currentEvent || index < 0 || index >= this.currentEvent.steps.length) return;
    this.currentStepIndex = index;
    this.elapsed = this.currentEvent.steps[index].time;
    soundFx.playClick();

    if (this.onStateChange) {
      this.onStateChange({
        event: this.currentEvent,
        stepIndex: this.currentStepIndex,
        step: this.getCurrentStep(),
        isPlaying: this.isPlaying,
        progress: (this.elapsed / this.currentEvent.durationSec) * 100
      });
    }
  }

  getCurrentStep() {
    if (!this.currentEvent || !this.currentEvent.steps) return null;
    return this.currentEvent.steps[this.currentStepIndex] || null;
  }
}
