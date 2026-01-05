import { Request, Response } from "express";
import { PromotionModel } from "../models/Promotion";

export const getPromotions = async (req: Request, res: Response) => {
  try {
    const promos = await PromotionModel.findAll();
    res.json({ success: true, data: promos });
  } catch (error) {
    console.error("Get promotions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPromotionById = async (req: Request, res: Response) => {
  try {
    const promo = await PromotionModel.findById(req.params.id);
    if (!promo)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: promo });
  } catch (error) {
    console.error("Get promotion by id error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createPromotion = async (req: Request, res: Response) => {
  try {
    const id = await PromotionModel.create(req.body);
    const promo = await PromotionModel.findById(id);
    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    console.error("Create promotion error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const updated = await PromotionModel.update(req.params.id, req.body);
    if (!updated)
      return res.status(404).json({ success: false, message: "Not found" });
    const promo = await PromotionModel.findById(req.params.id);
    res.json({ success: true, data: promo });
  } catch (error) {
    console.error("Update promotion error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePromotion = async (req: Request, res: Response) => {
  try {
    const deleted = await PromotionModel.delete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    console.error("Delete promotion error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
