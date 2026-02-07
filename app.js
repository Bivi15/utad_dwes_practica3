/* Importado de Bibliotecas */
// Bibliotecas externas
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const swaggerUI = require("swagger-ui-express");
const swaggerSpecs = require("./api/docs/swagger.docs");
const webSocket = require("ws");
const { setNotifier } = require("./api/services/ws.service");
const { appLogger } = require("./api/config/winstonLogger.config");

/* Ejecución Principal */
// Inicializamos el servidor web
const app = express();

// Le instalamos las políticas
app.use(cors());
app.use(express.json());

//Swagger
app.use(
    "/api-docs",
    swaggerUI.serve,
    swaggerUI.setup(swaggerSpecs)
);

app.use(express.static("public"));

// Cargamos las rutas
app.use("/api/v1", require("./api/routes"));


//Middleware 404
app.use((req, res) => {
    res.status(404).json({
        error: true,
        message: "Endpoint no encontrado"
    });
});

// Middleware global
if (process.env.NODE_ENV !== "test") {
    const errorMiddleware = require("./api/middlewares/error.middleware");
    appLogger.info("Swagger disponible en /api-docs");
    appLogger.info("Rutas montadas en /api/v1");

    app.use(errorMiddleware);
};

module.exports = app;