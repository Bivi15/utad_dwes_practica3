/* Importado de Bibliotecas */
// Bibliotecas propias
console.log("server.js ejecutándose");
const https = require("https");
const fs = require("fs");
const path = require("path");
const webSocket = require("ws");
const app = require("./app");
const connectToMongoDB = require("./api/config/mongodb.config");
const { appLogger } = require("./api/config/winstonLogger.config");
const { setNotifier } = require("./api/services/ws.service");

/* Declaraciones Globales */
const PORT = process.env.PORT || 4000;

//Certificados
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, "certs/localhost-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "certs/localhost.pem"))
};

// Inicializamos el servidor web
(async () => {
    try {
        console.log("Conectando a MongoDB");
        await connectToMongoDB();
        console.log("MongoDB conectado");

        const server = https.createServer(httpsOptions, app);

        //WS
        const wss = new webSocket.Server({ server });
        const clients = new Map();

        wss.on("connection", (ws) => {
            appLogger.info("Cliente conectado por WS");
            clients.set(ws, { localizacion: null });

            ws.on("message", (message) => {
                try {
                    const data = JSON.parse(message);
                    if (!data.type) {
                        return ws.send(JSON.stringify({ error: "Tipo de mensaje requerido" }));
                    }

                    if(data.type === "subscribe") {
                        clients.set(ws, {
                            localizacion: data.localizacion || null
                        });
                        ws.send(JSON.stringify({
                            message: "Suscripción actualizada",
                            localizacion: data.localizacion || "todas"
                        }));
                    }
                }catch {
                    ws.send(JSON.stringify({ error: "Formato inválido "}));
                }
            });

            ws.on("close", () => {
                clients.delete(ws);
                appLogger.info("Cliente deconectado");
            });
        });

        const notifyClients = (payload) => {
            let enviados = 0;
            wss.clients.forEach((client) => {
                if (client.readyState === webSocket.OPEN) {
                    const subscription = clients.get(client);

                    if(!subscription?.localizacion || subscription.localizacion === payload.localizacion) {
                        client.send(JSON.stringify(payload));
                        enviados++;
                    }
                }
            });

            appLogger.info(`[WS] ${payload.accion?.toUpperCase()} ${payload.tipo} = ${payload.localizacion} (clientes: ${enviados})`);
        };

        setNotifier(notifyClients);

        server.listen(PORT, () => {
            appLogger.info(`Servidor escuchando en https://localhost: ${PORT}`);
        });
        
    } catch (error) {
        appLogger.error("Error al conectar con MongoDB", error);
        process.exit(1);
    }
})();