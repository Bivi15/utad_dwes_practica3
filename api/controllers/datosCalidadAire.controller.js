/* Importado de Bibliotecas */
const datosCalidadAireModel = require("../models/datosCalidadAire.models");
const { meteoLogger } = require("../config/winstonLogger.config");
const mongoose = require("mongoose");
const { successResponse, errorResponse, BAD_REQUEST } = require("../utils/handleResponse.utils");
const { notifyClients } = require("../services/ws.service");
const { calcularStats } = require("../utils/stats.utils");

/* Codificación de Funciones */
// GET ALL 
const getCalidades = async (req, res, next) => {
    try {
        //Filtro por sonda
        const filter = { isDelete: false };
        if (req.query.sonda) filter.sonda = req.query.sonda;
        if (req.query.fechaInicio && req.query.fechaFin) {
            filter.fechaMedicion = {
                $gte: new Date (req.query.fechaInicio),
                $lte: new Date (req.query.fechaFin)
            };
        }
        const data = await datosCalidadAireModel.find(filter).populate('sonda');
        meteoLogger.info("Listado de calidad del aire obtenido");
        successResponse(res, data);
    } catch (err) {
        next(err);
    }
};

//GET BY ID
const getCalidadById = async (req, res, next) => {
    try{
        const data = await datosCalidadAireModel.findOne({ _id: req.params.id, isDelete: false }).populate('sonda');

        if (!data)
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//CREATE
const createCalidad = async (req, res, next) => {
    try{
        const created = await datosCalidadAireModel.create(req.body);
        const data = await datosCalidadAireModel.findById(created._id).populate('sonda');

        const stats = await calcularStats(
            datosCalidadAireModel,
            "indiceCalidad",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Calidad_aire",
            campo: "indiceCalidad",
            accion: "create",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.info("Medición de calidad del aire creada");
        successResponse(res, data,null, 201);
    }catch (err) {
        next(err);
    };
};

//UPDATE
const updateCalidad = async (req, res, next) => {
    try{
        const data = await datosCalidadAireModel.findOneAndUpdate({ _id: req.params.id, isDelete: false }, req.body, { new: true }).populate('sonda');
        if (!data) {
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        }

        const stats = await calcularStats(
            datosCalidadAireModel,
            "indiceCalidad",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Calidad_aire",
            campo: "indiceCalidad",
            accion: "update",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.info("Medición de calidad del aire actualizada");
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//DELETE (lógico)
const deleteCalidad = async (req, res, next) => {
    try{
        const data = await datosCalidadAireModel.findOneAndUpdate({ _id: req.params.id, isDelete: false }, { isDelete: true }, { new: true }).populate("sonda");
        if (!data) {
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        }

        const stats = await calcularStats(
            datosCalidadAireModel,
            "indiceCalidad",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Calidad_aire",
            campo: "indiceCalidad",
            accion: "delete",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.warn("Medición de calidad del aire eliminada lógicamente");
        res.json({ error: false, message: "Medición eliminada correctamente"});
    }catch (err) {
        next(err);
    }
};

//Estadísticas
const getStats = async (req, res, next) => {
    try{
        const { fechaInicio, fechaFin, sonda } = req.query;
        const match = { };
        if (sonda && mongoose.Types.ObjectId.isValid(sonda)) {
            match.sonda = mongoose.Types.ObjectId(sonda);
        }
        if (fechaInicio && fechaFin) {
            match.fechaMedicion = { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) };
        }
        const stats = await calcularStats(
            datosCalidadAireModel,
            "indiceCalidad",
            match
        );

        res.json({ error: false, stats });
    }catch (err) {
        next(err);
    }
};

//WS


/* Exportado de módulo */
module.exports = {
    getCalidades,
    getCalidadById,
    createCalidad,
    updateCalidad,
    deleteCalidad,
    getStats
};