const sequelize = require("../config/sequelize");
const { Sequelize } = require("sequelize");

const db = {};

// Import models
db.User = require("./user.model")(sequelize);
db.News = require("./news.model")(sequelize);
db.NewsVersion = require("./newsVersion.model")(sequelize);
db.ENewspaper = require("./enewspaper.model")(sequelize);
db.Story = require("./story.model")(sequelize);
db.Gallery = require("./gallery.model")(sequelize);
db.Donation = require("./donation.model")(sequelize);
db.Subscriber = require("./subscriber.model")(sequelize);
db.Subscription = require("./subscription.model")(sequelize);
// db.SubscriptionTemp = require('./subscriptionTemp.model')(sequelize);

// ================= Associations ================= //

// User <-> News
db.User.hasMany(db.News, { foreignKey: "authorId", as: "news" });
db.News.belongsTo(db.User, { as: "author", foreignKey: "authorId" });

// News <-> NewsVersion
db.News.hasMany(db.NewsVersion, { foreignKey: "newsId", as: "versions" });
db.NewsVersion.belongsTo(db.News, { as: "news", foreignKey: "newsId" });

// User <-> Donation
db.User.hasMany(db.Donation, { foreignKey: "userId", as: "donations" });
db.Donation.belongsTo(db.User, { as: "user", foreignKey: "userId" });

// User <-> ENewspaper
db.User.hasMany(db.ENewspaper, { foreignKey: "userId", as: "enewspapers" });
db.ENewspaper.belongsTo(db.User, { as: "user", foreignKey: "userId" });

// User <-> Subscription
db.User.hasOne(db.Subscription, { foreignKey: 'userId', as: 'subscription' });
db.Subscription.belongsTo(db.User, { as: 'user', foreignKey: 'userId' });

// ================================================= //

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
