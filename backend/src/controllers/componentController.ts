import { Request, Response } from "express";
import ComponentModel, { ComponentType } from "../models/Component";
import Component from "../models/Component";

// List components (optional filter by type)
export const getComponents = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    console.log(`🔍 Fetching components with type: ${type}`); // Add logging
    // If a type query param is provided, map it to ComponentType (case-insensitive)
    let components;
    if (type) {
      const typeStr = String(type).toLowerCase();
      const matched = (Object.values(ComponentType) as string[]).find(
        (v) => v.toLowerCase() === typeStr
      ) as ComponentType | undefined;

      if (!matched) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Invalid component type. Allowed: ${Object.values(
              ComponentType
            ).join(", ")}`,
          });
      }

      components = await ComponentModel.findAll(matched);
    } else {
      components = await ComponentModel.findAll();
    }

    console.log(
      `✅ Found ${Array.isArray(components) ? components.length : 0} components`
    );

    res.json({ success: true, data: components });
  } catch (error: any) {
    console.error("Error in getComponents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get components",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Create component
export const createComponent = async (req: Request, res: Response) => {
  try {
    // Define the expected request body interface
    interface CreateComponentRequest {
      type: ComponentType; // Use ComponentType instead of string
      name: string;
      attributes?: Record<string, any>;
    }
    const { type, name, attributes } = req.body as CreateComponentRequest;
    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: "Type and name are required",
      });
    }
    // Validate that the type is a valid ComponentType
    if (!Object.values(ComponentType).includes(type as ComponentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid component type. Must be one of: ${Object.values(
          ComponentType
        ).join(", ")}`,
      });
    }
    // Create the component data with proper typing
    const componentData = {
      type: type as ComponentType, // Ensure type is ComponentType
      name,
      attributes: attributes || {},
      status: "active" as const,
    };
    const id = await ComponentModel.create(componentData);

    return res.status(201).json({
      success: true,
      data: { id },
    });
  } catch (error: unknown) {
    console.error("Error creating component:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to create component";

    return res.status(500).json({
      success: false,
      message: "Error creating component",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
};

// Update component
export const updateComponent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body as Partial<Component>;
    const ok = await ComponentModel.update(id, data);
    if (!ok)
      return res
        .status(404)
        .json({ success: false, message: "Component not found" });
    const updated = await ComponentModel.findById(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating component:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating component" });
  }
};

// Delete component (soft)
export const deleteComponent = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const ok = await ComponentModel.delete(id);
    if (!ok)
      return res
        .status(404)
        .json({ success: false, message: "Component not found" });
    res.json({ success: true, message: "Component deleted" });
  } catch (error) {
    console.error("Error deleting component:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting component" });
  }
};

// Validate compatibility between provided components
// Expects body: { components: [{ type, id?, attributes? }, ...] }
export const validateCompatibility = async (req: Request, res: Response) => {
  try {
    const body = req.body as any;
    const items = body.components as Array<any> | undefined;
    if (!items || !Array.isArray(items)) {
      return res
        .status(400)
        .json({ success: false, message: "components array required" });
    }

    // Helper: resolve component data (from id or inline attributes)
    const resolved: Record<string, any> = {};
    for (const it of items) {
      if (!it.type) continue;
      if (it.id) {
        const comp = await ComponentModel.findById(it.id);
        resolved[it.type] = comp
          ? { ...comp, attributes: comp.attributes || {} }
          : null;
      } else {
        resolved[it.type] = { attributes: it.attributes || {} };
      }
    }

    const errors: string[] = [];

    // Rule: Main (motherboard) socket must match CPU socket
    const main = resolved["Main"];
    const cpu = resolved["CPU"];
    if (main && cpu) {
      const mainSockets =
        main.attributes.socket || main.attributes.supportedSockets || null;
      const cpuSocket = cpu.attributes.socket || null;
      if (mainSockets && cpuSocket) {
        if (Array.isArray(mainSockets)) {
          if (!mainSockets.includes(cpuSocket)) {
            errors.push("CPU socket does not match the selected motherboard");
          }
        } else if (mainSockets !== cpuSocket) {
          errors.push("CPU socket does not match the selected motherboard");
        }
      }
    }

    // Rule: RAM type must be supported by Main
    const ram = resolved["RAM"];
    if (main && ram) {
      const mainRam = main.attributes.ramType || main.attributes.ram || null;
      const ramType = ram.attributes.type || ram.attributes.ramType || null;
      if (mainRam && ramType && mainRam !== ramType) {
        errors.push("RAM type is not compatible with the selected motherboard");
      }
    }

    // Rule: NVMe support for SSD
    const ssd = resolved["SSD"];
    if (main && ssd) {
      const nvmeRequired =
        ssd.attributes.nvme === true || ssd.attributes.nvme === "true";
      const mainNvme =
        main.attributes.nvmeSupport === true ||
        main.attributes.nvmeSupport === "true";
      if (nvmeRequired && !mainNvme) {
        errors.push(
          "Selected motherboard does not support NVMe required by the storage"
        );
      }
    }

    // Rule: PSU wattage must cover CPU+VGA estimated TDP
    const psu = resolved["PSU"];
    const vga = resolved["VGA"];
    if (psu) {
      const psuW = Number(psu.attributes.watts || psu.attributes.watt || 0);
      let required = 0;
      const cpuTdp = Number(cpu?.attributes?.tdp || 0);
      const vgaTdp = Number(vga?.attributes?.tdp || 0);
      required += cpuTdp + vgaTdp;
      // add margin
      required = Math.ceil(required * 1.2);
      if (psuW && required && psuW < required) {
        errors.push(
          `PSU wattage (${psuW}W) may be insufficient for estimated TDP ${required}W`
        );
      }
    }

    const success = errors.length === 0;
    res.json({ success, errors });
  } catch (error) {
    console.error("Error validating compatibility:", error);
    res
      .status(500)
      .json({ success: false, message: "Error validating compatibility" });
  }
};

export default {
  getComponents,
  createComponent,
  updateComponent,
  deleteComponent,
  validateCompatibility,
};
