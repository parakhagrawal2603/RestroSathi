const menuService = require('./menu.service');
const fs = require('fs');

exports.createCategory = async (req, res) => {
  try {
    const category = await menuService.createCategory(req.user.restaurantId, req.body.name);
    res.status(201).json(category);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await menuService.getCategories(req.user.restaurantId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await menuService.deleteCategory(req.user.restaurantId, req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    const status = error.message.includes('linked menu items') ? 400 : 
                   error.message === 'Category not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = await menuService.createMenuItem(req.user.restaurantId, req.body);
    res.status(201).json(menuItem);
  } catch (error) { 
    const status = error.message.includes('required') ? 400 : 500;
    res.status(status).json({ message: error.message }); 
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const menuItem = await menuService.updateMenuItem(req.user.restaurantId, req.params.id, req.body);
    
    // Socket emit
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.restaurantId.toString()).emit('menuUpdated', menuItem);
    }

    res.json(menuItem);
  } catch (error) { 
    res.status(error.message === 'Menu item not found' ? 404 : 500).json({ message: error.message }); 
  }
};

exports.updateMenuItemAvailability = async (req, res) => {
  try {
    const { availabilityMode } = req.body;
    if (!['auto', 'on', 'off'].includes(availabilityMode)) {
      return res.status(400).json({ message: 'Invalid availabilityMode. Must be "auto", "on", or "off"' });
    }

    const menuItem = await menuService.updateMenuItem(req.user.restaurantId, req.params.id, { availabilityMode });
    
    // Socket emit
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.restaurantId.toString()).emit('menuUpdated', menuItem);
    }

    res.json(menuItem);
  } catch (error) { 
    res.status(error.message === 'Menu item not found' ? 404 : 500).json({ message: error.message }); 
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    await menuService.deleteMenuItem(req.user.restaurantId, req.params.id);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) { 
    res.status(error.message === 'Menu item not found' ? 404 : 500).json({ message: error.message }); 
  }
};

exports.createTimeSlot = async (req, res) => {
  try {
    const slot = await menuService.createTimeSlot(req.user.restaurantId, req.body);
    res.status(201).json(slot);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

exports.getTimeSlots = async (req, res) => {
  try {
    const slots = await menuService.getTimeSlots(req.user.restaurantId);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTimeSlot = async (req, res) => {
  try {
    await menuService.deleteTimeSlot(req.user.restaurantId, req.params.id);
    res.json({ message: 'TimeSlot deleted successfully' });
  } catch (error) {
    res.status(error.message === 'TimeSlot not found' ? 404 : 500).json({ message: error.message });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId || req.query.restaurantId;
    
    if (!restaurantId) {
      console.error('[GET /api/menu] Error: restaurantId is required but not provided');
      return res.status(400).json({ message: 'restaurantId required' });
    }

    console.log("Fetching menu for:", restaurantId);

    const filterByTime = req.query.filterByTime === 'true';
    console.log(`[GET /api/menu] Fetching menu for restaurantId: ${restaurantId}, filterByTime: ${filterByTime}`);

    const menuData = await menuService.getMenu(restaurantId, filterByTime);
    
    if (!menuData.items || menuData.items.length === 0) {
      console.log(`[GET /api/menu] No menu items found for restaurantId: ${restaurantId}`);
    }

    console.log(`[GET /api/menu] Successfully fetched menu for restaurantId: ${restaurantId}. Categories: ${menuData.categories.length}, Items: ${menuData.items.length}`);
    res.json(menuData);
  } catch (error) { 
    console.error(`[GET /api/menu] Error fetching menu: ${error.message}`);
    res.status(500).json({ message: 'Internal server error while fetching menu' }); 
  }
};

exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });
    const result = await menuService.bulkUpload(req.user.restaurantId, req.file.path);
    res.json(result);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};
