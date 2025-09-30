const { News } = require('../models');
const { Op } = require('sequelize');

const publishScheduledNews = async () => {
  try {
    const now = new Date();
    const scheduledNews = await News.findAll({
      where: {
        status: 'scheduled',
        publishedAt: {
          [Op.lte]: now,
        },
      },
    });

    if (scheduledNews.length > 0) {
      console.log(`Found ${scheduledNews.length} news article(s) to publish.`);
      for (const news of scheduledNews) {
        news.status = 'published';
        await news.save();
        console.log(`Published news article with ID: ${news.id}`);
      }
    }
  } catch (error) {
    console.error('Error publishing scheduled news:', error);
  }
};

const startScheduler = () => {
  // Run every minute
  setInterval(publishScheduledNews, 60 * 1000);
  console.log('Scheduler started to check for scheduled news every minute.');
};

module.exports = {
  startScheduler,
};