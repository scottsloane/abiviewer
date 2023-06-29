const { app, BrowserWindow, ipcMain } = require("electron");
const { MongoClient } = require("mongodb");
const config = require("./config.json");

function recursiveJSONParse(json) {
  try {
    let obj = JSON.parse(json);
    for (let key of Object.keys(obj)) {
      try {
        console.log(key);
        let val = recursiveJSONParse(obj[key]);
        obj[key] = val;
      } catch (err) {
        console.error(err);
      }
    }
    return obj;
  } catch (err) {
    return json;
  }
}

let client = null;
(async () => {
  client = await MongoClient.connect(config.mongo.uri, {
    useUnifiedTopology: true,
  });
})();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  mainWindow.webContents.openDevTools();
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Event handler for asynchronous incoming messages
ipcMain.on("asynchronous-message", (event, arg) => {
  console.log(arg);

  // Event emitter for sending asynchronous messages
  event.sender.send("asynchronous-reply", "async pong");
});

// Event handler for synchronous incoming messages
ipcMain.on("synchronous-message", (event, arg) => {
  console.log(arg);

  // Synchronous event emmision
  event.returnValue = "sync pong";
});

let collection = "trane";

ipcMain.on("set-collection", async (event, arg) => {
  collection = arg;
});

let idx = 0;
ipcMain.on("event", async (event, arg) => {
  if (client) {
    db = client.db(config.mongo.db);
    let doc = await db
      .collection(collection)
      .findOne({}, { skip: idx++, sort: { $natural: -1 } });

    event.sender.send(
      "write-doc",
      `<json-viewer>${JSON.stringify(doc)}</json-viewer>
           <script src="https://unpkg.com/@alenaksu/json-viewer@2.0.0/dist/json-viewer.bundle.js"></script>`
    );

    let type =
      doc.headers.response["Content-Type"] ||
      doc.headers.response["content-type"];
    type = type.split(";")[0];
    console.log(type);
    switch (type) {
      case "text/html":
        event.sender.send("write-content", doc.body);
        break;
      case "image/png":
        event.sender.send(
          "write-content",
          `<img src="data:image/png;base64,${doc.body}" />`
        );
        break;
      case "application/json":
        event.sender.send(
          "write-content",
          `<json-viewer>${doc.body}</json-viewer>
           <script src="https://unpkg.com/@alenaksu/json-viewer@2.0.0/dist/json-viewer.bundle.js"></script>`
        );
        break;
      default:
        event.sender.send("write-content", doc.body);
    }
  }
});

app.on("ready", createWindow);
