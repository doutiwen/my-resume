class MockWebSocket {
  constructor(url, options = {}, dataSource = null) {
    this.url = url;
    this.options = {
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      connectionTimeout: 5000,
      simulateNetworkIssues: true,
      ...options,
    };

    this.dataSource = dataSource;

    this.readyState = MockWebSocket.CONNECTING;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.connectionTimer = null;
    this.listeners = {};

    this.connect();
  }

  connect() {
    if (this.readyState === MockWebSocket.CONNECTING) {
      clearTimeout(this.connectionTimer);
    }

    this.readyState = MockWebSocket.CONNECTING;
    this.dispatchEvent('connecting');

    this.connectionTimer = setTimeout(
      () => {
        if (Math.random() > 0.2 || !this.options.simulateNetworkIssues) {
          this.readyState = MockWebSocket.OPEN;
          this.reconnectAttempts = 0;
          this.dispatchEvent('open', { type: 'open', target: this });
          this.startSimulatedMessages();
        } else {
          this.handleConnectionError(new Error('Connection failed'));
        }
      },
      1000 + Math.random() * 2000
    );
  }

  handleConnectionError(error) {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent('error', { type: 'error', error, target: this });

    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.dispatchEvent('close', {
        type: 'close',
        code: 1006,
        reason: 'Max reconnect attempts reached',
        wasClean: false,
        target: this,
      });
    }
  }

  startSimulatedMessages() {
    if (this.messageInterval) return;

    this.messageInterval = setInterval(
      () => {
        if (
          this.readyState === MockWebSocket.OPEN &&
          this.options.simulateNetworkIssues &&
          Math.random() > 0.95
        ) {
          this.simulateDisconnect();
          return;
        }

        if (this.readyState === MockWebSocket.OPEN) {
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

          this.dispatchEvent('message', {
            type: 'message',
            data: messageData.data || messageData,
            target: this,
          });
        }
      },
      2000 + Math.random() * 3000
    );
  }

  simulateDisconnect() {
    clearInterval(this.messageInterval);
    this.messageInterval = null;
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent('close', {
      type: 'close',
      code: 1006,
      reason: 'Simulated network disconnect',
      wasClean: false,
      target: this,
    });

    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    console.log('MockWebSocket send:', data);
    this.dispatchEvent('send', { type: 'send', data, target: this });

    if (this.options.simulateNetworkIssues && Math.random() > 0.8) {
      setTimeout(
        () => {
          this.dispatchEvent('message', {
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

  close(code = 1000, reason = '') {
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.connectionTimer);
    clearInterval(this.messageInterval);

    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent('close', { type: 'close', code, reason, wasClean: true, target: this });
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

  dispatchEvent(type, event) {
    if (!this.listeners[type]) return;
    this.listeners[type].forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in event listener:', e);
      }
    });
  }

  onopen(callback) {
    this.addEventListener('open', callback);
  }

  onclose(callback) {
    this.addEventListener('close', callback);
  }

  onerror(callback) {
    this.addEventListener('error', callback);
  }

  onmessage(callback) {
    this.addEventListener('message', callback);
  }
}

MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

export default MockWebSocket;
