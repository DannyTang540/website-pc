import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { UserModel, AddressRecord } from "../models/User";

export const getAddresses = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const addresses = await UserModel.getAddresses(userId);
    res.json(addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const payload = req.body as AddressRecord;
    const addresses = await UserModel.getAddresses(userId);

    const newAddress: AddressRecord = {
      id: uuidv4(),
      firstName: payload.firstName || "",
      lastName: payload.lastName || "",
      phone: payload.phone || "",
      street: payload.street || "",
      city: payload.city || "",
      district: payload.district || "",
      ward: payload.ward || "",
      isDefault: !!payload.isDefault,
      type: payload.type || "home",
    };

    // If new address is default, unset others
    if (newAddress.isDefault) {
      addresses.forEach((a) => (a.isDefault = false));
    }

    addresses.push(newAddress);
    const ok = await UserModel.saveAddresses(userId, addresses);
    if (!ok) return res.status(500).json({ message: "Failed to save address" });
    res.status(201).json(newAddress);
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  try {
    const payload = req.body as AddressRecord;
    const addresses = await UserModel.getAddresses(userId);
    const idx = addresses.findIndex((a) => a.id === id);
    if (idx === -1)
      return res.status(404).json({ message: "Address not found" });

    // If payload sets isDefault, unset others
    if (payload.isDefault) {
      addresses.forEach((a) => (a.isDefault = false));
    }

    const updated = { ...addresses[idx], ...payload } as AddressRecord;
    addresses[idx] = updated;
    const ok = await UserModel.saveAddresses(userId, addresses);
    if (!ok)
      return res.status(500).json({ message: "Failed to update address" });
    res.json(updated);
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  try {
    const addresses = await UserModel.getAddresses(userId);
    const newArr = addresses.filter((a) => a.id !== id);
    if (newArr.length === addresses.length)
      return res.status(404).json({ message: "Address not found" });
    const ok = await UserModel.saveAddresses(userId, newArr);
    if (!ok)
      return res.status(500).json({ message: "Failed to delete address" });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
