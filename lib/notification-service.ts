/**
 * Notification Service for managing system-wide notifications
 */

export interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReports: boolean
  systemAlerts: boolean
  tenderUpdates: boolean
  userRegistrations: boolean
  bidSubmissions: boolean
  deadlineReminders: boolean
  vendorQuestions: boolean
  awardNotifications: boolean
  urgentAlerts: boolean
  emailFrequency: "immediate" | "hourly" | "daily" | "weekly" | "never"
}

export interface NotificationData {
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  category: "system" | "tender" | "user" | "bid"
  recipients: string[] // user IDs
  actionUrl?: string
  metadata?: Record<string, any>
}

export class NotificationService {
  private static instance: NotificationService

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Send notification to users based on their preferences
   */
  async sendNotification(data: NotificationData): Promise<void> {
    try {
      // Get user preferences for each recipient
      for (const userId of data.recipients) {
        const preferences = await this.getUserPreferences(userId)

        if (this.shouldSendNotification(data, preferences)) {
          // Send in-app notification
          await this.createInAppNotification(userId, data)

          // Send email if enabled
          if (preferences.emailNotifications && this.shouldSendEmail(data, preferences)) {
            await this.sendEmailNotification(userId, data)
          }

          // Send push notification if enabled
          if (preferences.pushNotifications) {
            await this.sendPushNotification(userId, data)
          }
        }
      }
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  /**
   * Send notification for tender-related events
   */
  async sendTenderNotification(
    event: "created" | "updated" | "deadline_approaching" | "closed" | "awarded",
    tenderId: string,
    data: Partial<NotificationData>,
  ): Promise<void> {
    const notificationData: NotificationData = {
      type: "info",
      category: "tender",
      actionUrl: `/admin/tenders/${tenderId}`,
      recipients: [], // Will be populated based on event type
      ...data,
    }

    switch (event) {
      case "created":
        notificationData.recipients = await this.getAdminUsers()
        notificationData.title = "New Tender Created"
        break
      case "deadline_approaching":
        notificationData.recipients = await this.getTenderParticipants(tenderId)
        notificationData.type = "warning"
        notificationData.title = "Tender Deadline Approaching"
        break
      case "awarded":
        notificationData.recipients = await this.getTenderParticipants(tenderId)
        notificationData.type = "success"
        notificationData.title = "Tender Awarded"
        break
    }

    await this.sendNotification(notificationData)
  }

  /**
   * Send notification for bid-related events
   */
  async sendBidNotification(
    event: "submitted" | "updated" | "accepted" | "rejected",
    bidId: string,
    tenderId: string,
    data: Partial<NotificationData>,
  ): Promise<void> {
    const notificationData: NotificationData = {
      type: "info",
      category: "bid",
      actionUrl: `/admin/tenders/${tenderId}`,
      recipients: [],
      ...data,
    }

    switch (event) {
      case "submitted":
        notificationData.recipients = await this.getTenderCreators(tenderId)
        notificationData.title = "New Bid Submitted"
        break
      case "accepted":
        notificationData.recipients = await this.getBidVendor(bidId)
        notificationData.type = "success"
        notificationData.title = "Bid Accepted"
        break
    }

    await this.sendNotification(notificationData)
  }

  /**
   * Send system alerts to administrators
   */
  async sendSystemAlert(
    level: "info" | "warning" | "error",
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const notificationData: NotificationData = {
      type: level,
      title,
      message,
      category: "system",
      recipients: await this.getAdminUsers(),
      metadata,
    }

    await this.sendNotification(notificationData)
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(data: NotificationData, preferences: NotificationPreferences): boolean {
    switch (data.category) {
      case "system":
        return preferences.systemAlerts
      case "tender":
        return preferences.tenderUpdates
      case "user":
        return preferences.userRegistrations
      case "bid":
        return preferences.bidSubmissions
      default:
        return true
    }
  }

  /**
   * Check if email should be sent based on frequency settings
   */
  private shouldSendEmail(data: NotificationData, preferences: NotificationPreferences): boolean {
    if (preferences.emailFrequency === "never") return false
    if (preferences.emailFrequency === "immediate") return true

    // For non-immediate frequencies, we would batch emails
    // This is a simplified version - in production, you'd implement proper batching
    return data.type === "error" || (preferences.urgentAlerts && data.type === "warning")
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(userId: string, data: NotificationData): Promise<void> {
    // TODO: Store notification in database
    console.log(`Creating in-app notification for user ${userId}:`, data)
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(userId: string, data: NotificationData): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email notification to user ${userId}:`, data)
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(userId: string, data: NotificationData): Promise<void> {
    // TODO: Integrate with push notification service
    console.log(`Sending push notification to user ${userId}:`, data)
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // TODO: Fetch from database
    return {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      systemAlerts: true,
      tenderUpdates: true,
      userRegistrations: true,
      bidSubmissions: true,
      deadlineReminders: true,
      vendorQuestions: true,
      awardNotifications: true,
      urgentAlerts: false,
      emailFrequency: "daily",
    }
  }

  /**
   * Helper methods to get user groups
   */
  private async getAdminUsers(): Promise<string[]> {
    // TODO: Fetch admin user IDs from database
    return ["admin-1", "admin-2"]
  }

  private async getTenderCreators(tenderId: string): Promise<string[]> {
    // TODO: Fetch tender creator IDs from database
    return ["creator-1"]
  }

  private async getTenderParticipants(tenderId: string): Promise<string[]> {
    // TODO: Fetch all users involved in the tender
    return ["creator-1", "vendor-1", "vendor-2"]
  }

  private async getBidVendor(bidId: string): Promise<string[]> {
    // TODO: Fetch vendor ID who submitted the bid
    return ["vendor-1"]
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()
