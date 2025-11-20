// services/emailTemplateService.js
const EmailTemplates = {
  /**
   * Campaign Created - Awaiting Approval (to Admins)
   */
  campaignCreatedToAdmins: (campaignName, userName, userEmail, campaignId) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .campaign-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .action-btn { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .detail-item { background: #f8f9fa; padding: 10px; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 New Campaign Created</h1>
            <p>Approval Required</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            <p>A new campaign has been created and requires your approval.</p>
            
            <div class="campaign-card">
                <h3 style="margin-top: 0; color: #333;">${campaignName}</h3>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Created By:</strong><br>
                        ${userName}<br>
                        <small>${userEmail}</small>
                    </div>
                    <div class="detail-item">
                        <strong>Created At:</strong><br>
                        ${new Date().toLocaleString()}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="${baseUrl}/campaigns" class="action-btn">
                        📋 Review Campaign
                    </a>
                    <a href="${baseUrl}/campaigns" class="action-btn" style="background: #007bff;">
                        📊 All Campaigns
                    </a>
                </div>
            </div>
            
            <p><strong>Action Required:</strong> Please review this campaign and approve or reject it in the admin panel.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
  },

  /**
   * Campaign Created - Confirmation (to User)
   */
  campaignCreatedToUser: (campaignName, userName) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Campaign Created Successfully</h1>
            <p>Pending Approval</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your campaign has been created successfully and is now pending approval.</p>
            
            <div class="status-card">
                <h3 style="color: #4CAF50; margin-top: 0;">${campaignName}</h3>
                <p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">Pending Approval</span></p>
                <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>Our team will review your campaign</li>
                <li>You'll receive a notification once approved</li>
                <li>Approval typically takes 1-24 hours</li>
            </ul>
            
            <p>You can track your campaign status from your dashboard.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>Thank you for using our platform!</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * Campaign Updated - Re-approval Required (to Admins)
   */
  campaignUpdatedToAdmins: (campaignName, userName, userEmail, campaignId, previousStatus) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .campaign-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .action-btn { display: inline-block; padding: 12px 30px; background: #ff9800; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px; }
        .status-change { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Campaign Updated</h1>
            <p>Re-approval Required</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            <p>An existing campaign has been updated and requires re-approval.</p>
            
            <div class="campaign-card">
                <h3 style="margin-top: 0; color: #333;">${campaignName}</h3>
                
                <div class="status-change">
                    <strong>Status Change:</strong><br>
                    <span style="color: #e74c3c;">${previousStatus}</span> → <span style="color: #ff9800;">Pending</span>
                </div>
                
                <p><strong>Updated By:</strong> ${userName} (${userEmail})</p>
                <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="${baseUrl}/campaigns" class="action-btn">
                        🔍 Review Changes
                    </a>
                    <a href="${baseUrl}/campaigns" class="action-btn" style="background: #007bff;">
                        📊 All Campaigns
                    </a>
                </div>
            </div>
            
            <p><strong>Note:</strong> This campaign was previously approved and requires re-approval due to recent changes.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * Campaign Updated - Confirmation (to User)
   */
  campaignUpdatedToUser: (campaignName, userName, requiresReapproval) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .reapproval-notice { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Campaign Updated</h1>
            <p>${requiresReapproval ? 'Re-approval Required' : 'Update Complete'}</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your campaign has been successfully updated.</p>
            
            <div class="status-card">
                <h3 style="color: #2196F3; margin-top: 0;">${campaignName}</h3>
                <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                ${requiresReapproval ? 
                  '<p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">Pending Re-approval</span></p>' :
                  '<p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Approved</span></p>'
                }
            </div>
            
            ${requiresReapproval ? `
            <div class="reapproval-notice">
                <strong>⚠️ Re-approval Required</strong>
                <p>Your campaign requires re-approval due to the changes made. Our team will review it shortly.</p>
            </div>
            ` : ''}
            
            <p>You will be notified once your campaign is approved and live.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>Thank you for using our platform!</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * Campaign Approved (to User)
   */
  campaignApprovedToUser: (campaignName, userName, approvedByName) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #4CAF50; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Campaign Approved!</h1>
            <p>Your campaign is now live</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Great news! Your campaign has been approved and is now live.</p>
            
            <div class="success-card">
                <h2 style="color: #4CAF50; margin-top: 0;">${campaignName}</h2>
                <p style="font-size: 18px; margin: 10px 0;">✅ <strong>Status: Live</strong></p>
                <p><strong>Approved By:</strong> ${approvedByName}</p>
                <p><strong>Approved At:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p><strong>What's next?</strong></p>
            <ul>
                <li>Your campaign is now being displayed</li>
                <li>You can track performance from your dashboard</li>
                <li>Make updates anytime - they'll require re-approval</li>
            </ul>
            
            <p style="text-align: center; margin-top: 25px;">
                <strong>Congratulations! 🎊</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>Your campaign is now reaching your audience!</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * Campaign Approved - Admin Notification
   */
  campaignApprovedToAdmins: (campaignName, approvedByName, campaignOwner) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Campaign Approved</h1>
            <p>Admin Notification</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            <p>A campaign has been approved and is now live.</p>
            
            <div class="info-card">
                <h3 style="margin-top: 0; color: #333;">${campaignName}</h3>
                <p><strong>Campaign Owner:</strong> ${campaignOwner}</p>
                <p><strong>Approved By:</strong> ${approvedByName}</p>
                <p><strong>Approved At:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Live</span></p>
            </div>
            
            <p>This campaign is now active and being displayed to the audience.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated notification.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * User Approved - Welcome Email (to User)
   */
  userApprovedToUser: (userName, approvedByName, frontendUrl) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .welcome-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #4CAF50; }
        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .feature-item { background: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center; }
        .cta-button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to LED Display System!</h1>
            <p>Your Account Has Been Approved</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div class="welcome-card">
                <h2 style="color: #4CAF50; margin-top: 0;">Account Approved ✅</h2>
                <p><strong>Approved By:</strong> ${approvedByName}</p>
                <p><strong>Approved On:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>You now have full access to all features of the LED Display System:</p>
            
            <div class="features-grid">
                <div class="feature-item">
                    <strong>🎬 Create Campaigns</strong>
                    <p>Upload and manage your video campaigns</p>
                </div>
                <div class="feature-item">
                    <strong>📊 Track Performance</strong>
                    <p>Monitor campaign analytics and performance</p>
                </div>
                <div class="feature-item">
                    <strong>📍 Location Targeting</strong>
                    <p>Display campaigns at specific locations</p>
                </div>
                <div class="feature-item">
                    <strong>⚡ Real-time Updates</strong>
                    <p>Instant notifications and status updates</p>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${frontendUrl}" class="cta-button">
                    🚀 Get Started Now
                </a>
            </div>

            <p>If you have any questions or need assistance, our support team is here to help!</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>We're excited to have you on board! 🎊</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * User Approved - Admin Notification
   */
  userApprovedToAdmins: (userName, userEmail, userRole, approvedByName) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .user-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .user-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .detail-box { background: #f8f9fa; padding: 12px; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ User Account Approved</h1>
            <p>Admin Team Notification</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            <p>A new user account has been approved and activated.</p>
            
            <div class="user-card">
                <h3 style="margin-top: 0; color: #333;">User Details</h3>
                
                <div class="user-details">
                    <div class="detail-box">
                        <strong>Name:</strong><br>
                        ${userName}
                    </div>
                    <div class="detail-box">
                        <strong>Email:</strong><br>
                        ${userEmail}
                    </div>
                    <div class="detail-box">
                        <strong>Role:</strong><br>
                        ${userRole}
                    </div>
                    <div class="detail-box">
                        <strong>Approved By:</strong><br>
                        ${approvedByName}
                    </div>
                </div>
                
                <p><strong>Approval Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Active</span></p>
            </div>
            
            <p>This user can now access all system features and create campaigns.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated notification.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * User Role Changed - Notification to User
   */
  userRoleChangedToUser: (userName, oldRole, newRole, changedByName) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .role-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .role-change { display: flex; justify-content: center; align-items: center; margin: 20px 0; }
        .role-arrow { margin: 0 20px; font-size: 24px; color: #666; }
        .role-badge { padding: 10px 20px; border-radius: 20px; font-weight: bold; }
        .old-role { background: #ffebee; color: #c62828; }
        .new-role { background: #e8f5e8; color: #2e7d32; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👤 Account Role Updated</h1>
            <p>Your permissions have been changed</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your account role has been updated in the LED Display System.</p>
            
            <div class="role-card">
                <h3 style="margin-top: 0;">Role Change</h3>
                
                <div class="role-change">
                    <div class="role-badge old-role">${oldRole}</div>
                    <div class="role-arrow">→</div>
                    <div class="role-badge new-role">${newRole}</div>
                </div>
                
                <p><strong>Changed By:</strong> ${changedByName}</p>
                <p><strong>Effective:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            ${newRole === 'admin' || newRole === 'superadmin' ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <strong>🎯 New Permissions:</strong>
                <p>As an <strong>${newRole}</strong>, you now have access to administrative features including user management, campaign approvals, and system analytics.</p>
            </div>
            ` : ''}
            
            <p>If you have any questions about your new role, please contact the system administrator.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>Your account permissions have been updated successfully.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * User Role Changed - Admin Notification
   */
  userRoleChangedToAdmins: (targetUserName, targetUserEmail, oldRole, newRole, changedByName) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .change-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .role-comparison { display: flex; justify-content: space-around; margin: 20px 0; }
        .role-item { text-align: center; padding: 15px; }
        .role-old { color: #c62828; }
        .role-new { color: #2e7d32; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 User Role Changed</h1>
            <p>Admin Team Notification</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            <p>A user role has been changed in the system.</p>
            
            <div class="change-card">
                <h3 style="margin-top: 0;">Change Details</h3>
                
                <p><strong>User:</strong> ${targetUserName} (${targetUserEmail})</p>
                <p><strong>Changed By:</strong> ${changedByName}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                
                <div class="role-comparison">
                    <div class="role-item role-old">
                        <strong>Previous Role</strong>
                        <div style="font-size: 18px; margin-top: 5px;">${oldRole}</div>
                    </div>
                    <div style="align-self: center; font-size: 20px;">→</div>
                    <div class="role-item role-new">
                        <strong>New Role</strong>
                        <div style="font-size: 18px; margin-top: 5px;">${newRole}</div>
                    </div>
                </div>
            </div>
            
            <p>This change is effective immediately and the user's permissions have been updated accordingly.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated notification for team awareness.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * User Registration Rejected - Notification to User
   */
  userRejectedToUser: (userName, rejectedByName, reason) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .rejection-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336; }
        .reason-box { background: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .support-info { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Registration Not Approved</h1>
            <p>Account Registration Update</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div class="rejection-card">
                <h3 style="color: #d32f2f; margin-top: 0;">Registration Declined</h3>
                <p>We regret to inform you that your registration for the LED Display System has not been approved.</p>
                
                <p><strong>Decision By:</strong> ${rejectedByName}</p>
                <p><strong>Decision Date:</strong> ${new Date().toLocaleString()}</p>
                
                ${reason ? `
                <div class="reason-box">
                    <strong>Reason Provided:</strong>
                    <p>${reason}</p>
                </div>
                ` : ''}
            </div>
            
            <div class="support-info">
                <strong>Need More Information?</strong>
                <p>If you believe this was a mistake or would like more details about this decision, please contact our support team for assistance.</p>
            </div>
            
            <p>Thank you for your interest in our platform.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>We appreciate your understanding.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * User Registration Rejected - Admin Notification
   */
  userRejectedToAdmins: (userName, userEmail, userRole, rejectedByName, reason) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .rejection-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .user-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .detail-box { background: #f8f9fa; padding: 12px; border-radius: 5px; }
        .reason-box { background: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ User Registration Rejected</h1>
            <p>Admin Team Notification</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            <p>A user registration has been rejected and the account has been removed.</p>
            
            <div class="rejection-card">
                <h3 style="margin-top: 0; color: #d32f2f;">Rejected User</h3>
                
                <div class="user-details">
                    <div class="detail-box">
                        <strong>Name:</strong><br>
                        ${userName}
                    </div>
                    <div class="detail-box">
                        <strong>Email:</strong><br>
                        ${userEmail}
                    </div>
                    <div class="detail-box">
                        <strong>Role:</strong><br>
                        ${userRole}
                    </div>
                    <div class="detail-box">
                        <strong>Rejected By:</strong><br>
                        ${rejectedByName}
                    </div>
                </div>
                
                <p><strong>Rejection Time:</strong> ${new Date().toLocaleString()}</p>
                
                ${reason ? `
                <div class="reason-box">
                    <strong>Rejection Reason:</strong>
                    <p>${reason}</p>
                </div>
                ` : ''}
            </div>
            
            <p>This user account has been permanently deleted from the system.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated notification for audit purposes.</p>
        </div>
    </div>
</html>
    `;
  },


  /**
   * Registration Successful - Welcome Email (to User)
   */
  registrationSuccessToUser: (userName, userEmail, frontendUrl) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #2196F3; }
        .process-steps { margin: 25px 0; }
        .step { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #e3f2fd; border-radius: 8px; }
        .step-number { background: #2196F3; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
        .step-content { flex: 1; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Registration Successful!</h1>
            <p>Welcome to LED Display System</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Thank you for registering with the LED Display System! Your account has been created successfully.</p>
            
            <div class="status-card">
                <h3 style="color: #2196F3; margin-top: 0;">⏳ Pending Approval</h3>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Registered:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">Awaiting Approval</span></p>
            </div>

            <div class="process-steps">
                <h4 style="text-align: center; color: #333;">What happens next?</h4>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <strong>Review Process</strong>
                        <p>Our admin team will review your registration</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <strong>Approval Notification</strong>
                        <p>You'll receive an email once your account is approved</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <strong>Get Started</strong>
                        <p>Access all features and create your first campaign</p>
                    </div>
                </div>
            </div>

            <p><strong>Typical Approval Time:</strong> 1-24 hours during business days</p>
            <p>If you have urgent needs, please contact our support team.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>We're excited to have you join our platform! 🚀</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * New User Registration - Admin Notification
   */
  newUserRegistrationToAdmins: (userName, userEmail, userRole, userId, frontendUrl) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .user-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .user-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .detail-box { background: #fff8e1; padding: 12px; border-radius: 5px; }
        .action-buttons { text-align: center; margin: 25px 0; }
        .action-btn { display: inline-block; padding: 12px 24px; margin: 0 10px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .approve-btn { background: #4CAF50; }
        .review-btn { background: #2196F3; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👤 New User Registration</h1>
            <p>Approval Required</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            <p>A new user has registered and requires your approval.</p>
            
            <div class="user-card">
                <h3 style="margin-top: 0; color: #333;">Registration Details</h3>
                
                <div class="user-details">
                    <div class="detail-box">
                        <strong>Name:</strong><br>
                        ${userName}
                    </div>
                    <div class="detail-box">
                        <strong>Email:</strong><br>
                        ${userEmail}
                    </div>
                    <div class="detail-box">
                        <strong>Role:</strong><br>
                        ${userRole}
                    </div>
                    <div class="detail-box">
                        <strong>User ID:</strong><br>
                        ${userId}
                    </div>
                </div>
                
                <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> <span style="color: #FF9800; font-weight: bold;">Pending Approval</span></p>
            </div>

            <div class="action-buttons">
                <a href="${frontendUrl}/approvals" class="action-btn review-btn">
                    📋 Review User
                </a>
                <a href="${frontendUrl}/approvals" class="action-btn">
                    👥 All Users
                </a>
            </div>

            <p><strong>Action Required:</strong> Please review this registration in the admin panel and approve or reject accordingly.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * New User Registration - SuperAdmin Priority Notification
   */
  newUserRegistrationToSuperAdmins: (userName, userEmail, userRole, userId, totalPendingUsers) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .priority-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9C27B0; }
        .stats-box { background: #f3e5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
        .user-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .cta-button { display: inline-block; padding: 12px 30px; background: #9C27B0; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New User Registration</h1>
            <p>SuperAdmin Priority Notification</p>
        </div>
        
        <div class="content">
            <p>Hello SuperAdmin,</p>
            
            <div class="priority-card">
                <h3 style="margin-top: 0; color: #7B1FA2;">New Registration Requires Attention</h3>
                
                <div class="stats-box">
                    <strong>Pending Approvals:</strong> ${totalPendingUsers} user(s)
                </div>
                
                <div class="user-info">
                    <p><strong>New User:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Role:</strong> ${userRole}</p>
                    <p><strong>Registered:</strong> ${new Date().toLocaleString()}</p>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${baseUrl}/approvals" class="cta-button">
                    ⚡ Review Now
                </a>
            </div>

            <p>As a SuperAdmin, you have priority access to review and approve new user registrations.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System - SuperAdmin Panel</p>
            <p>Priority notification for immediate attention.</p>
        </div>
    </div>
</html>
    `;
  },


  /**
   * Pause Request Received - Admin Notification
   */
  pauseRequestToAdmins: (adminName, campaignName, requestedBy, reason, approveToken, rejectToken, frontendUrl) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5123';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .request-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .campaign-details { background: #fff8e1; padding: 20px; border-radius: 5px; margin: 15px 0; }
        .action-buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 28px; margin: 10px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s ease; }
        .btn-approve { background: #4CAF50; color: white; }
        .btn-approve:hover { background: #45a049; transform: translateY(-2px); }
        .btn-reject { background: #f44336; color: white; }
        .btn-reject:hover { background: #da190b; transform: translateY(-2px); }
        .manual-review { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .token-info { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 11px; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏸️ Campaign Pause Request</h1>
            <p>Immediate Action Required</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${adminName}</strong>,</p>
            <p>A client has requested to pause a campaign that requires your review.</p>
            
            <div class="request-card">
                <h3 style="margin-top: 0; color: #333;">Request Details</h3>
                
                <div class="campaign-details">
                    <p><strong>🎬 Campaign:</strong> ${campaignName}</p>
                    <p><strong>👤 Requested By:</strong> ${requestedBy}</p>
                    <p><strong>🕒 Request Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>📝 Reason:</strong> ${reason || "No specific reason provided"}</p>
                </div>

                <div class="action-buttons">
                    <p><strong>Quick One-Click Actions:</strong></p>
                    <a href="${frontendUrl}/campaigns" class="btn btn-approve">
                        ✅ APPROVE PAUSE
                    </a>
                    <a href="${frontendUrl}/campaigns" class="btn btn-reject">
                        ❌ REJECT PAUSE
                    </a>
                </div>

                <div class="manual-review">
                    <p><strong>Prefer to review manually?</strong></p>
                    <a href="${frontendUrl}/campaigns" style="color: #2196F3; text-decoration: none; font-weight: bold;">
                        📊 Go to Admin Dashboard
                    </a>
                </div>
            </div>

            <p><em>⏰ This pause request will expire in 24 hours.</em></p>
        </div>
        
        <div class="footer">
            <p>LED Display System Admin Panel</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
  },

  /**
   * Pause Request Submitted - User Confirmation
   */
  pauseRequestToUser: (userName, campaignName) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .confirmation-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #2196F3; }
        .process-timeline { margin: 25px 0; }
        .timeline-step { display: flex; align-items: center; margin: 15px 0; padding: 12px; background: #e3f2fd; border-radius: 8px; }
        .step-icon { font-size: 20px; margin-right: 15px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏸️ Pause Request Submitted</h1>
            <p>Under Administrative Review</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div class="confirmation-card">
                <h3 style="color: #2196F3; margin-top: 0;">Request Received ✅</h3>
                <p><strong>Campaign:</strong> ${campaignName}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Status:</strong> <span style="color: #FF9800; font-weight: bold;">Pending Approval</span></p>
            </div>

            <div class="process-timeline">
                <h4 style="text-align: center; color: #333;">What happens next?</h4>
                
                <div class="timeline-step">
                    <div class="step-icon">📨</div>
                    <div>
                        <strong>Notification Sent</strong>
                        <p>Admin team has been notified of your request</p>
                    </div>
                </div>
                
                <div class="timeline-step">
                    <div class="step-icon">👥</div>
                    <div>
                        <strong>Under Review</strong>
                        <p>Our team is reviewing your pause request</p>
                    </div>
                </div>
                
                <div class="timeline-step">
                    <div class="step-icon">✅</div>
                    <div>
                        <strong>Decision Notification</strong>
                        <p>You'll be notified once a decision is made</p>
                    </div>
                </div>
            </div>

            <p><strong>Typical Response Time:</strong> 1-4 hours during business hours</p>
            <p>You will receive an email notification once your request is approved or rejected.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>Thank you for your patience during the review process.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * Pause Request Approved - User Notification
   */
  pauseApprovedToUser: (userName, campaignName, approvedByName) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .approval-card { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #4CAF50; }
        .next-steps { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Pause Request Approved</h1>
            <p>Your Campaign Has Been Paused</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div class="approval-card">
                <h2 style="color: #4CAF50; margin-top: 0;">⏸️ Campaign Paused</h2>
                <p style="font-size: 18px; margin: 15px 0;"><strong>Campaign:</strong> ${campaignName}</p>
                <p><strong>Approved By:</strong> ${approvedByName}</p>
                <p><strong>Effective:</strong> ${new Date().toLocaleString()}</p>
                <p style="color: #4CAF50; font-weight: bold; font-size: 16px; margin-top: 15px;">
                    ✅ Your campaign has been successfully paused
                </p>
            </div>

            <div class="next-steps">
                <h4 style="margin-top: 0; color: #2e7d32;">What This Means:</h4>
                <ul style="text-align: left;">
                    <li>Your campaign is no longer being displayed</li>
                    <li>All scheduled displays have been stopped</li>
                    <li>You can resume the campaign anytime from your dashboard</li>
                    <li>Campaign data and settings are preserved</li>
                </ul>
            </div>

            <p>You can manage your paused campaigns from your dashboard and resume them when ready.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>Your campaign has been paused as requested.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * Pause Request Rejected - User Notification
   */
  pauseRejectedToUser: (userName, campaignName, rejectedByName, reason) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .rejection-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336; }
        .reason-box { background: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .contact-info { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Pause Request Not Approved</h1>
            <p>Campaign Continues Running</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div class="rejection-card">
                <h3 style="color: #d32f2f; margin-top: 0;">Request Declined</h3>
                <p><strong>Campaign:</strong> ${campaignName}</p>
                <p><strong>Decision By:</strong> ${rejectedByName}</p>
                <p><strong>Decision Date:</strong> ${new Date().toLocaleString()}</p>
                
                ${reason ? `
                <div class="reason-box">
                    <strong>Reason Provided:</strong>
                    <p>${reason}</p>
                </div>
                ` : ''}
                
                <p style="color: #d32f2f; font-weight: bold;">
                    ⚠️ Your campaign continues to run as normal
                </p>
            </div>

            <div class="contact-info">
                <strong>Need More Information?</strong>
                <p>If you have questions about this decision or would like to discuss alternative options, please contact our support team.</p>
            </div>

            <p>You can submit a new pause request with additional context if needed.</p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>Thank you for your understanding.</p>
        </div>
    </div>
</html>
    `;
  },

  /**
   * Forgot Password OTP - Email to User
   */
  forgotPasswordOtp: (userName, otp, expiresInMinutes = 10) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #667eea; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 20px 0; font-family: 'Courier New', monospace; }
        .warning-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Your OTP Code</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>${userName || "User"}</strong>,</p>
            <p>You have requested to reset your password. Use the OTP code below to verify your identity.</p>
            
            <div class="otp-box">
                <h3 style="margin-top: 0; color: #333;">Your OTP Code</h3>
                <div class="otp-code">${otp}</div>
                <p style="color: #666; margin-top: 10px;">This code will expire in <strong>${expiresInMinutes} minutes</strong></p>
            </div>

            <div class="warning-box">
                <strong>⚠️ Security Notice:</strong>
                <p>If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol style="text-align: left;">
                <li>Enter the OTP code in the password reset form</li>
                <li>Verify the OTP</li>
                <li>Set your new password</li>
                <li>Wait for admin approval (if required)</li>
            </ol>

            <p style="color: #666; font-size: 14px; margin-top: 25px;">
                <strong>Note:</strong> For security reasons, this OTP is valid for ${expiresInMinutes} minutes only. Do not share this code with anyone.
            </p>
        </div>
        
        <div class="footer">
            <p>LED Display System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }



};


module.exports = EmailTemplates;