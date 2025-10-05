const cron = require('node-cron');
const { News, Subscriber } = require('../models');
const { Op } = require('sequelize');
const { sendNewsletterEmail } = require('./mail.service');

const service = {};

service.publishScheduledNews = async () => {
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

service.sendWeeklyNewsletter = async () => {
  try {
    console.log('Running weekly newsletter job...');
    const subscribers = await Subscriber.findAll();
    if (subscribers.length === 0) {
      console.log('No subscribers to send newsletter to.');
      return;
    }

    const latestNews = await News.findAll({
      where: { status: 'published' },
      order: [['publishedAt', 'DESC']],
      limit: 5,
    });

    if (latestNews.length === 0) {
      console.log('No news to send in the newsletter.');
      return;
    }

    for (const subscriber of subscribers) {
      await sendNewsletterEmail(subscriber.email, latestNews);
    }

    console.log(`Weekly newsletter sent to ${subscribers.length} subscribers.`);
  } catch (error) {
    console.error('Error sending weekly newsletter:', error);
  }
};

service.startScheduler = () => {
  // Run every minute to check for scheduled news
  cron.schedule('* * * * *', service.publishScheduledNews);
  console.log('Scheduler started to check for scheduled news every minute.');

  // Run every Sunday at 9:00 AM for the weekly newsletter
  cron.schedule('0 9 * * 0', service.sendWeeklyNewsletter);
  console.log('Weekly newsletter scheduler started. Runs every Sunday at 9:00 AM.');
};

module.exports = service;