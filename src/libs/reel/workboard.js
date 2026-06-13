import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";

export class Workboard {
  constructor({spectator, $queue, $error, $ready} = {}) {
    this.spectator = spectator;
    this.$queue = $queue;
    this.$error = $error;
    this.$ready = $ready;
    this._operations = {};
    this._nextTicket = 0;
  }

  register(key, op, blocking = false) {
    this._operations[key] = {op, blocking};
    return this;
  }

  request(key, ...args) {
    const entry = this._operations[key];
    if (!entry) {
      return Promise.reject(new Error(`Workboard operation "${key}" is not registered`));
    }

    if (entry.blocking && this.spectator()) {
      return Promise.reject(new Error("Spectators cannot participate"));
    }

    const ready = entry.blocking ? _.deref(this.$ready) : true;
    if (entry.blocking && !ready) {
      return Promise.reject(new Error(`Workboard is not ready to run "${key}"`));
    }

    const startedAt = Date.now(),
          ticketId = `${this._nextTicket++}`;

    this._addTicket(ticketId, {key, args, startedAt});

    let result;
    try {
      result = entry.op(...args);
    } catch (error) {
      this._recordError(error);
      this._removeTicket(ticketId);
      return Promise.reject(error);
    }

    return Promise.resolve(result)
      .catch(error => {
        this._recordError(error);
        throw error;
      })
      .finally(() => {
        this._removeTicket(ticketId);
      });
  }

  _addTicket(id, ticket) {
    $.swap(this.$queue, _.assoc(_, id, ticket));
  }

  _removeTicket(id) {
    $.swap(this.$queue, _.dissoc(_, id));
  }

  _recordError(error) {
    if (!this.$error) return;
    $.reset(this.$error, error);
  }
}
