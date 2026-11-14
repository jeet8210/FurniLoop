import { Router } from "express";
import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import User from "../models/User.js";
import requireUser from "../middleware/requireUser.js";
import Category from "../models/Category.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const {
      q,
      category,
      city,
      minPrice,
      maxPrice,
      sort = "newest",
      page = 1,
      limit = 24,
    } = req.query;
    const filter = { status: "ACTIVE" };
    if (category) filter.category = category;
    const place = String(city || "")
      .trim()
      .replace(/\s+/g, " ");
    if (place) {
      const parts = place
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      if (parts.length >= 2) {
        const area = parts.slice(0, -1).join(", ");
        const cityName = parts[parts.length - 1];

        filter["location.area"] = new RegExp(`^${escapeRegex(area)}$`, "i");
        filter["location.city"] = new RegExp(`^${escapeRegex(cityName)}$`, "i");
      } else {
        const exactPlace = new RegExp(`^${escapeRegex(place)}$`, "i");

        filter.$or = [
          { "location.city": exactPlace },
          { "location.area": exactPlace },
        ];
      }
    }
    if (q) filter.$text = { $search: q };
    if (minPrice || maxPrice)
      filter.price = {
        ...(minPrice &&
          Number.isFinite(Number(minPrice)) && { $gte: Number(minPrice) }),
        ...(maxPrice &&
          Number.isFinite(Number(maxPrice)) && { $lte: Number(maxPrice) }),
      };
    const sortBy =
      sort === "price_asc"
        ? { price: 1 }
        : sort === "price_desc"
          ? { price: -1 }
          : { createdAt: -1 };
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(48, Math.max(1, Number(limit) || 24));
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate("seller", "name")
        .sort(sortBy)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Listing.countDocuments(filter),
    ]);
    res.json({
      listings,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Could not load listings", error: error.message });
  }
});

router.get("/mine", requireUser, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ listings });
  } catch {
    res.status(500).json({ message: "Could not load your listings." });
  }
});

router.post("/", requireUser, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      originalPrice,
      condition,
      material,
      dimensions,
      purchaseYear,
      images = [],
      city,
      area,
    } = req.body;
    if (
      !Array.isArray(images) ||
      images.length > 8 ||
      images.some((image) => typeof image !== "string" || image.length > 500)
    )
      return res.status(400).json({ message: "Add up to 8 valid photo URLs." });
    if (!(await Category.exists({ name: category, active: true })))
      return res
        .status(400)
        .json({ message: "Choose an active furniture category." });
    const listing = await Listing.create({
      title,
      description,
      category,
      price,
      originalPrice,
      condition,
      material,
      dimensions,
      purchaseYear,
      images,
      location: { city, area },
      seller: req.user._id,
      status: "ACTIVE",
    });
    await listing.populate("seller", "name");
    res.status(201).json({ listing });
  } catch (error) {
    if (error.name === "ValidationError")
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((item) => item.message)
          .join(" "),
      });
    res.status(500).json({ message: "Could not create this listing." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(404).json({ message: "Listing not found." });
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: "ACTIVE" },
      { $inc: { views: 1 } },
      { new: true },
    ).populate("seller", "name");
    if (!listing)
      return res.status(404).json({ message: "Listing not found." });
    res.json({ listing });
  } catch {
    res.status(500).json({ message: "Could not load this listing." });
  }
});

router.patch("/:id", requireUser, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ message: "Listing not found." });
  const allowed = [
    "title",
    "description",
    "category",
    "price",
    "originalPrice",
    "condition",
    "material",
    "dimensions",
    "purchaseYear",
    "images",
  ];
  const update = Object.fromEntries(
    allowed
      .filter((key) => req.body[key] !== undefined)
      .map((key) => [key, req.body[key]]),
  );
  if (
    req.body.status &&
    ["ACTIVE", "SOLD", "INACTIVE"].includes(req.body.status)
  )
    update.status = req.body.status;
  if (req.body.city || req.body.area)
    update.location = { city: req.body.city, area: req.body.area };
  try {
    if (
      update.category &&
      !(await Category.exists({ name: update.category, active: true }))
    )
      return res
        .status(400)
        .json({ message: "Choose an active furniture category." });
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      update,
      { new: true, runValidators: true },
    ).populate("seller", "name");
    if (!listing)
      return res.status(404).json({ message: "Listing not found." });
    res.json({ listing });
  } catch (error) {
    if (error.name === "ValidationError")
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((item) => item.message)
          .join(" "),
      });
    res.status(500).json({ message: "Could not update this listing." });
  }
});

router.delete("/:id", requireUser, async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      { status: "INACTIVE" },
      { new: true },
    );
    if (!listing)
      return res.status(404).json({ message: "Listing not found." });
    res.json({ message: "Listing hidden from the marketplace." });
  } catch {
    res.status(500).json({ message: "Could not hide this listing." });
  }
});

router.post("/:id/favorite", requireUser, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(404).json({ message: "Listing not found." });
    const listingExists = await Listing.exists({
      _id: req.params.id,
      status: "ACTIVE",
    });
    if (!listingExists)
      return res.status(404).json({ message: "Listing not found." });
    const hasFavorite = req.user.favorites.some((id) =>
      id.equals(req.params.id),
    );
    await User.updateOne(
      { _id: req.user._id },
      hasFavorite
        ? { $pull: { favorites: req.params.id } }
        : { $addToSet: { favorites: req.params.id } },
    );
    res.json({ saved: !hasFavorite });
  } catch {
    res.status(500).json({ message: "Could not update your saved listings." });
  }
});

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default router;
