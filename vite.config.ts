import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function suppressHmrWebsocketPlugin(): Plugin {
  return {
    name: 'suppress-hmr-websocket',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'text/javascript' },
          children: `
            (function() {
              // Suppress HMR WebSocket closure errors in preview container environment
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && (String(event.reason).includes('WebSocket') || String(event.reason?.message).includes('WebSocket'))) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
              });
              window.addEventListener('error', function(event) {
                if (event.message && (String(event.message).includes('WebSocket') || String(event.message).includes('websocket'))) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
              });

              const OrigWebSocket = window.WebSocket;
              if (OrigWebSocket) {
                window.WebSocket = function(url, protocols) {
                  const isViteHmr =
                    protocols === 'vite-hmr' ||
                    (Array.isArray(protocols) && protocols.includes('vite-hmr')) ||
                    (typeof url === 'string' && (url.includes('token=') && (url.includes('24678') || url.includes('5173'))));

                  if (isViteHmr) {
                    const listeners = {};
                    const fakeSocket = {
                      binaryType: 'blob',
                      bufferedAmount: 0,
                      extensions: '',
                      protocol: 'vite-hmr',
                      readyState: 1, // WebSocket.OPEN
                      url: String(url),
                      CONNECTING: 0,
                      OPEN: 1,
                      CLOSING: 2,
                      CLOSED: 3,
                      onopen: null,
                      onmessage: null,
                      onerror: null,
                      onclose: null,
                      addEventListener: function(type, listener) {
                        if (!listeners[type]) listeners[type] = [];
                        listeners[type].push(listener);
                        if (type === 'open') {
                          setTimeout(function() {
                            try {
                              listener({ type: 'open' });
                              if (fakeSocket.onopen) fakeSocket.onopen({ type: 'open' });
                            } catch (e) {}
                          }, 0);
                        }
                      },
                      removeEventListener: function(type, listener) {
                        if (listeners[type]) {
                          listeners[type] = listeners[type].filter(function(l) { return l !== listener; });
                        }
                      },
                      dispatchEvent: function() { return true; },
                      send: function() {},
                      close: function() {
                        fakeSocket.readyState = 3;
                      }
                    };
                    return fakeSocket;
                  }
                  return new OrigWebSocket(url, protocols);
                };
                window.WebSocket.prototype = OrigWebSocket.prototype;
                window.WebSocket.CONNECTING = OrigWebSocket.CONNECTING;
                window.WebSocket.OPEN = OrigWebSocket.OPEN;
                window.WebSocket.CLOSING = OrigWebSocket.CLOSING;
                window.WebSocket.CLOSED = OrigWebSocket.CLOSED;
              }
            })();
          `,
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [suppressHmrWebsocketPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio environment to prevent WebSocket connection failures and flickering
      hmr: false,
      watch: null,
    },
  };
});
