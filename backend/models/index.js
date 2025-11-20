const sequelize = require('../config/database');

// MODELS
const AudioCampaign = require('./AudioCampaign');   // renamed model
const VideoCampaign = require('./VideoCampaign');   // new model
const Device = require('./Device');
const Jingle = require('./Jingle');
const Log = require('./Log');
const DeviceSchedule = require('./DeviceSchedule');
const DeviceScheduleJingle = require('./DeviceScheduleJingle');
const Brand = require('./Client');
const Company = require('./Company');
const CampaignJingle = require('./CampaignJingle');
const User = require('./User');

/* ---------------------------------------------------------
   COMPANY ↔ BRAND ASSOCIATIONS
--------------------------------------------------------- */

Company.hasMany(Brand, {
    foreignKey: 'companyId',
    as: 'brands',
});

Brand.belongsTo(Company, {
    foreignKey: 'companyId',
    as: 'company',
});

/* ---------------------------------------------------------
   BRAND ↔ USER
--------------------------------------------------------- */

Brand.hasMany(User, {
    foreignKey: 'brandId',
    as: 'users',
});

User.belongsTo(Brand, {
    foreignKey: 'brandId',
    as: 'brand',
});

// Backwards compatibility
User.belongsTo(Brand, {
    foreignKey: 'brandId',
    as: 'client',
});

/* ---------------------------------------------------------
   BRAND ↔ AUDIO CAMPAIGN
--------------------------------------------------------- */

Brand.hasMany(AudioCampaign, {
    foreignKey: 'brandId',
    as: 'audioCampaigns',
});

AudioCampaign.belongsTo(Brand, {
    foreignKey: 'brandId',
    as: 'brand',
});

// Backwards compatibility for old includes using 'client'
AudioCampaign.belongsTo(Brand, {
    foreignKey: 'brandId',
    as: 'client',
});

/* ---------------------------------------------------------
   BRAND ↔ VIDEO CAMPAIGN
--------------------------------------------------------- */

Brand.hasMany(VideoCampaign, {
    foreignKey: 'brandId',
    as: 'videoCampaigns',
});

VideoCampaign.belongsTo(Brand, {
    foreignKey: 'brandId',
    as: 'brand',
});

// Backwards compatibility for old code
VideoCampaign.belongsTo(Brand, {
    foreignKey: 'brandId',
    as: 'client',
});

/* ---------------------------------------------------------
   AUDIO CAMPAIGN ↔ JINGLE (Many-to-Many)
--------------------------------------------------------- */

AudioCampaign.belongsToMany(Jingle, {
    through: CampaignJingle,
    foreignKey: 'campaignId',
    otherKey: 'jingleId',
    as: 'jingles',
});

Jingle.belongsToMany(AudioCampaign, {
    through: CampaignJingle,
    foreignKey: 'jingleId',
    otherKey: 'campaignId',
    as: 'audioCampaigns',
});

/* ---------------------------------------------------------
   VIDEO CAMPAIGN ↔ JINGLE (OPTIONAL)
   (If video campaigns don't use jingles, skip this)
--------------------------------------------------------- */

// If jingles are only for audio campaigns, do NOT connect video campaigns
// If video campaigns will also use jingles, uncomment below:

// VideoCampaign.belongsToMany(Jingle, {
//     through: CampaignJingle,
//     foreignKey: 'campaignId',
//     otherKey: 'jingleId',
//     as: 'jingles',
// });

// Jingle.belongsToMany(VideoCampaign, {
//     through: CampaignJingle,
//     foreignKey: 'jingleId',
//     otherKey: 'campaignId',
//     as: 'videoCampaigns',
// });

/* ---------------------------------------------------------
   DEVICE ↔ LOG
--------------------------------------------------------- */

Device.hasMany(Log, {
    foreignKey: 'deviceId',
    as: 'logs',
});

Log.belongsTo(Device, {
    foreignKey: 'deviceId',
    as: 'device',
});

/* ---------------------------------------------------------
   AUDIO CAMPAIGN ↔ LOG
--------------------------------------------------------- */

AudioCampaign.hasMany(Log, {
    foreignKey: 'campaignId',
    as: 'logs',
});

Log.belongsTo(AudioCampaign, {
    foreignKey: 'campaignId',
    as: 'audioCampaign',
});

/* ---------------------------------------------------------
   VIDEO CAMPAIGN ↔ LOG
--------------------------------------------------------- */

VideoCampaign.hasMany(Log, {
    foreignKey: 'videoCampaignId',
    as: 'videoLogs',
});

Log.belongsTo(VideoCampaign, {
    foreignKey: 'videoCampaignId',
    as: 'videoCampaign',
});

/* ---------------------------------------------------------
   JINGLE ↔ LOG
--------------------------------------------------------- */

Jingle.hasMany(Log, {
    foreignKey: 'jingleId',
    as: 'logs',
});

Log.belongsTo(Jingle, {
    foreignKey: 'jingleId',
    as: 'jingle',
});

/* ---------------------------------------------------------
   DEVICE SCHEDULE
--------------------------------------------------------- */

Device.hasMany(DeviceSchedule, {
    foreignKey: 'deviceId',
    as: 'schedules',
});

DeviceSchedule.belongsTo(Device, {
    foreignKey: 'deviceId',
    as: 'device',
});

/* ---------------------------------------------------------
   DEVICE SCHEDULE ↔ JINGLES
--------------------------------------------------------- */

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
    AudioCampaign,
    VideoCampaign,
    Device,
    Jingle,
    Log,
    DeviceSchedule,
    DeviceScheduleJingle,
    Brand,
    Client: Brand, // backward compatibility
    Company,
    CampaignJingle,
    User,
};
