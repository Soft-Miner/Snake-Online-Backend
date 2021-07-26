export class PubSub {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private events: Record<string, Array<(data: any) => void>> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.events.hasOwnProperty(event)) {
      this.events[event] = [];
    }
    return this.events[event].push(callback);
  }

  publish(event: string, data = {}) {
    if (!this.events.hasOwnProperty(event)) {
      return [];
    }
    return this.events[event].map((callback) => callback(data));
  }
}
