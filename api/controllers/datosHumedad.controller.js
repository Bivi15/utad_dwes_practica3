/* Importado de Bibliotecas */
const datosHumedadModel = require("../models/datosHumedad.models");
const { meteoLogger } = require("../config/winstonLogger.config");
const mongoose = require("mongoose");
const { successResponse, errorResponse, BAD_REQUEST } = require("../utils/handleResponse.utils");
const { notifyClients } = require("../services/ws.service");
const { calcularStats } = require("../utils/stats.utils");

/* Codificación de Funciones */
// GET ALL 
const getHumedades = async (req, res, next) => {
    try {
        //Filtro por sonda
        const filter = { isDelete: false };
        if (req.query.sonda) filter.sonda = req.query.sonda;
        if (req.query.fechaInicio && req.query.fechaFin) {
            filter. fechaMedicion = {
                $gte: new Date (req.query.fechaInicio),
                $lte: new Date (req.query.fechaFin)
            };
        }
        const data = await datosHumedadModel.find(filter).populate('sonda');
        meteoLogger.info("Listado de datos de humedad obtenido");
        successResponse(res, data);
    } catch (err) {
        next(err);
    }
};

//GET BY ID
const getHumedadById = async (req, res, next) => {
    try{
        const data = await datosHumedadModel.findOne({ _id: req.params.id, isDelete: false }).populate('sonda');

        if (!data) {
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        }
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//CREATE
const createHumedad = async (req, res, next) => {
    try{
        const created = await datosHumedadModel.create(req.body);
        const data = await datosHumedadModel.findById(created._id).populate('sonda');

        const stats = await calcularStats(
            datosHumedadModel,
            "humedad",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Humedad",
            campo: "humedad",
            accion: "create",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.info("Medición de humedad creada");
        successResponse(res, data,null, 201);
    }catch (err) {
        next(err);
    }
};

//UPDATE
const updateHumedad = async (req, res, next) => {
    try{
        const data = await datosHumedadModel.findOneAndUpdate({ _id: req.params.id, isDelete: false }, req.body, { new: true }).populate('sonda');
        if (!data){
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        }

        const stats = await calcularStats(
            datosHumedadModel,
            "humedad",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Humedad",
            campo: "humedad",
            accion: "update",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.info("Medición de humedad actualizada");
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//DELETE (lógico)
const deleteHumedad = async (req, res, next) => {
    try{
        const data = await datosHumedadModel.findOneAndUpdate({ _id: req.params.id, isDelete: false }, { isDelete: true }, { new: true }).populate("sonda");
        if (!data){
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        }

        const stats = await calcularStats(
            datosHumedadModel,
            "humedad",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Humedad",
            campo: "humedad",
            accion: "delete",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.warn("Medición de humedad eliminada lógicamente");
        res.json({ error: false, message: "Medición eliminada correctamente" });
    }catch (err) {
        next(err);
    }
};

//Estadísticas
const getStats = async (req, res, next) => {
    try{
        const { fechaInicio, fechaFin, sonda } = req.query;
        const match = { isDelete: false };
        if (sonda && mongoose.Types.ObjectId.isValid(sonda)) {
            match.sonda = mongoose.Types.ObjectId(sonda);
        }
        if (fechaInicio && fechaFin) {
            match.fechaMedicion = { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) };
        }
        const stats = await calcularStats(
            datosHumedadModel,
            "humedad",
            match
        );
        
        res.json({ error: false, stats });
    }catch (err) {
        next(err);
    }
};

/* Exportado de módulo */
module.exports = {
    getHumedades,
    getHumedadById,
    createHumedad,
    updateHumedad,
    deleteHumedad,
    getStats
};