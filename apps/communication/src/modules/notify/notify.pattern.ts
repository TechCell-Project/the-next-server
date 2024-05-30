export const NotifyEventPattern = {
    subscribeToTopic: { emit: 'notify.subscribeToTopic' },
    unsubscribeToTopic: { emit: 'notify.unsubscribeToTopic' },
    sendNotification: { emit: 'notify.sendNotification' },
    sendNotificationToTopic: { emit: 'notify.sendNotificationToTopic' },
} as const;
