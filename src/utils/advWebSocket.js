class AdvWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static MODE_REAL = 'real';
  static MODE_MOCK = 'mock';

  constructor(url, options = {}, dataSource = null, mode = AdvWebSocket.MODE_MOCK) {
    this.url = url;
    this.options = {
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      connectionTimeout: 5000,
      simulateNetworkIssues: true,
      ...options,
    };
    this.dataSource = dataSource;
    this.mode = mode;

    this.readyState = AdvWebSocket.CONNECTING;
    this.protocol = '';
    this.binaryType = 'blob';
    this.bufferedAmount = 0;
    this.extensions = '';

    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.connectionTimer = null;
    this.listeners = {};

    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;

    this._internalWs = null;

    if (this.mode === AdvWebSocket.MODE_REAL) {
      this._initRealWebSocket();
    } else {
      this._initMockWebSocket();
    }
  }

  _initRealWebSocket() {
    try {
      this._internalWs = new WebSocket(this.url);

      this._internalWs.onopen = (event) => {
        this.readyState = AdvWebSocket.OPEN;
        this.protocol = this._internalWs.protocol;
        this.extensions = this._internalWs.extensions;
        this.reconnectAttempts = 0;
        this._dispatchEvent('open', { type: 'open', target: this });
      };

      this._internalWs.onmessage = (event) => {
        this._dispatchEvent('message', { type: 'message', data: event.data, target: this });
      };

      this._internalWs.onerror = (event) => {
        this._dispatchEvent('error', { type: 'error', error: event, target: this });
      };

      this._internalWs.onclose = (event) => {
        this.readyState = AdvWebSocket.CLOSED;
        this._dispatchEvent('close', {
          type: 'close',
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          target: this,
        });

        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this._scheduleReconnect();
        }
      };
    } catch (error) {
      this.readyState = AdvWebSocket.CLOSED;
      this._dispatchEvent('error', { type: 'error', error, target: this });
    }
  }

  _initMockWebSocket() {
    this._connectMock();
  }

  _connectMock() {
    if (this.readyState === AdvWebSocket.CONNECTING) {
      clearTimeout(this.connectionTimer);
    }

    this.readyState = AdvWebSocket.CONNECTING;
    this._dispatchEvent('connecting');

    this.connectionTimer = setTimeout(
      () => {
        if (Math.random() > 0.2 || !this.options.simulateNetworkIssues) {
          this.readyState = AdvWebSocket.OPEN;
          this.reconnectAttempts = 0;
          this._dispatchEvent('open', { type: 'open', target: this });
          this._startSimulatedMessages();
        } else {
          this._handleConnectionError(new Error('Connection failed'));
        }
      },
      1000 + Math.random() * 2000
    );
  }

  _handleConnectionError(error) {
    this.readyState = AdvWebSocket.CLOSED;
    this._dispatchEvent('error', { type: 'error', error, target: this });

    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this._scheduleReconnect();
    } else {
      this._dispatchEvent('close', {
        type: 'close',
        code: 1006,
        reason: 'Max reconnect attempts reached',
        wasClean: false,
        target: this,
      });
    }
  }

  _scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.reconnectTimer = setTimeout(() => {
      if (this.mode === AdvWebSocket.MODE_REAL) {
        this._initRealWebSocket();
      } else {
        this._connectMock();
      }
    }, delay);
  }

  _startSimulatedMessages() {
    if (this._messageInterval) return;

    this._messageInterval = setInterval(
      () => {
        if (
          this.readyState === AdvWebSocket.OPEN &&
          this.options.simulateNetworkIssues &&
          Math.random() > 0.95
        ) {
          this._simulateDisconnect();
          return;
        }

        if (this.readyState === AdvWebSocket.OPEN) {
          let messageData;

          if (typeof this.dataSource === 'function') {
            try {
              messageData = this.dataSource();
            } catch (error) {
              console.error('Error calling dataSource:', error);
              messageData = null;
            }
          }

          if (!messageData) {
            const mockMessages = [
              { type: 'ping', data: 'ping' },
              {
                type: 'message',
                data: JSON.stringify({ timestamp: Date.now(), content: 'Hello from server' }),
              },
              {
                type: 'status',
                data: JSON.stringify({ onlineUsers: Math.floor(Math.random() * 100) + 50 }),
              },
            ];
            messageData = mockMessages[Math.floor(Math.random() * mockMessages.length)];
          }

          this._dispatchEvent('message', {
            type: 'message',
            data: messageData.data || messageData,
            target: this,
          });
        }
      },
      2000 + Math.random() * 3000
    );
  }

  _simulateDisconnect() {
    clearInterval(this._messageInterval);
    this._messageInterval = null;
    this.readyState = AdvWebSocket.CLOSED;
    this._dispatchEvent('close', {
      type: 'close',
      code: 1006,
      reason: 'Simulated network disconnect',
      wasClean: false,
      target: this,
    });

    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this._scheduleReconnect();
    }
  }

  send(data) {
    if (this.readyState !== AdvWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    if (this.mode === AdvWebSocket.MODE_REAL) {
      this._internalWs.send(data);
      this._dispatchEvent('send', { type: 'send', data, target: this });
    } else {
      console.log('AdvWebSocket [mock] send:', data);
      this._dispatchEvent('send', { type: 'send', data, target: this });

      if (this.options.simulateNetworkIssues && Math.random() > 0.8) {
        setTimeout(
          () => {
            this._dispatchEvent('message', {
              type: 'message',
              data: JSON.stringify({
                type: 'ack',
                originalData: data,
                timestamp: Date.now(),
              }),
              target: this,
            });
          },
          500 + Math.random() * 1000
        );
      }
    }
  }

  close(code = 1000, reason = '') {
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.connectionTimer);
    clearInterval(this._messageInterval);
    this._messageInterval = null;

    if (this.mode === AdvWebSocket.MODE_REAL && this._internalWs) {
      this._internalWs.close(code, reason);
    }

    this.readyState = AdvWebSocket.CLOSED;
    this._dispatchEvent('close', { type: 'close', code, reason, wasClean: true, target: this });
  }

  connect() {
    if (this.mode === AdvWebSocket.MODE_REAL) {
      this._initRealWebSocket();
    } else {
      this._connectMock();
    }
  }

  addEventListener(type, listener) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
  }

  _dispatchEvent(type, event) {
    if (this.listeners[type]) {
      this.listeners[type].forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.error('Error in event listener:', e);
        }
      });
    }

    if (type === 'open' && this.onopen) {
      try {
        this.onopen(event);
      } catch (e) {
        console.error('Error in onopen handler:', e);
      }
    } else if (type === 'close' && this.onclose) {
      try {
        this.onclose(event);
      } catch (e) {
        console.error('Error in onclose handler:', e);
      }
    } else if (type === 'error' && this.onerror) {
      try {
        this.onerror(event);
      } catch (e) {
        console.error('Error in onerror handler:', e);
      }
    } else if (type === 'message' && this.onmessage) {
      try {
        this.onmessage(event);
      } catch (e) {
        console.error('Error in onmessage handler:', e);
      }
    }
  }
}

export default AdvWebSocket;
