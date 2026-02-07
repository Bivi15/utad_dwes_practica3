/* Importado de Bibliotecas */
const datosAvanzadosModel = require("../models/datosAvanzados.models");
const { meteoLogger } = require("../config/winstonLogger.config");
const mongoose = require("mongoose");
const { successResponse, errorResponse, BAD_REQUEST } = require("../utils/handleResponse.utils");
const { notifyClients } = require("../services/ws.service");
const { calcularStats } = require("../utils/stats.utils");

/* Codificación de Funciones */
// GET ALL 
const getDatosAvanzados = async (req, res, next) => {
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
        const data = await datosAvanzadosModel.find(filter).populate('sonda');
        meteoLogger.info("Listado de datos avanzados obtenido");
        successResponse(res, data);
    } catch (err) {
        next(err);
    }
};

//GET BY ID
const getDatosAvanzadosById = async (req, res, next) => {
    try{
        const data = await datosAvanzadosModel.findOne({ _id: req.params.id, isDelete: false }).populate('sonda');

        if (!data)
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//CREATE
const createDatosAvanzados = async (req, res, next) => {
    try{
        const created = await datosAvanzadosModel.create(req.body);
        const data = await datosAvanzadosModel.findById(created._id).populate('sonda');

        const stats = await calcularStats(
            datosAvanzadosModel,
            "presion",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Presión",
            campo: "presion",
            accion: "create",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.info("Dato avanzado creado");
        successResponse(res, data,null, 201);
    }catch (err) {
        next(err);
    }
};

//UPDATE
const updateDatosAvanzados = async (req, res, next) => {
    try{
        const data = await datosAvanzadosModel.findOneAndUpdate({ _id: req.params.id, isDelete: false}, req.body, {new: true}).populate('sonda');
        if (!data) {
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        }

        const stats = await calcularStats(
            datosAvanzadosModel,
            "presion",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Presión",
            campo: "presion",
            accion: "update",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.info("Dato avanzado actualizado");
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//DELETE (lógico)
const deleteDatosAvanzados = async (req, res, next) => {
    try{
        const data = await datosAvanzadosModel.findOneAndUpdate({ _id: req.params.id, isDelete: false }, { isDelete: true }, { new: true }).populate("sonda");
        if (!data) {
            return errorResponse(res, "Medición no encontrada", BAD_REQUEST);
        }

        const stats = await calcularStats(
            datosAvanzadosModel,
            "presion",
            { sonda: data.sonda._id }
        );

        notifyClients({
            tipo: "Presión",
            campo: "presion",
            accion: "delete",
            localizacion: data.sonda.localizacion,
            data,
            stats
        });

        meteoLogger.warn("Dato avanzado eliminado lógicamente");
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
            datosAvanzadosModel,
            "presion",
            match
        );
        
        res.json({ error: false, stats });
    }catch (err) {
        next(err);
    }
};

/* Exportado de módulo */
module.exports = {
    getDatosAvanzados,
    getDatosAvanzadosById,
    createDatosAvanzados,
    updateDatosAvanzados,
    deleteDatosAvanzados,
    getStats
};