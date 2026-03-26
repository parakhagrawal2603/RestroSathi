const Category = require('./category.model');
const mongoose = require('mongoose');
const MenuItem = require('./menuItem.model');
const TimeSlot = require('./timeSlot.model');
const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');

const DEFAULT_MENU_IMAGE = "https://via.placeholder.com/300";

const getImageFromPexels = async (query) => {
  const searchQuery = `${query} food`;
  console.log("Fetching image for:", searchQuery);
  console.log("API KEY:", process.env.PEXELS_API_KEY ? "EXISTS" : "MISSING");
  
  if (!process.env.PEXELS_API_KEY || process.env.PEXELS_API_KEY === 'your_pexels_api_key_here') {
    console.warn('[PEXELS API] Missing or dummy API Key. Using default image.');
    return DEFAULT_MENU_IMAGE;
  }
  
  try {
    const response = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1`, {
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });

    console.log("Pexels Response:", JSON.stringify(response.data, null, 2));

    if (response.data.photos && response.data.photos.length > 0) {
      const imageUrl = response.data.photos[0].src.medium;
      console.log("Final Image:", imageUrl);
      return imageUrl;
    }
    
    console.log("No photos found for:", searchQuery);
    return DEFAULT_MENU_IMAGE;
  } catch (error) {
    console.error(`[PEXELS API] Error fetching image for "${searchQuery}":`, error.response?.data || error.message);
    return DEFAULT_MENU_IMAGE;
  }
};

exports.createTimeSlot = async (restaurantId, data) => {
  return await TimeSlot.create({ restaurantId, ...data });
};

exports.getTimeSlots = async (restaurantId) => {
  return await TimeSlot.find({ restaurantId });
};

exports.deleteTimeSlot = async (restaurantId, id) => {
  const slot = await TimeSlot.findOneAndDelete({ _id: id, restaurantId });
  if (!slot) throw new Error('TimeSlot not found');
  return slot;
};

exports.createCategory = async (restaurantId, name) => {
  return await Category.create({ restaurantId, name });
};

exports.getCategories = async (restaurantId) => {
  return await Category.find({ restaurantId });
};

exports.deleteCategory = async (restaurantId, id) => {
  // Check if any menu items are linked to this category
  const itemExists = await MenuItem.findOne({ categoryId: id, restaurantId });
  if (itemExists) {
    throw new Error('Cannot delete category with linked menu items. Reassign or delete items first.');
  }

  const category = await Category.findOneAndDelete({ _id: id, restaurantId });
  if (!category) throw new Error('Category not found');
  return category;
};

exports.createMenuItem = async (restaurantId, data) => {
  const { name, price, categoryId, isVeg, availabilityMode, timeSlotIds, image } = data;

  if (!name || !price || !categoryId) {
    throw new Error('Missing required fields: name, price, and categoryId are required');
  }

  return await MenuItem.create({
    restaurantId,
    name, 
    price: Number(price), 
    categoryId, 
    isVeg: isVeg !== false, // default true
    availabilityMode: availabilityMode || 'auto',
    timeSlotIds: Array.isArray(timeSlotIds) 
      ? [...new Set(timeSlotIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => id.toString()))] 
      : [],
    image: image || DEFAULT_MENU_IMAGE
  });
};

exports.updateMenuItem = async (restaurantId, id, updateData) => {
  if (updateData.timeSlotIds && Array.isArray(updateData.timeSlotIds)) {
    const validIds = updateData.timeSlotIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    updateData.timeSlotIds = [...new Set(validIds.map(id => id.toString()))];
  }

  const menuItem = await MenuItem.findOneAndUpdate(
    { _id: id, restaurantId },
    updateData,
    { new: true }
  );
  if (!menuItem) throw new Error('Menu item not found');
  return menuItem;
};

exports.deleteMenuItem = async (restaurantId, id) => {
  const menuItem = await MenuItem.findOneAndDelete({ _id: id, restaurantId });
  if (!menuItem) throw new Error('Menu item not found');
  return menuItem;
};

exports.getMenu = async (restaurantId, filterByTime = false) => {
  if (!restaurantId) throw new Error('restaurantId required');

  const categories = await Category.find({ restaurantId }).lean();
  let items = await MenuItem.find({ restaurantId }).populate('timeSlotIds').lean();

  const now = new Date();
  // Using local server time in military format HH:mm
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${hours}:${mins}`;

  // Find active time slots efficiently using DB query
  const activeSlots = await TimeSlot.find({
    restaurantId,
    $or: [
      {
        // Normal slot (e.g., 08:00 to 12:00)
        $and: [
          { $expr: { $lte: ['$startTime', '$endTime'] } },
          { startTime: { $lte: currentTimeStr } },
          { endTime: { $gte: currentTimeStr } }
        ]
      },
      {
        // Past-midnight slot (e.g., 22:00 to 02:00)
        $and: [
          { $expr: { $gt: ['$startTime', '$endTime'] } },
          { $or: [{ startTime: { $lte: currentTimeStr } }, { endTime: { $gte: currentTimeStr } }] }
        ]
      }
    ]
  }).lean();

  const activeSlotIds = activeSlots.map(slot => slot._id.toString());

  // Dynamically control availability based on availabilityMode (in-memory response mutation only)
  items = items.map(item => {
    // 1. Explicit Manual ON
    if (item.availabilityMode === 'on') {
      item.isAvailable = true;
    } 
    // 2. Explicit Manual OFF
    else if (item.availabilityMode === 'off') {
      item.isAvailable = false;
    } 
    // 3. Automated mode (Follow Time Slots)
    else {
      if (item.timeSlotIds && item.timeSlotIds.length > 0) {
        // Check if current time falls within ANY of its assigned slots
        const hasActiveSlot = item.timeSlotIds.some(slot => {
          const slotIdStr = slot._id ? slot._id.toString() : slot.toString();
          return activeSlotIds.includes(slotIdStr);
        });
        
        // Update availability based on time slot
        item.isAvailable = hasActiveSlot;
      } else {
        // If no time slots are assigned, item is always available by default
        item.isAvailable = true;
      }
    }
    return item;
  });

  return { categories, items };
};

exports.bulkUpload = (restaurantId, filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    console.log(`[BULK UPLOAD] Starting upload for restaurant: ${restaurantId}`);
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`[BULK UPLOAD] Finished parsing CSV. Total rows: ${results.length}`);
        try {
          // 0. Fetch all time slots for this restaurant once
          const allTimeSlots = await TimeSlot.find({ restaurantId });
          const allSlotIds = allTimeSlots.map(slot => slot._id);
          
          if (allSlotIds.length === 0) {
            console.warn(`[BULK UPLOAD] Warning: No time slots found for restaurant ${restaurantId}. Items will have empty timeSlotIds.`);
          }

          const report = {
            total: results.length,
            successCount: 0,
            failedCount: 0,
            errors: []
          };

          const imageCache = {}; // Session cache to avoid duplicate API calls for same items

          for (let i = 0; i < results.length; i++) {
            const rawRow = results[i];
            const rowNum = i + 2; // +1 for 0-index, +1 for CSV header

            try {
              // 1. Trim values and extract headers
              const itemName = (rawRow['Item Detail'] || '').trim();
              const categoryName = (rawRow['Category'] || '').trim();
              const priceStr = (rawRow['Price'] || '').trim();
              const typeStr = (rawRow['Type'] || '').trim();
              
              let image = rawRow['Image']?.trim();
              if (!image) {
                if (imageCache[itemName]) {
                  image = imageCache[itemName];
                } else {
                  image = await getImageFromPexels(itemName);
                  imageCache[itemName] = image;
                }
              }

              // 2. Validate required fields
              if (!itemName || !categoryName || !priceStr) {
                throw new Error('Missing required fields: Item Detail, Category, or Price');
              }

              const price = Number(priceStr);
              if (isNaN(price) || price < 0) {
                throw new Error(`Invalid price format: ${priceStr}`);
              }

              // 3. Map Type (isVeg)
              const isVeg = typeStr.toLowerCase() === 'veg';

              // 4. Create category if not exists
              let category = await Category.findOne({ name: categoryName, restaurantId });
              if (!category) {
                console.log(`[BULK UPLOAD] Creating new category: ${categoryName}`);
                category = await Category.create({ name: categoryName, restaurantId });
              }

              // 5. Create or update menu item with DEFAULT availability logic
              const itemData = {
                restaurantId,
                name: itemName,
                price: price,
                categoryId: category._id,
                isVeg: isVeg,
                availabilityMode: 'auto', // Use auto-scheduling
                timeSlotIds: allSlotIds,   // Link to all available slots by default
                image: image
              };

              // Check if item already exists to update it, otherwise create
              const existingItem = await MenuItem.findOne({ name: itemName, restaurantId });
              if (existingItem) {
                console.log(`[BULK UPLOAD] Updating existing item: ${itemName}`);
                await MenuItem.findByIdAndUpdate(existingItem._id, itemData);
              } else {
                console.log(`[BULK UPLOAD] Creating new item: ${itemName}`);
                await MenuItem.create(itemData);
              }

              report.successCount++;
            } catch (err) {
              console.error(`[BULK UPLOAD] Error on Row ${rowNum}:`, err.message);
              report.failedCount++;
              report.errors.push(`Row ${rowNum} (${rawRow['Item Detail'] || 'Unknown'}): ${err.message}`);
            }
          }

          console.log(`[BULK UPLOAD] Completion Report: ${report.successCount} success, ${report.failedCount} failed.`);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          resolve(report);
        } catch (error) {
          console.error('[BULK UPLOAD] Critical error processing rows:', error);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('[BULK UPLOAD] Stream parsing error:', error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(error);
      });
  });
};
