const cron = require('node-cron');
const Order = require('../modules/order/order.model');

// ==========================================
// BACKGROUND JOBS
// ==========================================

const startCronJobs = () => {
  // Configurable retention period via environment variable
  const envRetention = parseInt(process.env.ORDER_RETENTION_DAYS, 10);
  const retentionDays = isNaN(envRetention) ? 30 : envRetention;

  // Run the job daily at midnight (00:00) server time
  // The expression '0 0 * * *' means: "At minute 0 past hour 0."
  cron.schedule('0 0 * * *', async () => {
    // 1. Safety Check: Avoid accidental catastrophic deletion
    if (retentionDays < 7) {
      console.warn(`[CRON] WARNING: ORDER_RETENTION_DAYS (${retentionDays}) is suspiciously low. Hard-limiting to 7 days for safety.`);
    }
    const safeRetention = Math.max(retentionDays, 7);

    console.log(`[CRON] Starting daily order cleanup job. Target retention: ${safeRetention} days.`);
    try {
      // 2. Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - safeRetention);
      
      // Double check it's definitely in the past before executing query
      if (cutoffDate >= new Date()) {
          throw new Error('Calculated cutoffDate is invalid (in the future). Aborting.');
      }

      // 2. Perform deletion
      // This deletes all orders where the 'createdAt' timestamp is strictly less than cutoffDate
      // Active orders created within the last `safeRetention` days are safely ignored.
      const result = await Order.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      // 3. Log results
      console.log(`[CRON] Success: Deleted ${result.deletedCount} orders older than ${safeRetention} days (${cutoffDate.toISOString()}).`);
    } catch (error) {
      // 4. Handle errors
      console.error('[CRON] Error executing daily order cleanup job:', error.message);
    }
  });

  console.log('[CRON] Scheduled daily order cleanup job (runs at midnight).');
};

module.exports = { startCronJobs };
