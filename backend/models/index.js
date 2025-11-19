const sequelize = require('../config/database');
const Campaign = require('./Campaign');
const Device = require('./Device');
const Jingle = require('./Jingle');
const Log = require('./Log');
const DeviceSchedule = require('./DeviceSchedule');
const DeviceScheduleJingle = require('./DeviceScheduleJingle');
const Brand = require('./Client');
const Company = require('./Company');
const CampaignJingle = require('./CampaignJingle');
const User = require('./User');

// Company-Brand (Client) associations

Company.hasMany(Brand, {
	foreignKey: 'companyId',
	as: 'brands',
});

Brand.belongsTo(Company, {
	foreignKey: 'companyId',
	as: 'company',
});

// User-Brand associations
Brand.hasMany(User, {
	foreignKey: 'brandId',
	as: 'users',
});

User.belongsTo(Brand, {
	foreignKey: 'brandId',
	as: 'brand',
});

// Backwards compatibility: several modules still request `client` alias
User.belongsTo(Brand, {
	foreignKey: 'brandId',
	as: 'client',
});

// Brand-Campaign associations
Brand.hasMany(Campaign, {
	foreignKey: 'brandId',
	as: 'campaigns',
});

Campaign.belongsTo(Brand, {
	foreignKey: 'brandId',
	as: 'brand',
});

// Legacy alias support when includes still reference `client`
Campaign.belongsTo(Brand, {
	foreignKey: 'brandId',
	as: 'client',
});

// Many-to-many Campaign-Jingle relationship
Campaign.belongsToMany(Jingle, {
	through: CampaignJingle,
	foreignKey: 'campaignId',
	otherKey: 'jingleId',
	as: 'jingles',
});

Jingle.belongsToMany(Campaign, {
	through: CampaignJingle,
	foreignKey: 'jingleId',
	otherKey: 'campaignId',
	as: 'campaigns',
});

Device.hasMany(Log, {
	foreignKey: 'deviceId',
	as: 'logs',
});

Log.belongsTo(Device, {
	foreignKey: 'deviceId',
	as: 'device',
});

Campaign.hasMany(Log, {
	foreignKey: 'campaignId',
	as: 'logs',
});

Log.belongsTo(Campaign, {
	foreignKey: 'campaignId',
	as: 'campaign',
});

Jingle.hasMany(Log, {
	foreignKey: 'jingleId',
	as: 'logs',
});

Log.belongsTo(Jingle, {
	foreignKey: 'jingleId',
	as: 'jingle',
});

// DeviceSchedule associations
Device.hasMany(DeviceSchedule, {
	foreignKey: 'deviceId',
	as: 'schedules',
});

DeviceSchedule.belongsTo(Device, {
	foreignKey: 'deviceId',
	as: 'device',
});

DeviceSchedule.hasMany(DeviceScheduleJingle, {
	foreignKey: 'deviceScheduleId',
	as: 'jingles',
});

DeviceScheduleJingle.belongsTo(DeviceSchedule, {
	foreignKey: 'deviceScheduleId',
	as: 'schedule',
});

DeviceScheduleJingle.belongsTo(Jingle, {
	foreignKey: 'jingleId',
	as: 'jingle',
});

Jingle.hasMany(DeviceScheduleJingle, {
	foreignKey: 'jingleId',
	as: 'deviceScheduleJingles',
});

module.exports = {
	sequelize,
	Campaign,
	Device,
	Jingle,
	Log,
	DeviceSchedule,
	DeviceScheduleJingle,
	Brand,
	// Backwards compatibility: some modules still import `Client`
	Client: Brand,
	Company,
	CampaignJingle,
	User,
};
