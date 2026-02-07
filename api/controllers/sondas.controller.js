/* Importado de Bibliotecas */
const mongoose = require("mongoose");
const sondasModel = require("../models/sondas.models");
const { meteoLogger } = require("../config/winstonLogger.config");
const { successResponse, errorResponse, BAD_REQUEST } = require("../utils/handleResponse.utils");
const { notifyClients } = require("../services/ws.service")

/* Codificación de Funciones */
// GET ALL 
const getSondas = async (req, res, next) => {
    try {
        const filter = { isDelete: false};
        if (req.query.localizacion) {
            filter.localizacion = {
                $regex: req.query.localizacion,
                $options: "i"
            };
        }
        const data = await sondasModel.find(filter);
        successResponse(res, data,null, 200);
    } catch (err) {
        next(err);
    }
};

//GET BY ID
const getSondaById = async (req, res, next) => {
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return errorResponse(res, "ID de sonda inválido", BAD_REQUEST);
        }
        const data = await sondasModel.findOne({ _id: req.params.id, isDelete: false });

        if (!data){
            return errorResponse(res, "Sonda no encontrada", BAD_REQUEST);
        }
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//CREATE
const createSonda = async (req, res, next) => {
    try{
        const data = await sondasModel.create(req.body);

        notifyClients({
            tipo: "Sonda",
            accion: "create",
            localizacion: data.localizacion,
            data
        });

        meteoLogger.info("Sonda creada");
        successResponse(res, data,null, 201);
    }catch (err) {
        next(err);
    }
};

//UPDATE
const updateSonda = async (req, res, next) => {
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return errorResponse(res, "ID de sonda inválido", BAD_REQUEST);
        }        
        const data = await sondasModel.findOneAndUpdate({ _id: req.params.id, isDelete: false}, req.body, { new: true });
        if (!data){
            return errorResponse(res, "Sonda no encontrada", BAD_REQUEST);
        }

        notifyClients({
            tipo: "Sonda",
            accion: "update",
            localizacion: data.localizacion,
            data
        });

        meteoLogger.info("Sonda actualizada");
        successResponse(res, data);
    }catch (err) {
        next(err);
    }
};

//DELETE
const deleteSonda = async (req, res, next) => {
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return errorResponse(res, "ID de sonda inválido", BAD_REQUEST);
        }        
        const data = await sondasModel.findOneAndUpdate({_id: req.params.id, isDelete: false }, { isDelete: true }, { new: true });
        if (!data) {
            return errorResponse(res, "Sonda no encontrada", BAD_REQUEST);
        }

        notifyClients({
            tipo: "Sonda",
            accion: "delete",
            localizacion: data.localizacion,
            data
        });

        meteoLogger.warn("Sonda eliminada");
        res.json({ error: false, message: "Sonda eliminada correctamente" });
    }catch (err) {
        next(err);
    }
};

/* Exportado de módulo */
module.exports = {
    getSondas,
    getSondaById,
    createSonda,
    updateSonda,
    deleteSonda
};