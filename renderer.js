const button = document.getElementById("myButton");

button.addEventListener("click", function () {
  window.electronAPI.sendIPCMessage("button-clicked");
});

window.electronAPI.receiveIPCMessage("message", function (message) {
  alert(message);
});
