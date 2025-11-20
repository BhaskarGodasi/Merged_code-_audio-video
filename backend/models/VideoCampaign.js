// backend/models/VideoCampaign.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust path if needed

const VideoCampaign = sequelize.define(
  'VideoCampaign',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, field: 'id' },

    clientName: { type: DataTypes.STRING, allowNull: true, field: 'client_name' },
    campaignName: { type: DataTypes.STRING, allowNull: false, field: 'campaign_name' },
    contactPerson: { type: DataTypes.STRING, allowNull: true, field: 'contact_person' },
    email: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true }, field: 'email' },
    phoneNumber: { type: DataTypes.STRING, allowNull: true, field: 'phone_number' },
    salesManagerName: { type: DataTypes.STRING, allowNull: true, field: 'sales_manager_name' },

    startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'start_date' },
    endDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'end_date' },

    spotsPerDay: { type: DataTypes.INTEGER, allowNull: true, field: 'spots_per_day' },

    // locations stored as JSON/ARRAY in DB, map to JSON for Sequelize usage
    locations: { type: DataTypes.JSON, allowNull: true, field: 'locations' },

    status: { type: DataTypes.STRING, allowNull: true, field: 'status' },

    reason: { type: DataTypes.TEXT, allowNull: true, field: 'reason' },

    createdBy: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by' },
    approvedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'approved_by' },

    createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at' },
    rejectedReason: { type: DataTypes.TEXT, allowNull: true, field: 'rejected_reason' },

    // video binary stored as buffer
    video: { type: DataTypes.BLOB('long'), allowNull: true, field: 'video' },

    stopRequested: { type: DataTypes.BOOLEAN, allowNull: true, field: 'stop_requested', defaultValue: false },
    stopReason: { type: DataTypes.TEXT, allowNull: true, field: 'stop_reason' },
    createdByName: { type: DataTypes.STRING, allowNull: true, field: 'created_by_name' },

    stopRequestedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'stop_requested_by' },
    stopRequestedAt: { type: DataTypes.DATE, allowNull: true, field: 'stop_requested_at' },
    statusUpdatedAt: { type: DataTypes.DATE, allowNull: true, field: 'status_updated_at' },

    sequence: { type: DataTypes.INTEGER, allowNull: true, field: 'sequence' },

    // jsonb in postgres -> JSON
    deviceSequences: { type: DataTypes.JSON, allowNull: true, field: 'device_sequences' },

    deviceId: { type: DataTypes.STRING, allowNull: true, field: 'device_id' },

    // Additional fields you asked for (video metadata & company link)
    companyId: { type: DataTypes.INTEGER, allowNull: true, field: 'company_id' },
    videoName: { type: DataTypes.STRING, allowNull: true, field: 'video_name' },
    videoSize: { type: DataTypes.INTEGER, allowNull: true, field: 'video_size' },
    videoMimeType: { type: DataTypes.STRING, allowNull: true, field: 'video_mime_type' },
    duration: { type: DataTypes.INTEGER, allowNull: true, field: 'duration' },
    uploadedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'uploaded_by' },

    approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
    rejectedAt: { type: DataTypes.DATE, allowNull: true, field: 'rejected_at' },

    campaignType: { type: DataTypes.STRING, allowNull: true, field: 'campaign_type' }, // 'video' | 'audio' etc.
  },
  {
    tableName: 'campaigns', // maps to existing campaigns table
    timestamps: false, // your DB uses created_at / updated fields; adjust if you use Sequelize timestamps
  }
);

module.exports = VideoCampaign;
