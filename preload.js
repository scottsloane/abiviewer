const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  sendIPCMessage: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receiveIPCMessage: (channel, callback) => {
    ipcRenderer.on(channel, (event, data) => {
      callback(data);
    });
  },
});
